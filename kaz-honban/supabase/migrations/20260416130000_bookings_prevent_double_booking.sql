-- Defense-in-depth against double-booking races.
-- `create_booking_atomic` already locks the slot row, but a DB-level partial
-- UNIQUE index on the teacher's timeline is the final safety net: if the
-- function is ever called from a different code path, or if someone updates a
-- booking directly, the index still prevents two live bookings on the same
-- teacher + start_at.
--
-- Only applies to "live" statuses (confirmed / in_session). Completed, no_show,
-- and cancelled bookings are excluded so a learner can rebook after a cancel.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookings_teacher_live_start
  ON bookings (teacher_id, scheduled_start_at)
  WHERE status IN ('confirmed', 'in_session');

-- Same protection on the learner side so a learner cannot have two live
-- bookings stacked at the same exact time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookings_learner_live_start
  ON bookings (learner_id, scheduled_start_at)
  WHERE status IN ('confirmed', 'in_session');
