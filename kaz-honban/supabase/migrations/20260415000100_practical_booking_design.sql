-- ===========================================
-- Practical booking design for 30-min fixed lessons
--
-- Changes:
-- 1. generate_slots_from_templates: default 30-min step, respects buffer_minutes
-- 2. create_booking_atomic: enforces minimum lead time, locks as many open slots
--    as needed to cover the requested duration (works with 15- or 30-min slots)
-- ===========================================

-- ---- generate_slots_from_templates ----
CREATE OR REPLACE FUNCTION generate_slots_from_templates(
  p_days_ahead INTEGER DEFAULT 14,
  p_slot_minutes INTEGER DEFAULT 30
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
  v_buffer INTERVAL;
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

    FOR v_d IN 0..p_days_ahead LOOP
      v_target_date := (CURRENT_DATE + v_d);
      CONTINUE WHEN EXTRACT(DOW FROM v_target_date)::INTEGER <> v_template.day_of_week;

      v_slot_start := ((v_target_date::text || ' ' || v_template.start_time::text)::timestamp
                       AT TIME ZONE COALESCE(v_template.timezone, 'UTC'));
      v_window_end := ((v_target_date::text || ' ' || v_template.end_time::text)::timestamp
                       AT TIME ZONE COALESCE(v_template.timezone, 'UTC'));

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

        -- Advance by slot length + buffer (buffer may be zero)
        v_slot_start := v_slot_end + v_buffer;
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN v_created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---- create_booking_atomic ----
-- Works with any slot granularity: locks enough consecutive open slots to cover
-- the full requested duration. Enforces min lead time.
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_learner_id UUID,
  p_teacher_id UUID,
  p_slot_id UUID,
  p_duration_minutes INTEGER,
  p_learner_note TEXT DEFAULT NULL,
  p_min_lead_minutes INTEGER DEFAULT 60
)
RETURNS JSON AS $$
DECLARE
  v_slot RECORD;
  v_next RECORD;
  v_slot_ids UUID[];
  v_covered_until TIMESTAMPTZ;
  v_scheduled_end TIMESTAMPTZ;
  v_booking RECORD;
BEGIN
  IF p_learner_id = p_teacher_id THEN
    RETURN json_build_object('error', 'Cannot book yourself', 'code', 400);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM teacher_profiles
    WHERE user_id = p_teacher_id
      AND approval_status = 'approved'
      AND is_public = true
  ) THEN
    RETURN json_build_object('error', 'Teacher is not available for booking', 'code', 400);
  END IF;

  SELECT * INTO v_slot
  FROM availability_slots
  WHERE id = p_slot_id
    AND teacher_id = p_teacher_id
    AND status = 'open'
  FOR UPDATE;

  IF v_slot IS NULL THEN
    RETURN json_build_object('error', 'Slot is no longer available', 'code', 409);
  END IF;

  -- Minimum lead time
  IF v_slot.start_at < (now() + make_interval(mins => GREATEST(p_min_lead_minutes, 0))) THEN
    RETURN json_build_object(
      'error', 'Lessons must be booked at least ' || p_min_lead_minutes || ' minutes in advance',
      'code', 400
    );
  END IF;

  v_scheduled_end := v_slot.start_at + (p_duration_minutes || ' minutes')::interval;

  -- Learner overlap check
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE learner_id = p_learner_id
      AND status IN ('confirmed', 'in_session')
      AND scheduled_start_at < v_scheduled_end
      AND scheduled_end_at > v_slot.start_at
  ) THEN
    RETURN json_build_object('error', 'You already have a booking at this time', 'code', 409);
  END IF;

  v_slot_ids := ARRAY[v_slot.id];
  v_covered_until := v_slot.end_at;

  -- Lock additional consecutive open slots if the primary slot is shorter than the lesson
  WHILE v_covered_until < v_scheduled_end LOOP
    SELECT * INTO v_next
    FROM availability_slots
    WHERE teacher_id = p_teacher_id
      AND status = 'open'
      AND start_at = v_covered_until
    FOR UPDATE;

    IF v_next IS NULL THEN
      RETURN json_build_object(
        'error', 'Teacher does not have enough consecutive availability for this lesson',
        'code', 409
      );
    END IF;

    v_slot_ids := v_slot_ids || v_next.id;
    v_covered_until := v_next.end_at;
  END LOOP;

  UPDATE availability_slots
  SET status = 'booked', held_by = NULL, held_until = NULL, updated_at = now()
  WHERE id = ANY(v_slot_ids);

  INSERT INTO bookings (
    learner_id, teacher_id, slot_id,
    scheduled_start_at, scheduled_end_at, duration_minutes,
    learner_note, status
  ) VALUES (
    p_learner_id, p_teacher_id, p_slot_id,
    v_slot.start_at, v_scheduled_end, p_duration_minutes,
    p_learner_note, 'confirmed'
  )
  RETURNING * INTO v_booking;

  RETURN json_build_object(
    'booking_id', v_booking.id,
    'scheduled_start_at', v_booking.scheduled_start_at,
    'scheduled_end_at', v_booking.scheduled_end_at,
    'slot_ids', v_slot_ids,
    'code', 201
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---- release_booking_slots helper ----
-- Releases every open-or-held-or-booked slot that falls inside the booking
-- window, so cancel + no-show paths don't need duration-specific branches.
CREATE OR REPLACE FUNCTION release_booking_slots(p_booking_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_booking RECORD;
  v_count INTEGER;
BEGIN
  SELECT teacher_id, scheduled_start_at, scheduled_end_at
  INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;

  IF v_booking IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE availability_slots
  SET status = 'open', held_by = NULL, held_until = NULL, updated_at = now()
  WHERE teacher_id = v_booking.teacher_id
    AND start_at >= v_booking.scheduled_start_at
    AND end_at <= v_booking.scheduled_end_at
    AND status IN ('booked', 'held');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
