-- Add optional tags to reviews for faster social-proof scanning on teacher pages.
-- italki / Preply style: short chips like "patient", "great pronunciation", "well-prepared".
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_reviews_tags ON reviews USING GIN (tags);
