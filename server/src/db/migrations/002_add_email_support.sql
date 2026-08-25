-- Migration: Add email support for OTP and user authentication
-- Created: 2026-05-23

-- 1. Expand otp_codes.phone column to support email identifiers
ALTER TABLE otp_codes ALTER COLUMN phone TYPE VARCHAR(255);

-- 2. Add email column to users table
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;

-- 3. Make phone nullable since email can be the primary identifier
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- 4. Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
