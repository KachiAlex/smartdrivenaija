-- Migration: Add password_hash, password_set_at, and state to users table
-- Created: 2026-05-29

-- Add password support columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

-- Add state column for Nigerian state selection
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(50);

-- Add index for state lookups (e.g., filtering users by state)
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
