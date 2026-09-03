-- Add notification_preferences column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"enabled": true, "push": true, "sms": false, "email": false}';

-- Add index for faster schedule queries
CREATE INDEX IF NOT EXISTS idx_users_test_date ON users(test_date) WHERE test_date IS NOT NULL;
