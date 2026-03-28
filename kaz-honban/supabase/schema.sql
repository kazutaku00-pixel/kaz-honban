-- ===========================================
-- NihonGo Phase 1 — Full Schema (Safe / Re-runnable)
-- ===========================================

-- ENUMS (safe: skip if exists)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('learner', 'teacher', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE japanese_level AS ENUM ('none', 'n5', 'n4', 'n3', 'n2', 'n1'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE teacher_approval_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE slot_status AS ENUM ('open', 'held', 'booked', 'blocked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('confirmed', 'in_session', 'completed', 'cancelled', 'no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE room_status AS ENUM ('not_created', 'ready', 'opened', 'ended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE review_status AS ENUM ('published', 'hidden'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TABLES

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,


  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  intro_video_url TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  lesson_duration_options INTEGER[] NOT NULL DEFAULT '{15, 30}',
  teaching_style TEXT,
  certifications TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{"en"}',
  levels TEXT[] NOT NULL DEFAULT '{}',
  trial_enabled BOOLEAN NOT NULL DEFAULT false,
  trial_price DECIMAL(10,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  approval_status teacher_approval_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  learning_goals TEXT,
  interests TEXT[],
  native_language TEXT NOT NULL DEFAULT 'en',
  japanese_level japanese_level NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teacher_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  buffer_minutes INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_template_time CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status slot_status NOT NULL DEFAULT 'open',
  held_by UUID REFERENCES profiles(id),
  held_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);
CREATE INDEX IF NOT EXISTS idx_slots_teacher ON availability_slots(teacher_id, status, start_at);
CREATE INDEX IF NOT EXISTS idx_slots_held ON availability_slots(status, held_until) WHERE status = 'held';

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  slot_id UUID NOT NULL REFERENCES availability_slots(id),
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status booking_status NOT NULL DEFAULT 'confirmed',
  price_amount DECIMAL(10,2),
  platform_fee_amount DECIMAL(10,2),
  teacher_amount DECIMAL(10,2),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  learner_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_learner ON bookings(learner_id, scheduled_start_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher ON bookings(teacher_id, scheduled_start_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status, scheduled_start_at);

CREATE TABLE IF NOT EXISTS daily_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  daily_room_name TEXT NOT NULL UNIQUE,
  daily_room_url TEXT NOT NULL,
  status room_status NOT NULL DEFAULT 'ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id, created_at);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status review_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON reviews(reviewee_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lesson_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  template_type TEXT,
  summary TEXT,
  homework TEXT,
  next_recommendation TEXT,
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(learner_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  learner_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  teacher_payout DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  status payment_status NOT NULL DEFAULT 'unpaid',
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- TRIGGERS (CREATE OR REPLACE = safe)
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_teacher_profiles_updated ON teacher_profiles;
CREATE TRIGGER trg_teacher_profiles_updated BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_bookings_updated ON bookings;
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_learner_profiles_updated ON learner_profiles;
CREATE TRIGGER trg_learner_profiles_updated BEFORE UPDATE ON learner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_reviews_updated ON reviews;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_lesson_reports_updated ON lesson_reports;
CREATE TRIGGER trg_lesson_reports_updated BEFORE UPDATE ON lesson_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Review stats auto-update
CREATE OR REPLACE FUNCTION update_teacher_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teacher_profiles SET
    avg_rating = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2) FROM reviews
      WHERE reviewee_id = NEW.reviewee_id AND status = 'published'
    ), 0),
    review_count = (
      SELECT COUNT(*) FROM reviews
      WHERE reviewee_id = NEW.reviewee_id AND status = 'published'
    )
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_stats ON reviews;
CREATE TRIGGER trg_review_stats
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_teacher_review_stats();

-- Lesson count auto-update
CREATE OR REPLACE FUNCTION update_teacher_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE teacher_profiles SET
      total_lessons = total_lessons + 1
    WHERE user_id = NEW.teacher_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lesson_count ON bookings;
CREATE TRIGGER trg_lesson_count
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_teacher_lesson_count();

-- Hold release function (called by Vercel Cron)
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER;
BEGIN
  UPDATE availability_slots
  SET status = 'open', held_by = NULL, held_until = NULL, updated_at = now()
  WHERE status = 'held' AND held_until < now();
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- Atomic booking function (prevents race conditions)
-- Uses SELECT FOR UPDATE to lock slots within a transaction
-- ===========================================
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_learner_id UUID,
  p_teacher_id UUID,
  p_slot_id UUID,
  p_duration_minutes INTEGER,
  p_learner_note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_slot RECORD;
  v_next_slot RECORD;
  v_booking RECORD;
  v_slot_ids UUID[];
  v_scheduled_end TIMESTAMPTZ;
BEGIN
  -- 1. Prevent booking yourself
  IF p_learner_id = p_teacher_id THEN
    RETURN json_build_object('error', 'Cannot book yourself', 'code', 400);
  END IF;

  -- 2. Validate teacher is approved and public
  IF NOT EXISTS (
    SELECT 1 FROM teacher_profiles
    WHERE user_id = p_teacher_id
      AND approval_status = 'approved'
      AND is_public = true
  ) THEN
    RETURN json_build_object('error', 'Teacher is not available for booking', 'code', 400);
  END IF;

  -- 3. Lock and validate the primary slot (SELECT FOR UPDATE prevents race condition)
  SELECT * INTO v_slot
  FROM availability_slots
  WHERE id = p_slot_id
    AND teacher_id = p_teacher_id
    AND status = 'open'
  FOR UPDATE;

  IF v_slot IS NULL THEN
    RETURN json_build_object('error', 'Slot is no longer available', 'code', 409);
  END IF;

  -- 4. Prevent booking past slots (must be at least 30 min in the future)
  IF v_slot.start_at < (now() + interval '30 minutes') THEN
    RETURN json_build_object('error', 'Cannot book a slot less than 30 minutes from now', 'code', 400);
  END IF;

  -- 5. Check learner doesn't have an overlapping booking
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE learner_id = p_learner_id
      AND status IN ('confirmed', 'in_session')
      AND scheduled_start_at < (v_slot.start_at + (p_duration_minutes || ' minutes')::interval)
      AND scheduled_end_at > v_slot.start_at
  ) THEN
    RETURN json_build_object('error', 'You already have a booking at this time', 'code', 409);
  END IF;

  v_slot_ids := ARRAY[p_slot_id];
  v_scheduled_end := v_slot.end_at;

  -- 6. For 30-min lessons, lock the exact next consecutive slot
  IF p_duration_minutes = 30 THEN
    SELECT * INTO v_next_slot
    FROM availability_slots
    WHERE teacher_id = p_teacher_id
      AND status = 'open'
      AND start_at = v_slot.end_at  -- exact match, not gte
    FOR UPDATE;

    IF v_next_slot IS NULL THEN
      RETURN json_build_object('error', 'Consecutive slot not available for 30-min lesson', 'code', 409);
    END IF;

    v_slot_ids := v_slot_ids || v_next_slot.id;
    v_scheduled_end := v_next_slot.end_at;
  END IF;

  -- 7. Mark slots as booked (skip held state — atomic = no need for hold)
  UPDATE availability_slots
  SET status = 'booked', held_by = NULL, held_until = NULL, updated_at = now()
  WHERE id = ANY(v_slot_ids);

  -- 8. Create booking
  INSERT INTO bookings (
    learner_id, teacher_id, slot_id,
    scheduled_start_at, scheduled_end_at, duration_minutes,
    learner_note, status
  ) VALUES (
    p_learner_id, p_teacher_id, p_slot_id,
    v_slot.start_at, v_scheduled_end, p_duration_minutes,
    p_learner_note, 'confirmed'
  )
  RETURNING * INTO v_booking;

  RETURN json_build_object(
    'booking_id', v_booking.id,
    'scheduled_start_at', v_booking.scheduled_start_at,
    'scheduled_end_at', v_booking.scheduled_end_at,
    'slot_ids', v_slot_ids,
    'code', 201
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- RLS POLICIES
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- profiles

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_roles_insert_own" ON user_roles;
CREATE POLICY "user_roles_insert_own" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- teacher_profiles
DROP POLICY IF EXISTS "teacher_profiles_select_public" ON teacher_profiles;
CREATE POLICY "teacher_profiles_select_public" ON teacher_profiles
  FOR SELECT USING (
    (approval_status = 'approved' AND is_public = true)
    OR auth.uid() = user_id
  );
DROP POLICY IF EXISTS "teacher_profiles_insert" ON teacher_profiles;
CREATE POLICY "teacher_profiles_insert" ON teacher_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "teacher_profiles_update" ON teacher_profiles;
CREATE POLICY "teacher_profiles_update" ON teacher_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- learner_profiles
DROP POLICY IF EXISTS "learner_profiles_select" ON learner_profiles;
CREATE POLICY "learner_profiles_select" ON learner_profiles
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "learner_profiles_insert" ON learner_profiles;
CREATE POLICY "learner_profiles_insert" ON learner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "learner_profiles_update" ON learner_profiles;
CREATE POLICY "learner_profiles_update" ON learner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- teacher_invites
DROP POLICY IF EXISTS "teacher_invites_select" ON teacher_invites;
CREATE POLICY "teacher_invites_select" ON teacher_invites
  FOR SELECT USING (true);

-- schedule_templates
DROP POLICY IF EXISTS "schedule_templates_select" ON schedule_templates;
CREATE POLICY "schedule_templates_select" ON schedule_templates
  FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "schedule_templates_insert" ON schedule_templates;
CREATE POLICY "schedule_templates_insert" ON schedule_templates
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "schedule_templates_update" ON schedule_templates;
CREATE POLICY "schedule_templates_update" ON schedule_templates
  FOR UPDATE USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "schedule_templates_delete" ON schedule_templates;
CREATE POLICY "schedule_templates_delete" ON schedule_templates
  FOR DELETE USING (auth.uid() = teacher_id);





-- availability_slots
DROP POLICY IF EXISTS "slots_select_open" ON availability_slots;
CREATE POLICY "slots_select_open" ON availability_slots
  FOR SELECT USING (status = 'open' OR auth.uid() = teacher_id);
DROP POLICY IF EXISTS "slots_insert" ON availability_slots;
CREATE POLICY "slots_insert" ON availability_slots
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "slots_update" ON availability_slots;
CREATE POLICY "slots_update" ON availability_slots
  FOR UPDATE USING (auth.uid() = teacher_id OR auth.uid() = held_by);
DROP POLICY IF EXISTS "slots_delete" ON availability_slots;
CREATE POLICY "slots_delete" ON availability_slots
  FOR DELETE USING (auth.uid() = teacher_id);

-- bookings
DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (auth.uid() = learner_id OR auth.uid() = teacher_id);
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = learner_id);
DROP POLICY IF EXISTS "bookings_update" ON bookings;
CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE USING (auth.uid() = learner_id OR auth.uid() = teacher_id);

-- daily_rooms
DROP POLICY IF EXISTS "daily_rooms_select" ON daily_rooms;
CREATE POLICY "daily_rooms_select" ON daily_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = daily_rooms.booking_id
      AND (bookings.learner_id = auth.uid() OR bookings.teacher_id = auth.uid())
    )
  );

-- messages
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = messages.booking_id
      AND (bookings.learner_id = auth.uid() OR bookings.teacher_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- reviews
DROP POLICY IF EXISTS "reviews_select_published" ON reviews;
CREATE POLICY "reviews_select_published" ON reviews
  FOR SELECT USING (status = 'published' OR auth.uid() = reviewer_id);
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- lesson_reports
DROP POLICY IF EXISTS "lesson_reports_select" ON lesson_reports;
CREATE POLICY "lesson_reports_select" ON lesson_reports
  FOR SELECT USING (
    auth.uid() = teacher_id
    OR EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = lesson_reports.booking_id
      AND bookings.learner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "lesson_reports_insert" ON lesson_reports;
CREATE POLICY "lesson_reports_insert" ON lesson_reports
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "lesson_reports_update" ON lesson_reports;
CREATE POLICY "lesson_reports_update" ON lesson_reports
  FOR UPDATE USING (auth.uid() = teacher_id);

-- favorites
DROP POLICY IF EXISTS "favorites_select" ON favorites;
CREATE POLICY "favorites_select" ON favorites
  FOR SELECT USING (auth.uid() = learner_id);
DROP POLICY IF EXISTS "favorites_insert" ON favorites;
CREATE POLICY "favorites_insert" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = learner_id);
DROP POLICY IF EXISTS "favorites_delete" ON favorites;
CREATE POLICY "favorites_delete" ON favorites
  FOR DELETE USING (auth.uid() = learner_id);

-- notifications (insert via service_role only — API routes use service role client)
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- payments (service_role only for insert/update, parties can select)
DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (auth.uid() = learner_id OR auth.uid() = teacher_id);
