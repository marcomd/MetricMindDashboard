-- Migration: Add GitHub OAuth support with linked accounts
-- This migration adds support for multiple OAuth providers (Google and GitHub)
-- Design: One account per email, both providers can be linked to the same account

-- Step 1: Add github_id column for GitHub OAuth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS github_id VARCHAR(255);

-- Step 2: Make google_id nullable since GitHub-only users won't have it
-- (This may already be nullable, but we ensure it here)
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;

-- Step 3: Ensure email is UNIQUE (one account per email address)
-- Drop and recreate to ensure constraint exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Step 4: Add partial UNIQUE constraints on provider-specific IDs
-- These ensure each Google ID and GitHub ID can only be used once
-- Partial indexes allow NULL values while enforcing uniqueness on non-NULL values

-- Drop any existing indexes that might conflict
DROP INDEX IF EXISTS idx_users_google_id;
DROP INDEX IF EXISTS idx_users_github_id;
DROP INDEX IF EXISTS idx_users_google_id_unique;
DROP INDEX IF EXISTS idx_users_github_id_unique;
DROP INDEX IF EXISTS idx_users_email;

-- Create partial unique indexes (UNIQUE when NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique
  ON users(google_id)
  WHERE google_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id_unique
  ON users(github_id)
  WHERE github_id IS NOT NULL;

-- Step 5: Add regular indexes for fast lookups (non-unique, for performance)
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Schema Design Notes:
-- =====================
-- - email: UNIQUE - One account per email address
-- - google_id: UNIQUE when not null - Each Google ID can only be used once
-- - github_id: UNIQUE when not null - Each GitHub ID can only be used once
-- - Linked accounts: Both google_id AND github_id can be populated for the same user
-- - No separate 'provider' field - determined by which ID is populated during login

-- How It Works:
-- =============
-- Scenario 1: New user signs up with Google
--   → Creates account: email='user@example.com', google_id='123', github_id=NULL
--
-- Scenario 2: Existing user adds GitHub
--   → User logs in with GitHub using same email
--   → System finds existing account by email
--   → Updates account: email='user@example.com', google_id='123', github_id='456'
--   → User can now login with either provider
--
-- Scenario 3: New user signs up with GitHub
--   → Creates account: email='user@example.com', google_id=NULL, github_id='789'
--
-- Benefits:
-- =========
-- - Simple schema without redundant columns
-- - One user identity per email address
-- - Flexible login options (either provider)
-- - Automatic account linking based on email
