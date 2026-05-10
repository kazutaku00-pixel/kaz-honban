-- ===========================================
-- Availability sync + realtime.
--
-- Problem this fixes:
--   1. Teachers edited schedule_templates but the only thing that created
--      availability_slots from those templates was a once-a-day cron at
--      17:00 UTC. The teacher's manual "Generate" button bypassed the
--      RPC entirely and produced 15-minute slots that the 30-min lesson
--      flow could not chain (the buffer_minutes broke adjacency), so
--      learners saw "no available slots" even after edits.
--   2. Disabling a template never removed the future open slots that came
--      from it — those slots stayed bookable forever.
--   3. The learner-facing booking page had no realtime channel on
--      availability_slots, so updates required a manual refresh.
--
-- Strategy:
--   * sync_teacher_availability(teacher) generates AND prunes in one call,
--     reusing the timezone-correct logic from generate_slots_from_templates.
--   * Add availability_slots to the supabase_realtime publication so the
--     learner page can subscribe to INSERT / UPDATE / DELETE.
-- ===========================================

CREATE OR REPLACE FUNCTION sync_teacher_availability(
  p_teacher_id UUID,
  p_days_ahead INTEGER DEFAULT 14,
  p_slot_minutes INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  v_created_count INTEGER := 0;
  v_pruned_count INTEGER := 0;
  v_template RECORD;
  v_today_local DATE;
  v_target_date DATE;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_step INTERVAL;
  v_buffer INTERVAL;
  v_tz TEXT;
  v_d INTEGER;
BEGIN
  v_step := (p_slot_minutes || ' minutes')::interval;

  -- Fetch the teacher's timezone once. If the teacher row is missing we
  -- bail out quietly — nothing to sync.
  SELECT COALESCE(timezone, 'UTC') INTO v_tz
  FROM profiles
  WHERE id = p_teacher_id;

  IF v_tz IS NULL THEN
    RETURN json_build_object('created', 0, 'pruned', 0);
  END IF;

  v_today_local := (now() AT TIME ZONE v_tz)::date;

  -- 1. Generate: walk every active template for this teacher and insert
  --    any missing 30-min slots in the next p_days_ahead days. We rely on
  --    the (teacher_id, start_at) unique constraint added in the dedupe
  --    migration to make this idempotent — ON CONFLICT DO NOTHING handles
  --    the rare race where two sync calls run in parallel.
  FOR v_template IN
    SELECT st.day_of_week, st.start_time, st.end_time,
           COALESCE(st.buffer_minutes, 0) AS buffer_minutes
    FROM schedule_templates st
    WHERE st.teacher_id = p_teacher_id
      AND st.is_active = true
  LOOP
    v_buffer := (v_template.buffer_minutes || ' minutes')::interval;

    FOR v_d IN 0..p_days_ahead LOOP
      v_target_date := v_today_local + v_d;
      CONTINUE WHEN EXTRACT(DOW FROM v_target_date)::INTEGER <> v_template.day_of_week;

      v_slot_start := ((v_target_date::text || ' ' || v_template.start_time::text)::timestamp
                       AT TIME ZONE v_tz);
      v_window_end := ((v_target_date::text || ' ' || v_template.end_time::text)::timestamp
                       AT TIME ZONE v_tz);

      WHILE v_slot_start + v_step <= v_window_end LOOP
        v_slot_end := v_slot_start + v_step;

        IF v_slot_start > now() THEN
          INSERT INTO availability_slots (teacher_id, start_at, end_at, status)
          VALUES (p_teacher_id, v_slot_start, v_slot_end, 'open')
          ON CONFLICT (teacher_id, start_at) DO NOTHING;

          IF FOUND THEN
            v_created_count := v_created_count + 1;
          END IF;
        END IF;

        v_slot_start := v_slot_end + v_buffer;
      END LOOP;
    END LOOP;
  END LOOP;

  -- 2. Prune: remove future OPEN slots whose start time no longer matches
  --    any active template window. We never touch booked, held, or
  --    blocked rows — those represent decisions a teacher (or learner)
  --    has explicitly made and must survive a template edit.
  --
  --    Match logic: a slot belongs to a template if its start_at, in the
  --    teacher's local timezone, falls on the template's day_of_week and
  --    sits inside [start_time, end_time - slot_minutes].
  WITH future_open AS (
    SELECT id, start_at
    FROM availability_slots
    WHERE teacher_id = p_teacher_id
      AND status = 'open'
      AND start_at > now()
  ),
  matched AS (
    SELECT fo.id
    FROM future_open fo
    WHERE EXISTS (
      SELECT 1
      FROM schedule_templates st
      WHERE st.teacher_id = p_teacher_id
        AND st.is_active = true
        AND EXTRACT(DOW FROM (fo.start_at AT TIME ZONE v_tz))::INTEGER = st.day_of_week
        AND (fo.start_at AT TIME ZONE v_tz)::time >= st.start_time
        AND (fo.start_at AT TIME ZONE v_tz)::time + v_step <= st.end_time
    )
  ),
  deleted AS (
    DELETE FROM availability_slots
    WHERE id IN (SELECT id FROM future_open)
      AND id NOT IN (SELECT id FROM matched)
    RETURNING 1
  )
  SELECT count(*) INTO v_pruned_count FROM deleted;

  RETURN json_build_object(
    'created', v_created_count,
    'pruned', v_pruned_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow the authenticated role to call this RPC. The function is
-- SECURITY DEFINER and accepts a teacher_id argument, so the API route
-- in /api/teacher/availability/sync verifies that auth.uid() matches
-- the requested teacher_id before invoking it.
GRANT EXECUTE ON FUNCTION sync_teacher_availability(UUID, INTEGER, INTEGER) TO authenticated, service_role;

-- Add availability_slots to the realtime publication so the learner
-- booking page (and the teacher's own schedule page) can subscribe to
-- INSERT / UPDATE / DELETE events. Idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'availability_slots'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.availability_slots';
  END IF;
END $$;
