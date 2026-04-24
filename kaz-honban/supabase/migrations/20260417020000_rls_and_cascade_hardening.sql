-- ===========================================
-- RLS hardening + cascade fixes (2026-04-17 review pass).
--
-- 1. Reviews: enforce "lesson actually happened" at the DB level. The API
--    route already checks booking.status + end time, but any direct
--    client-side insert (using anon JWT) was previously unchecked, allowing
--    a learner to file fake reviews before a lesson ran.
-- 2. Reviews/messages/lesson_reports: allow owners to delete/update their
--    own rows. Without these, rows were write-once-read-many forever.
-- 3. Payments: ON DELETE CASCADE so booking cleanup doesn't leave orphans.
-- 4. Teacher_invites_insert: restrict to service_role (admin API path) —
--    the table had no INSERT policy, and RLS default-denies, but making the
--    rule explicit documents intent and survives future permissive defaults.
-- ===========================================

-- 1. reviews: insert only if the caller is the learner AND the lesson has
--    actually ended. completed / in_session / confirmed are all allowed
--    post-end so the UI can file a review as soon as end_at has passed,
--    even if the `complete-lessons` cron hasn't ticked yet.
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = reviews.booking_id
        AND b.learner_id = auth.uid()
        AND b.teacher_id = reviews.reviewee_id
        AND b.scheduled_end_at <= now()
        AND b.status IN ('confirmed', 'in_session', 'completed')
    )
  );

-- 2a. Reviews: reviewer can edit/remove their own review.
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- 2b. Messages: sender can delete their own message.
--     Update intentionally NOT added — chat history should be immutable
--     once sent. Use the notification-style "(deleted)" pattern instead.
DROP POLICY IF EXISTS "messages_delete_own" ON messages;
CREATE POLICY "messages_delete_own" ON messages
  FOR DELETE USING (auth.uid() = sender_id);

-- 2c. Lesson reports: teacher can remove a draft they no longer want.
DROP POLICY IF EXISTS "lesson_reports_delete_own" ON lesson_reports;
CREATE POLICY "lesson_reports_delete_own" ON lesson_reports
  FOR DELETE USING (auth.uid() = teacher_id);

-- 3. Payments: cascade on booking delete so we don't strand orphan rows.
--    Phase 1 doesn't write here, but the FK shape matters for Phase 2.
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_booking_id_fkey,
  ADD CONSTRAINT payments_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- 4. teacher_invites: allow an authenticated user to claim an unclaimed
--    invite for themselves (email/password signup path uses the anon client,
--    not service_role, so the claim was silently being blocked by RLS
--    default-deny — leaving invites re-usable). Admin create/delete stays
--    on the service_role client, which bypasses RLS regardless.
DROP POLICY IF EXISTS "teacher_invites_claim" ON teacher_invites;
CREATE POLICY "teacher_invites_claim" ON teacher_invites
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND used_by IS NULL)
  WITH CHECK (used_by = auth.uid());
