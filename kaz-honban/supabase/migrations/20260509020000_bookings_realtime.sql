-- Add bookings to the realtime publication so the learner and teacher
-- "My Bookings" pages can subscribe to status changes (cancellations,
-- in_session flips, no-shows, completions) and reflect them without a
-- manual page refresh. Pairs with the postgres_changes subscriptions
-- added in src/components/bookings/bookings-list-client.tsx and
-- src/app/(app)/teacher/bookings/teacher-bookings-client.tsx.
--
-- Idempotent: only adds the table if it isn't already published.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bookings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings';
  END IF;
END $$;
