-- Remove duplicate availability_slots rows and prevent new ones.
--
-- Observed in production: 11 separate rows existed for one teacher at the
-- same start_at (12:00 PM local), and 200+ per day on other teachers. Most
-- likely cause: an earlier version of generate_slots_from_templates ran
-- with 15-minute granularity, then a later version ran with 30, and edge
-- cases around buffer math produced microsecond-offset near-duplicates.
--
-- Strategy:
--   1. Keep exactly one row per (teacher_id, start_at), preferring a row
--      that's already 'booked' / 'held' (never disrupt real bookings) and
--      then the oldest created_at.
--   2. Add a UNIQUE constraint so no new duplicates can be inserted.

-- 1. Let bookings survive if we ever need to drop a duplicate slot they
--    happen to reference. `slot_id` is a historical pointer, not an active
--    lock — the booking's own (scheduled_start_at, scheduled_end_at) carry
--    the real timing info, so setting slot_id to NULL on delete is harmless.
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_slot_id_fkey,
  ADD CONSTRAINT bookings_slot_id_fkey
    FOREIGN KEY (slot_id) REFERENCES availability_slots(id) ON DELETE SET NULL;

ALTER TABLE bookings
  ALTER COLUMN slot_id DROP NOT NULL;

-- 2. Dedupe: keep one slot per (teacher_id, start_at), preferring rows that
--    are most likely to be "real" (booked > held > blocked > open, then
--    oldest created_at). FK is ON DELETE SET NULL now so this is safe.
WITH ranked AS (
  SELECT s.id,
         row_number() OVER (
           PARTITION BY s.teacher_id, s.start_at
           ORDER BY
             (EXISTS (SELECT 1 FROM bookings b
                       WHERE b.slot_id = s.id
                         AND b.status IN ('confirmed', 'in_session', 'completed')))::int DESC,
             CASE s.status
               WHEN 'booked'  THEN 0
               WHEN 'held'    THEN 1
               WHEN 'blocked' THEN 2
               WHEN 'open'    THEN 3
               ELSE 4
             END,
             s.created_at
         ) AS rn
  FROM availability_slots s
)
DELETE FROM availability_slots
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3. Now that the data is clean, make it impossible to regress.
ALTER TABLE availability_slots
  DROP CONSTRAINT IF EXISTS availability_slots_teacher_start_unique;
ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_teacher_start_unique
    UNIQUE (teacher_id, start_at);
