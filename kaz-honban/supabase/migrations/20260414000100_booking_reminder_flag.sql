-- Track whether a next-day reminder has been sent (idempotency for cron)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_pending
  ON bookings (scheduled_start_at)
  WHERE status = 'confirmed' AND reminder_sent_at IS NULL;
