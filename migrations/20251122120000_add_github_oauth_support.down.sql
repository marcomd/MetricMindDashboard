-- Rollback: Remove GitHub OAuth support
-- This migration reverses the changes made by add_github_oauth_support.sql

-- Step 1: Drop indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_github_id;
DROP INDEX IF EXISTS idx_users_google_id;
DROP INDEX IF EXISTS idx_users_github_id_unique;
DROP INDEX IF EXISTS idx_users_google_id_unique;

-- Step 2: Remove github_id column
ALTER TABLE users DROP COLUMN IF EXISTS github_id;

-- Step 3: Remove email unique constraint (will be recreated without explicit name)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Note: We don't restore google_id to NOT NULL as there might be GitHub-only users
-- If you need to restore google_id to NOT NULL, run manually:
-- ALTER TABLE users ALTER COLUMN google_id SET NOT NULL;
