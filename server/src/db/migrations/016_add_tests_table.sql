-- Tests table for grouping questions into named tests
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  topic_tag VARCHAR(100),
  question_count INTEGER DEFAULT 0,
  time_limit_minutes INTEGER DEFAULT 30,
  pass_mark INTEGER DEFAULT 70,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tests_module_id ON tests(module_id);
CREATE INDEX IF NOT EXISTS idx_tests_active ON tests(is_active);

-- Junction table for test-question mapping
CREATE TABLE IF NOT EXISTS test_questions (
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);

-- Trigger to keep updated_at current
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
