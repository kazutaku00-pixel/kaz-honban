-- Fix teacher_invites RLS: 招待コードは認証済みユーザーのみ閲覧可能にする
-- (以前は USING (true) で未認証者も全コードが見えていた)

DROP POLICY IF EXISTS "teacher_invites_select" ON "public"."teacher_invites";

CREATE POLICY "teacher_invites_select" ON "public"."teacher_invites"
FOR SELECT USING (auth.uid() IS NOT NULL);
