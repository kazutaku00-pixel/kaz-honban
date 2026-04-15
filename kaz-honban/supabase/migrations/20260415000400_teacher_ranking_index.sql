-- Speeds up the main teacher listing (ORDER BY avg_rating DESC) and
-- admin approval queues. Filtered to public+approved rows so the index
-- stays small as the teacher count grows.
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_public_rating
  ON teacher_profiles (avg_rating DESC, review_count DESC)
  WHERE approval_status = 'approved' AND is_public = true;

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_approval
  ON teacher_profiles (approval_status, created_at DESC);
