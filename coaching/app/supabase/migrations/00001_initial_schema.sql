-- =============================================
-- Language Lesson Platform - コーチング機能テーブル追加
--
-- 対象Supabase: kazz-pwa (qinfmdivvxtfygnexjoo.supabase.co)
-- 既存テーブル (profiles, notifications, user_notifications) には一切触れない
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE japanese_level AS ENUM ('none', 'n5', 'n4', 'n3', 'n2', 'n1');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lesson_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'partial_refund');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('booking', 'reminder', 'review', 'approval', 'cancellation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- TABLES
-- =============================================

-- コーチング用ユーザー（既存 profiles テーブルとは完全に別）
CREATE TABLE IF NOT EXISTS coaching_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  country TEXT,
  japanese_level japanese_level,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 講師プロフィール
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate DECIMAL(10,2) NOT NULL,
  intro_video_url TEXT,
  certifications TEXT,
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 講師スケジュール
CREATE TABLE IF NOT EXISTS teacher_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT valid_schedule_time_range CHECK (start_time < end_time)
);

-- レッスン
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 60)),
  status lesson_status NOT NULL DEFAULT 'scheduled',
  daily_room_url TEXT,
  daily_room_name TEXT,
  cancelled_by UUID REFERENCES coaching_users(id),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_lesson_time CHECK (start_time < end_time),
  CONSTRAINT different_participants CHECK (student_id != teacher_id)
);

-- レビュー
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID UNIQUE NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 決済
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  teacher_payout DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- お気に入り
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, teacher_id)
);

-- コーチング通知（既存 notifications / user_notifications とは別）
CREATE TABLE IF NOT EXISTS coaching_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES coaching_users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_lessons_student ON lessons(student_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher ON lessons(teacher_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status, start_time);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON reviews(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_approved ON teacher_profiles(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_coaching_notif_user ON coaching_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_schedules_teacher ON teacher_schedules(teacher_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_favorites_student ON favorites(student_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- coaching_users の updated_at 自動更新
CREATE OR REPLACE FUNCTION coaching_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coaching_users_updated_at ON coaching_users;
CREATE TRIGGER coaching_users_updated_at
  BEFORE UPDATE ON coaching_users
  FOR EACH ROW EXECUTE FUNCTION coaching_update_updated_at();

-- レビュー変更時に講師の平均レーティング・レビュー数を自動更新
CREATE OR REPLACE FUNCTION update_teacher_stats()
RETURNS TRIGGER AS $$
DECLARE
  t_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    t_id := OLD.teacher_id;
  ELSE
    t_id := NEW.teacher_id;
  END IF;

  UPDATE teacher_profiles
  SET
    avg_rating = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE teacher_id = t_id
    ), 0),
    total_reviews = (
      SELECT COUNT(*) FROM reviews WHERE teacher_id = t_id
    )
  WHERE user_id = t_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_update_teacher_stats ON reviews;
CREATE TRIGGER reviews_update_teacher_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_teacher_stats();

-- レッスン完了時に total_lessons 更新
CREATE OR REPLACE FUNCTION update_teacher_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE teacher_profiles
    SET total_lessons = total_lessons + 1
    WHERE user_id = NEW.teacher_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lessons_update_teacher_count ON lessons;
CREATE TRIGGER lessons_update_teacher_count
  AFTER UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_teacher_lesson_count();

-- 新規ユーザー登録時に coaching_users にも自動作成
-- ※ 既存の handle_new_user がある場合は上書きしない。別名で作成。
CREATE OR REPLACE FUNCTION coaching_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.coaching_users (id, email, name, role, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存トリガーとは別名で作成（既存 on_auth_user_created はそのまま残る）
DROP TRIGGER IF EXISTS on_coaching_user_created ON auth.users;
CREATE TRIGGER on_coaching_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION coaching_handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE coaching_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_notifications ENABLE ROW LEVEL SECURITY;

-- coaching_users
CREATE POLICY "Coaching users can view own profile"
  ON coaching_users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Coaching users can update own profile"
  ON coaching_users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Coaching admins can view all users"
  ON coaching_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM coaching_users WHERE id = auth.uid() AND role = 'admin'));

-- teacher_profiles
CREATE POLICY "Anyone can view approved teachers"
  ON teacher_profiles FOR SELECT USING (is_approved = true);

CREATE POLICY "Teachers can view own profile"
  ON teacher_profiles FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can insert own profile"
  ON teacher_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can update own profile"
  ON teacher_profiles FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all teachers"
  ON teacher_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM coaching_users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update teachers"
  ON teacher_profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM coaching_users WHERE id = auth.uid() AND role = 'admin'));

-- teacher_schedules
CREATE POLICY "Anyone can view schedules"
  ON teacher_schedules FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own schedules"
  ON teacher_schedules FOR ALL USING (teacher_id = auth.uid());

-- lessons
CREATE POLICY "Students can view own lessons"
  ON lessons FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view own lessons"
  ON lessons FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Students can create lessons"
  ON lessons FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update lessons"
  ON lessons FOR UPDATE USING (student_id = auth.uid() OR teacher_id = auth.uid());

CREATE POLICY "Admins can manage all lessons"
  ON lessons FOR ALL
  USING (EXISTS (SELECT 1 FROM coaching_users WHERE id = auth.uid() AND role = 'admin'));

-- reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Students can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM lessons WHERE id = lesson_id AND student_id = auth.uid() AND status = 'completed'
    )
  );

CREATE POLICY "Students can update own reviews"
  ON reviews FOR UPDATE USING (student_id = auth.uid());

-- payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT USING (student_id = auth.uid() OR teacher_id = auth.uid());

-- favorites
CREATE POLICY "Students can manage favorites"
  ON favorites FOR ALL USING (student_id = auth.uid());

-- coaching_notifications
CREATE POLICY "Users can view own coaching notifications"
  ON coaching_notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own coaching notifications"
  ON coaching_notifications FOR UPDATE USING (user_id = auth.uid());
