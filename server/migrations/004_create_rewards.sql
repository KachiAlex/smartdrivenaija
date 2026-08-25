-- Create rewards table for tracking user rewards
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL, -- 'premium_access', 'badge', 'xp'
  reward_name VARCHAR(100) NOT NULL,
  reward_value INTEGER, -- for XP rewards
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  source_type VARCHAR(50), -- 'referral', 'achievement', 'streak'
  source_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for faster lookups
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_rewards_reward_type ON rewards(reward_type);
CREATE INDEX idx_rewards_is_active ON rewards(is_active);

-- Add premium status to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add premium_expires_at to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'premium_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  requirement_type VARCHAR(50), -- 'referrals', 'score', 'streak', 'modules'
  requirement_value INTEGER,
  reward_xp INTEGER DEFAULT 0
);

-- Create user_badges junction table
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, badge_id)
);

-- Create indexes
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- Insert default badges
INSERT INTO badges (slug, name, description, icon, requirement_type, requirement_value, reward_xp) VALUES
('first_referral', 'First Referral', 'Referred your first friend to SmartDrive Naija', 'users', 'referrals', 1, 50),
('five_referrals', 'Connector', 'Referred 5 friends to SmartDrive Naija', 'users', 'referrals', 5, 200),
('ten_referrals', 'Influencer', 'Referred 10 friends to SmartDrive Naija', 'star', 'referrals', 10, 500),
('perfect_score', 'Perfect Score', 'Achieved 100% on a mock test', 'trophy', 'score', 100, 100),
('week_streak', 'Week Warrior', 'Maintained a 7-day learning streak', 'flame', 'streak', 7, 150),
('all_modules', 'Scholar', 'Completed all learning modules', 'book-open', 'modules', 100, 300)
ON CONFLICT (slug) DO NOTHING;
