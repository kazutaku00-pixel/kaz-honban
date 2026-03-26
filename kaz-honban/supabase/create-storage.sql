-- ===========================================
-- Supabase Storage: avatars バケット作成
-- ===========================================
-- Supabase SQL Editor で実行

-- 1. バケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 誰でも閲覧可能（公開バケット）
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 3. 自分のフォルダにのみアップロード可能
DROP POLICY IF EXISTS "avatars_user_upload" ON storage.objects;
CREATE POLICY "avatars_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. 自分のファイルのみ更新可能
DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. 自分のファイルのみ削除可能
DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================
-- Supabase Storage: videos バケット作成
-- ===========================================
-- 講師紹介動画用（最大50MB、MP4/WebM/MOV）

-- 1. バケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 誰でも閲覧可能（公開バケット）
DROP POLICY IF EXISTS "videos_public_read" ON storage.objects;
CREATE POLICY "videos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

-- 3. 自分のフォルダにのみアップロード可能
DROP POLICY IF EXISTS "videos_user_upload" ON storage.objects;
CREATE POLICY "videos_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. 自分のファイルのみ更新可能
DROP POLICY IF EXISTS "videos_user_update" ON storage.objects;
CREATE POLICY "videos_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. 自分のファイルのみ削除可能
DROP POLICY IF EXISTS "videos_user_delete" ON storage.objects;
CREATE POLICY "videos_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
