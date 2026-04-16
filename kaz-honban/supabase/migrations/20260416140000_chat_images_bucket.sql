-- Create the chat-images storage bucket used by room chat.
-- Path convention: chat/{booking_id}/{filename}
-- Only participants of the booking may upload/read.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5 MB to match client-side limit in room-chat.tsx
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Read: anyone with the URL can view (public bucket, URLs carry the booking id
-- in the path — only participants know the URL). Bookings themselves are
-- private, and URLs are only shared in the messages table which is RLS-guarded.
DROP POLICY IF EXISTS "chat_images_public_read" ON storage.objects;
CREATE POLICY "chat_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

-- Insert: authenticated user must be a participant of the booking in the path.
-- Path format: chat/{booking_id}/{file}
DROP POLICY IF EXISTS "chat_images_participant_insert" ON storage.objects;
CREATE POLICY "chat_images_participant_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = 'chat'
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND (b.learner_id = auth.uid() OR b.teacher_id = auth.uid())
    )
  );

-- Delete: only the uploader's own files can be deleted (owner column is set
-- automatically by Supabase Storage on insert).
DROP POLICY IF EXISTS "chat_images_owner_delete" ON storage.objects;
CREATE POLICY "chat_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-images' AND owner = auth.uid()
  );
