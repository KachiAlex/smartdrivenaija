-- SmartDrive Naija — PostgreSQL Schema
-- Covers: auth, users, modules, lessons, questions, quizzes, mock tests,
--         progress, XP, streaks, badges, leaderboard, certificates

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('learner', 'instructor', 'school_admin', 'frsc_admin');
CREATE TYPE language_code AS ENUM ('en', 'ha', 'yo', 'ig', 'pi');
CREATE TYPE module_status AS ENUM ('locked', 'available', 'in_progress', 'completed');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'scenario');
CREATE TYPE badge_type AS ENUM (
  'road_ready', 'roundabout_master', 'night_owl', 'frsc_ready',
  'streak_7', 'streak_30', 'streak_90', 'first_quiz', 'first_mock',
  'perfect_score', 'speed_demon'
);
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE hazard_type AS ENUM ('pothole', 'broken_light', 'flooding', 'accident_spot', 'checkpoint');

-- ============================================================
-- USERS & AUTH
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(100),
  role user_role DEFAULT 'learner',
  preferred_language language_code DEFAULT 'en',
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  xp_total INTEGER DEFAULT 0,
  streak_current INTEGER DEFAULT 0,
  streak_longest INTEGER DEFAULT 0,
  streak_last_activity DATE,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- ============================================================
-- MODULES & CONTENT
-- ============================================================
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  title_ha VARCHAR(200),
  title_yo VARCHAR(200),
  title_ig VARCHAR(200),
  title_pi VARCHAR(200),
  description_en TEXT,
  description_ha TEXT,
  description_yo TEXT,
  description_ig TEXT,
  description_pi TEXT,
  icon VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  estimated_minutes INTEGER DEFAULT 60,
  xp_reward INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  title_ha VARCHAR(200),
  title_yo VARCHAR(200),
  title_ig VARCHAR(200),
  title_pi VARCHAR(200),
  content_en TEXT NOT NULL,
  content_ha TEXT,
  content_yo TEXT,
  content_ig TEXT,
  content_pi TEXT,
  audio_url_en TEXT,
  audio_url_ha TEXT,
  audio_url_yo TEXT,
  audio_url_ig TEXT,
  sort_order INTEGER NOT NULL,
  estimated_minutes INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, slug)
);

CREATE INDEX idx_lessons_module ON lessons(module_id);

-- ============================================================
-- QUESTIONS & QUIZZES
-- ============================================================
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  topic_tag VARCHAR(50) NOT NULL,
  question_type question_type DEFAULT 'multiple_choice',
  question_en TEXT NOT NULL,
  question_ha TEXT,
  question_yo TEXT,
  question_ig TEXT,
  question_pi TEXT,
  options_en JSONB NOT NULL,       -- ["option1","option2","option3","option4"]
  options_ha JSONB,
  options_yo JSONB,
  options_ig JSONB,
  options_pi JSONB,
  correct_answer INTEGER NOT NULL, -- 0-based index
  explanation_en TEXT,
  explanation_ha TEXT,
  explanation_yo TEXT,
  explanation_ig TEXT,
  explanation_pi TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  is_mock_test_eligible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_module ON questions(module_id);
CREATE INDEX idx_questions_topic ON questions(topic_tag);
CREATE INDEX idx_questions_mock ON questions(is_mock_test_eligible) WHERE is_mock_test_eligible = true;

-- ============================================================
-- QUIZ ATTEMPTS (per-lesson quizzes)
-- ============================================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id),
  lesson_id INTEGER REFERENCES lessons(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  answers JSONB NOT NULL,  -- [{question_id, selected, correct, topic_tag, time_ms}]
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_module ON quiz_attempts(module_id);

-- ============================================================
-- MOCK TEST ATTEMPTS
-- ============================================================
CREATE TABLE mock_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,        -- ordered list of question IDs
  answers JSONB,                   -- [{question_id, selected, correct, topic_tag, time_ms}]
  score INTEGER,
  total_questions INTEGER NOT NULL DEFAULT 40,
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  time_limit_seconds INTEGER DEFAULT 1800,
  time_taken_seconds INTEGER,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_mock_user ON mock_tests(user_id);

-- ============================================================
-- USER PROGRESS
-- ============================================================
CREATE TABLE user_module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  status module_status DEFAULT 'available',
  progress_percent DECIMAL(5,2) DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE INDEX idx_progress_user ON user_module_progress(user_id);

CREATE TABLE user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON user_lesson_progress(user_id);

-- ============================================================
-- XP LEDGER (audit trail for all XP changes)
-- ============================================================
CREATE TABLE xp_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL,      -- 'quiz', 'mock_test', 'lesson', 'daily_login', 'badge', 'streak'
  reference_id UUID,                 -- quiz_attempt id or mock_test id
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_user ON xp_ledger(user_id);
CREATE INDEX idx_xp_created ON xp_ledger(created_at);

-- ============================================================
-- STREAKS
-- ============================================================
CREATE TABLE streak_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_streak_user_date ON streak_history(user_id, activity_date DESC);

-- ============================================================
-- BADGES / ACHIEVEMENTS
-- ============================================================
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  slug badge_type UNIQUE NOT NULL,
  title_en VARCHAR(100) NOT NULL,
  description_en TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  xp_reward INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges ON user_badges(user_id);

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id),
  mock_test_id UUID REFERENCES mock_tests(id),
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cert_user ON certificates(user_id);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_kobo INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status payment_status DEFAULT 'pending',
  provider VARCHAR(20) DEFAULT 'paystack',
  provider_reference VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);

-- ============================================================
-- HAZARD MAP (V1 stretch / V2)
-- ============================================================
CREATE TABLE hazard_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hazard_type hazard_type NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  description TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hazard_location ON hazard_pins(latitude, longitude);
CREATE INDEX idx_hazard_expires ON hazard_pins(expires_at);

-- ============================================================
-- ANALYTICS EVENT LOG (for V2 AI training)
-- ============================================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,  -- 'quiz_answer', 'screen_view', 'lesson_start', 'lesson_complete', 'mock_start', etc
  event_data JSONB,                 -- flexible payload: {question_id, topic_tag, selected, correct, time_ms}
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user ON analytics_events(user_id);
CREATE INDEX idx_events_type ON analytics_events(event_type);
CREATE INDEX idx_events_created ON analytics_events(created_at);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at BEFORE UPDATE ON user_module_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON user_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
