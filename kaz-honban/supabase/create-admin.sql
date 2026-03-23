-- ===========================================
-- 管理者 + 教員ロール付与
-- ===========================================
-- 使い方: Supabase SQL Editor で実行
-- 事前に対象ユーザーがサインアップ済みであること

-- ===========================================
-- kazumaimai0@gmail.com — admin + teacher
-- ===========================================

-- 1. ユーザー確認
SELECT id, email FROM auth.users WHERE email = 'kazumaimai0@gmail.com';

-- 2. profiles が無ければ作成
INSERT INTO public.profiles (id, display_name, email)
SELECT id, split_part(email, '@', 1), email
FROM auth.users
WHERE email = 'kazumaimai0@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 3. admin ロール付与
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE email = 'kazumaimai0@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. teacher ロール付与
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'teacher'::user_role
FROM auth.users
WHERE email = 'kazumaimai0@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. teacher_profiles 作成
INSERT INTO public.teacher_profiles (user_id, approval_status, is_public)
SELECT id, 'approved'::teacher_approval_status, true
FROM auth.users
WHERE email = 'kazumaimai0@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ===========================================
-- 確認クエリ
-- ===========================================
SELECT u.email, r.role
FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email = 'kazumaimai0@gmail.com';
