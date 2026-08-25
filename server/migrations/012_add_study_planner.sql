-- Create study_schedules table for AI-generated study plans
CREATE TABLE IF NOT EXISTS study_schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_name VARCHAR(100) NOT NULL,
  goal_type VARCHAR(50) NOT NULL, -- 'exam_prep', 'improvement', 'refresher'
  target_date DATE,
  daily_study_minutes INTEGER DEFAULT 30,
  schedule_data JSONB NOT NULL, -- Stores the daily schedule
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create study_progress table to track daily progress
CREATE TABLE IF NOT EXISTS study_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_id INTEGER REFERENCES study_schedules(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  planned_minutes INTEGER NOT NULL,
  actual_minutes INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, schedule_id, study_date)
);

-- Create indexes for efficient queries
CREATE INDEX idx_study_schedules_user_id ON study_schedules(user_id);
CREATE INDEX idx_study_schedules_is_active ON study_schedules(is_active);
CREATE INDEX idx_study_schedules_goal_type ON study_schedules(goal_type);
CREATE INDEX idx_study_progress_user_id ON study_progress(user_id);
CREATE INDEX idx_study_progress_schedule_id ON study_progress(schedule_id);
CREATE INDEX idx_study_progress_date ON study_progress(study_date);
