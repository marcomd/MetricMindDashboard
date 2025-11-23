-- Migration: Add GitLab OAuth support with linked accounts
-- This migration adds support for GitLab OAuth provider
-- Design: One account per email, all providers (Google, GitHub, GitLab) can be linked to the same account

-- Step 1: Add gitlab_id column for GitLab OAuth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gitlab_id VARCHAR(255);

-- Step 2: Add partial UNIQUE constraint on gitlab_id
-- This ensures each GitLab ID can only be used once
-- Partial index allows NULL values while enforcing uniqueness on non-NULL values

-- Drop any existing indexes that might conflict
DROP INDEX IF EXISTS idx_users_gitlab_id;
DROP INDEX IF EXISTS idx_users_gitlab_id_unique;

-- Create partial unique index (UNIQUE when NOT NULL)
CREATE UNIQUE INDEX idx_users_gitlab_id_unique
  ON users(gitlab_id)
  WHERE gitlab_id IS NOT NULL;

-- Step 3: Add regular index for fast lookups (non-unique, for performance)
CREATE INDEX idx_users_gitlab_id ON users(gitlab_id);

-- Schema Design Notes:
-- =====================
-- - email: UNIQUE - One account per email address
-- - google_id: UNIQUE when not null - Each Google ID can only be used once
-- - github_id: UNIQUE when not null - Each GitHub ID can only be used once
-- - gitlab_id: UNIQUE when not null - Each GitLab ID can only be used once
-- - Linked accounts: google_id, github_id, AND gitlab_id can all be populated for the same user
-- - No separate 'provider' field - determined by which ID is populated during login

-- How It Works:
-- =============
-- Scenario 1: Existing user adds GitLab
--   → User logs in with GitLab using same email
--   → System finds existing account by email
--   → Updates account: email='user@example.com', google_id='123', github_id='456', gitlab_id='789'
--   → User can now login with any of the three providers
--
-- Scenario 2: New user signs up with GitLab
--   → Creates account: email='user@example.com', google_id=NULL, github_id=NULL, gitlab_id='789'
--
-- Benefits:
-- =========
-- - Simple schema without redundant columns
-- - One user identity per email address
-- - Flexible login options (any provider)
-- - Automatic account linking based on email
