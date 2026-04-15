-- Lock lesson duration to 30 min across the platform.
-- 1. Change default for new rows.
-- 2. Normalize all existing rows to {30}.

ALTER TABLE teacher_profiles
  ALTER COLUMN lesson_duration_options SET DEFAULT '{30}';

UPDATE teacher_profiles
SET lesson_duration_options = '{30}'
WHERE lesson_duration_options IS DISTINCT FROM '{30}';
