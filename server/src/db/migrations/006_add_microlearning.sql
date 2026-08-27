-- Add microlearning support to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_microlesson BOOLEAN DEFAULT FALSE;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 10;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS microlesson_order INTEGER;

-- Add index for microlesson filtering
CREATE INDEX IF NOT EXISTS idx_lessons_is_microlesson ON lessons(is_microlesson);
CREATE INDEX IF NOT EXISTS idx_lessons_microlesson_order ON lessons(module_id, microlesson_order);
