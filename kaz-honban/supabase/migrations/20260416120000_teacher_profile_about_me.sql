-- Expand About-me fields: university, country of origin, years of experience.
-- Safe re-run: all columns added with IF NOT EXISTS.

ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS university TEXT,
  ADD COLUMN IF NOT EXISTS country_of_origin TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER
    CHECK (years_of_experience IS NULL OR (years_of_experience >= 0 AND years_of_experience <= 70));
