-- Enable realtime broadcast on messages so the booking chat panel can
-- receive INSERT events via supabase.channel(...).on('postgres_changes', ...).
-- Idempotent: only adds the table to the publication if it isn't already in it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;
