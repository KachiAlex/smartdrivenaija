-- Clean Slate Reset - Clears all user data while preserving schema
-- WARNING: This will DELETE ALL USER DATA
-- Run this migration only when you want to start fresh

-- Delete in dependency order (children first, parents last)

-- Biometric and auth data
DELETE FROM biometric_credentials;
DELETE FROM trusted_devices;
DELETE FROM refresh_tokens;
DELETE FROM otp_codes;

-- Progress tracking
DELETE FROM lesson_progress;
DELETE FROM module_progress;
DELETE FROM quiz_attempts;
DELETE FROM mock_test_attempts;

-- Gamification
DELETE FROM user_achievements;
DELETE FROM user_rewards;
DELETE FROM user_streaks;
DELETE FROM xp_exchange_redemptions;
DELETE FROM xp_transactions;
DELETE FROM user_activity_log;

-- User content
DELETE FROM hazard_reports;
DELETE FROM user_notes;
DELETE FROM user_bookmarks;

-- Social
DELETE FROM referrals;
DELETE FROM user_invites;

-- Wallet and documents
DELETE FROM driver_documents;
DELETE FROM user_reminders;

-- Portal data
DELETE FROM fleet_drivers;
DELETE FROM fleet_compliance_items;
DELETE FROM fleet_certifications;
DELETE FROM school_students;
DELETE FROM school_certificates;
DELETE FROM parent_guardian_links;
DELETE FROM guardian_alerts;
DELETE FROM premium_sponsorships;
DELETE FROM renewal_bookings;

-- AI data
DELETE FROM ai_messages;
DELETE FROM ai_conversations;

-- Finally delete all users
DELETE FROM users;

-- Reset sequences so IDs start from 1
SELECT setval('users_id_seq', 1, false);
SELECT setval('biometric_credentials_id_seq', 1, false);
SELECT setval('trusted_devices_id_seq', 1, false);
SELECT setval('refresh_tokens_id_seq', 1, false);
SELECT setval('otp_codes_id_seq', 1, false);
