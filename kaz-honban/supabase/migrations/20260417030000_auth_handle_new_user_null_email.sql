-- ===========================================
-- handle_new_user: survive NULL or missing email from OAuth providers.
--
-- Apple Sign In only returns the user's email on the very first
-- authorization, and even then only when the client explicitly requests
-- the `email` scope. With "hide my email" enabled we get a private relay
-- address, which is fine — but if a user previously tapped Apple on
-- another build (without scopes) and Apple decided to reuse that identity,
-- the insert trigger now fires with NEW.email = NULL and the whole
-- profiles INSERT fails because profiles.email is NOT NULL.
--
-- Fix:
--   1. Allow profiles.email to be NULL at the DB level. Application code
--      already tolerates NULL email reads.
--   2. Rewrite the trigger to insert a best-effort placeholder address
--      ("{uuid}@pending.nihongo.app") when auth.users.email is NULL, so
--      the signup flow never breaks and the user can link a real email
--      from /settings later.
--   3. Be idempotent: skip if a profile row was already created (e.g.
--      tests that pre-seed profiles).
-- ===========================================

-- 1. Loosen the column constraint.
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Re-define the trigger with null-safe fallback + idempotency.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_name  TEXT;
  v_avatar TEXT;
BEGIN
  -- Skip if someone already seeded this profile (rare, but keeps the
  -- function safe to re-run in test harnesses).
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  v_email := COALESCE(
    NULLIF(NEW.email, ''),
    NULLIF(NEW.raw_user_meta_data->>'email', ''),
    NEW.id::text || '@pending.nihongo.app'
  );

  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(v_email, '@', 1)
  );

  v_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', '')
  );

  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, v_email, v_name, v_avatar);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Retie trigger (CREATE OR REPLACE FUNCTION doesn't rebind the trigger
--    if the function signature is unchanged, but DROP/CREATE is cheap).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
