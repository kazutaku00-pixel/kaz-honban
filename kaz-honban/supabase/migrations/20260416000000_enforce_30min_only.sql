-- Enforce 30-minute lessons at the database level.
-- Product decision: only 30-min lessons are supported.
-- Defense in depth: API, Zod, and RPC already restrict this, but the DB
-- is the last line — so we add a CHECK constraint and an explicit guard
-- inside create_booking_atomic.

-- 1. Normalize any stray rows so the CHECK can be added. In practice there
--    should be nothing to update, since the API has always validated.
UPDATE bookings
SET duration_minutes = 30,
    scheduled_end_at = scheduled_start_at + interval '30 minutes'
WHERE duration_minutes IS DISTINCT FROM 30;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_duration_30_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_duration_30_check CHECK (duration_minutes = 30);

-- 2. Keep lesson_duration_options locked to {30} (re-applies safety in case
--    any admin UI or bulk import slips something else in).
ALTER TABLE teacher_profiles
  DROP CONSTRAINT IF EXISTS teacher_profiles_lesson_duration_options_30_check;
ALTER TABLE teacher_profiles
  ADD CONSTRAINT teacher_profiles_lesson_duration_options_30_check
  CHECK (lesson_duration_options = ARRAY[30]);

-- 3. Tighten create_booking_atomic so any non-30 request fails fast with a
--    clean error, instead of relying on the CHECK to abort the transaction.
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
  IF p_duration_minutes <> 30 THEN
    RETURN json_build_object('error', 'Only 30-minute lessons are supported', 'code', 400);
  END IF;

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

  IF v_slot.start_at < (now() + make_interval(mins => GREATEST(p_min_lead_minutes, 0))) THEN
    RETURN json_build_object(
      'error', 'Lessons must be booked at least ' || p_min_lead_minutes || ' minutes in advance',
      'code', 400
    );
  END IF;

  v_scheduled_end := v_slot.start_at + interval '30 minutes';

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

  -- Lock additional consecutive open slots if the primary slot is shorter
  -- than 30 min (covers both 15- and 30-min slot granularities).
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
    v_slot.start_at, v_scheduled_end, 30,
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
