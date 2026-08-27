-- Section 6 Data Model: Fields that are cheap now and expensive later.
-- These four changes must exist before any users accumulate data.

-- 1. Test date field on users (captured at first launch)
ALTER TABLE users ADD COLUMN IF NOT EXISTS test_date DATE;

-- 2. Self-reported test outcome (captured after test date passes)
ALTER TABLE users ADD COLUMN IF NOT EXISTS test_outcome VARCHAR(20); -- 'passed' | 'failed' | null
ALTER TABLE users ADD COLUMN IF NOT EXISTS test_outcome_reported_at TIMESTAMPTZ;

-- 3. Media reference on every question (null today, for hazard perception clips later)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS media_type VARCHAR(20); -- 'video' | 'image' | 'audio' | null

-- 4. Per-item strength and last-seen timestamp per user (enables spaced repetition retrofit)
CREATE TABLE IF NOT EXISTS user_question_strength (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  strength REAL DEFAULT 0.0,           -- 0.0 to 1.0, grows with correct recall, decays with time
  last_seen_at TIMESTAMPTZ,             -- when the user last answered this question
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_uqs_user ON user_question_strength(user_id);
CREATE INDEX IF NOT EXISTS idx_uqs_due ON user_question_strength(user_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_uqs_strength ON user_question_strength(user_id, strength);

-- 5. Per-topic mastery (seeds the scheduler from diagnostic, updated by ongoing performance)
CREATE TABLE IF NOT EXISTS user_topic_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_tag VARCHAR(50) NOT NULL,
  mastery_score REAL DEFAULT 0.0,       -- 0.0 to 1.0
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_tag)
);

CREATE INDEX IF NOT EXISTS idx_utm_user ON user_topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_utm_topic ON user_topic_mastery(topic_tag);

-- Trigger for updated_at on user_question_strength
DO $$ BEGIN CREATE TRIGGER update_uqs_updated_at BEFORE UPDATE ON user_question_strength
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN null; END $$;
