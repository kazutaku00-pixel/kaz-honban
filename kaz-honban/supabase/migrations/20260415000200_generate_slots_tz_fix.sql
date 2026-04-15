-- ===========================================
-- Fix: generate_slots_from_templates day-of-week matching.
--
-- Before, CURRENT_DATE evaluated the SERVER's UTC date, so teachers in far-east
-- timezones (JST, KST, AEST) saw slots generated for the wrong calendar day
-- whenever the UTC day had already rolled over but their local day had not —
-- or vice versa. We now derive "today" in the teacher's own timezone.
-- ===========================================

CREATE OR REPLACE FUNCTION generate_slots_from_templates(
  p_days_ahead INTEGER DEFAULT 14,
  p_slot_minutes INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  v_created_count INTEGER := 0;
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

  FOR v_template IN
    SELECT st.teacher_id, st.day_of_week, st.start_time, st.end_time,
           COALESCE(st.buffer_minutes, 0) AS buffer_minutes,
           p.timezone
    FROM schedule_templates st
    JOIN teacher_profiles tp ON tp.user_id = st.teacher_id
    JOIN profiles p ON p.id = st.teacher_id
    WHERE st.is_active = true
      AND tp.approval_status = 'approved'
      AND tp.is_public = true
      AND p.is_active = true
  LOOP
    v_buffer := (v_template.buffer_minutes || ' minutes')::interval;
    v_tz := COALESCE(v_template.timezone, 'UTC');
    -- "today" from the teacher's perspective
    v_today_local := (now() AT TIME ZONE v_tz)::date;

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
          IF NOT EXISTS (
            SELECT 1 FROM availability_slots
            WHERE teacher_id = v_template.teacher_id
              AND start_at = v_slot_start
          ) THEN
            INSERT INTO availability_slots (teacher_id, start_at, end_at, status)
            VALUES (v_template.teacher_id, v_slot_start, v_slot_end, 'open');
            v_created_count := v_created_count + 1;
          END IF;
        END IF;

        v_slot_start := v_slot_end + v_buffer;
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN v_created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
