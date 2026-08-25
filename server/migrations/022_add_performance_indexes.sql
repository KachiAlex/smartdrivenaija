-- Performance indexes for frequently queried columns

-- Users table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_premium ON users(is_premium);

-- OTP codes: fast lookup by phone + verified + expires_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otp_codes_phone_active 
  ON otp_codes(phone, verified, expires_at DESC);

-- Refresh tokens: fast lookup by token, revoked, expires_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_token 
  ON refresh_tokens(token) WHERE revoked = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_id 
  ON refresh_tokens(user_id);

-- User progress: fast lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_id 
  ON user_progress(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_module 
  ON user_progress(user_id, module_id);

-- Quiz attempts: fast lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_attempts_user_id 
  ON quiz_attempts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_attempts_user_module 
  ON quiz_attempts(user_id, module_id);

-- Mock test results
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mock_test_results_user_id 
  ON mock_test_results(user_id);

-- Leaderboard: sorted by XP descending
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_xp_total 
  ON users(xp_total DESC);

-- Wallet transactions: fast lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_user_id 
  ON wallet_transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallet_transactions_created 
  ON wallet_transactions(user_id, created_at DESC);

-- Biometric credentials: fast lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biometric_credentials_user_id 
  ON biometric_credentials(user_id);
