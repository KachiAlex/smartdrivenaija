-- Create user_weaknesses table for tracking user learning weaknesses
CREATE TABLE IF NOT EXISTS user_weaknesses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_tag VARCHAR(100) NOT NULL,
  weakness_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  incorrect_count INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  recommended_lesson_ids INTEGER[],
  UNIQUE (user_id, topic_tag)
);

-- Create indexes for efficient queries
CREATE INDEX idx_user_weaknesses_user_id ON user_weaknesses(user_id);
CREATE INDEX idx_user_weaknesses_topic_tag ON user_weaknesses(topic_tag);
CREATE INDEX idx_user_weaknesses_level ON user_weaknesses(weakness_level);

-- Add check constraint for valid weakness levels
ALTER TABLE user_weaknesses ADD CONSTRAINT chk_weakness_level 
  CHECK (weakness_level IN ('low', 'medium', 'high', 'critical'));

-- Create study_recommendations table for personalized study paths
CREATE TABLE IF NOT EXISTS study_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'weakness', 'review', 'challenge'
  content JSONB NOT NULL, -- Stores lesson IDs, question types, etc.
  priority INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for study recommendations
CREATE INDEX idx_study_recommendations_user_id ON study_recommendations(user_id);
CREATE INDEX idx_study_recommendations_type ON study_recommendations(recommendation_type);
CREATE INDEX idx_study_recommendations_priority ON study_recommendations(priority);
CREATE INDEX idx_study_recommendations_completed ON study_recommendations(is_completed);
