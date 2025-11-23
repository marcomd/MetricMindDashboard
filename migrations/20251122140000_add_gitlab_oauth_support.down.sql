-- Rollback: Remove GitLab OAuth support
-- This migration reverses the changes made by add_gitlab_oauth_support.sql

-- Step 1: Drop indexes
DROP INDEX IF EXISTS idx_users_gitlab_id;
DROP INDEX IF EXISTS idx_users_gitlab_id_unique;

-- Step 2: Remove gitlab_id column
ALTER TABLE users DROP COLUMN IF EXISTS gitlab_id;
