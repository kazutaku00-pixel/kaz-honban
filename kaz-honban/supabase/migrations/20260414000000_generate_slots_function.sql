-- ===========================================
-- FIX-1: Auto-generate availability_slots from schedule_templates
-- Called daily by Vercel Cron at /api/cron/generate-slots.
-- Idempotent: never overwrites existing open/held/booked/blocked slots.
-- ===========================================

CREATE OR REPLACE FUNCTION generate_slots_from_templates(
  p_days_ahead INTEGER DEFAULT 14,
  p_slot_minutes INTEGER DEFAULT 15
)
RETURNS INTEGER AS $$
DECLARE
  v_created_count INTEGER := 0;
  v_template RECORD;
  v_target_date DATE;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_step INTERVAL;
  v_d INTEGER;
BEGIN
  v_step := (p_slot_minutes || ' minutes')::interval;

  -- Only generate for approved, public, active teachers
  FOR v_template IN
    SELECT st.teacher_id, st.day_of_week, st.start_time, st.end_time, st.buffer_minutes, p.timezone
    FROM schedule_templates st
    JOIN teacher_profiles tp ON tp.user_id = st.teacher_id
    JOIN profiles p ON p.id = st.teacher_id
    WHERE st.is_active = true
      AND tp.approval_status = 'approved'
      AND tp.is_public = true
      AND p.is_active = true
  LOOP
    FOR v_d IN 0..p_days_ahead LOOP
      v_target_date := (CURRENT_DATE + v_d);

      -- day_of_week: 0 = Sunday (matches Postgres EXTRACT(DOW))
      CONTINUE WHEN EXTRACT(DOW FROM v_target_date)::INTEGER <> v_template.day_of_week;

      -- Build window in teacher's local timezone then cast to UTC.
      v_slot_start := ((v_target_date::text || ' ' || v_template.start_time::text)::timestamp
                       AT TIME ZONE COALESCE(v_template.timezone, 'UTC'));
      v_window_end := ((v_target_date::text || ' ' || v_template.end_time::text)::timestamp
                       AT TIME ZONE COALESCE(v_template.timezone, 'UTC'));

      WHILE v_slot_start + v_step <= v_window_end LOOP
        v_slot_end := v_slot_start + v_step;

        -- Skip past slots
        IF v_slot_start > now() THEN
          -- Idempotent: only insert if no slot exists at this exact start
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

        v_slot_start := v_slot_end;
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN v_created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
