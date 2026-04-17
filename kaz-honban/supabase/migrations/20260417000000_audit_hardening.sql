-- ===========================================
-- Hardening pass from 2026-04-17 audit:
--   - Block client-side admin-role escalation.
--   - Close RLS gaps on notifications.
--   - Cascade child rows when a booking is deleted so no orphans remain.
--   - Enforce a handful of data-integrity invariants that were previously
--     expressed only in app code.
--   - Add a missing index for the expired-hold sweeper cron.
-- ===========================================

-- 1. Remove the broad "any authenticated user can assign their own role"
--    INSERT policy. Signup goes through /auth/callback which uses the
--    service_role client, so no client-side INSERT is needed — and leaving
--    the open policy in place lets any logged-in user call
--       supabase.from("user_roles").insert({ user_id: me, role: "admin" })
--    to escalate to admin.
DROP POLICY IF EXISTS "user_roles_insert_own" ON user_roles;

-- (Keep user_roles_select_own so users can read their own role.)

-- 2. Let users clean up their own notifications. Without this, RLS blocks
--    every DELETE and the table only grows.
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Cascade deletes from bookings so child rows don't become orphans.
--    The DB had ON DELETE defaulting to NO ACTION, meaning deleting a
--    booking (e.g. from admin cleanup scripts) would fail or leave dangling
--    references. Chat images in storage are not touched — those can be
--    pruned by a separate cron if needed.
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_booking_id_fkey,
  ADD CONSTRAINT messages_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE daily_rooms
  DROP CONSTRAINT IF EXISTS daily_rooms_booking_id_fkey,
  ADD CONSTRAINT daily_rooms_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE lesson_reports
  DROP CONSTRAINT IF EXISTS lesson_reports_booking_id_fkey,
  ADD CONSTRAINT lesson_reports_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey,
  ADD CONSTRAINT reviews_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- 4. Data integrity invariants.
-- 4a. Reviewer can't review themselves.
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewer_not_reviewee;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_reviewer_not_reviewee
    CHECK (reviewer_id <> reviewee_id);

-- 4b. cancelled_at and cancelled_by must be set together or not at all,
--     so "who cancelled?" is never lost.
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_cancel_consistency;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_cancel_consistency
    CHECK (
      (cancelled_at IS NULL AND cancelled_by IS NULL)
      OR (cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL)
    );

-- 4c. A message must have text or an image (or both) — blank messages are a bug.
--     Ensure the image_url column exists first — schema.sql assumed it was
--     created by the baseline but the deployed DB predates chat images.
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_has_content;
ALTER TABLE messages
  ADD CONSTRAINT messages_has_content
    CHECK (
      (body IS NOT NULL AND length(btrim(body)) > 0)
      OR image_url IS NOT NULL
    );

-- 5. Cron sweep index — release_expired_holds() filters by
--    (status = 'held' AND held_until < now()). The existing idx_slots_held
--    is keyed on (status, held_until) WHERE status = 'held', but the column
--    order makes held_until-only scans inefficient. Add a targeted index.
CREATE INDEX IF NOT EXISTS idx_slots_held_until_active
  ON availability_slots (held_until)
  WHERE status = 'held' AND held_until IS NOT NULL;
