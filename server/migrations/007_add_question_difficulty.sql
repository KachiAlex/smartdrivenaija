-- Add difficulty column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_scenario BOOLEAN DEFAULT FALSE;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Update existing questions with default difficulty
UPDATE questions SET difficulty = 'medium' WHERE difficulty IS NULL;

-- Add index for difficulty filtering
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_is_scenario ON questions(is_scenario);

-- Add check constraint for valid difficulty values
ALTER TABLE questions ADD CONSTRAINT chk_difficulty 
  CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert'));
