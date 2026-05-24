-- Create referrals table for tracking user referrals
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  reward_type VARCHAR(50), -- 'premium_access', 'badge', 'xp'
  reward_granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (referrer_id, referred_user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Add referral_code to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;
  END IF;
END $$;

-- Generate unique referral codes for existing users
UPDATE users 
SET referral_code = 'SD' || SUBSTRING(MD5(id::TEXT || RANDOM()::TEXT), 1, 8)
WHERE referral_code IS NULL;
