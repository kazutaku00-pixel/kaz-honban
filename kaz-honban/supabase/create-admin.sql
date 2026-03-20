-- ===========================================
-- 管理者ロール付与
-- ===========================================
-- 使い方: Supabase SQL Editor で実行
-- メールアドレスを変更してから実行してください

-- 1. 対象ユーザーのIDを確認
-- SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';

-- 2. admin ロールを付与（メールアドレスを変えて実行）
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 確認
SELECT u.email, r.role
FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id
WHERE r.role = 'admin';
