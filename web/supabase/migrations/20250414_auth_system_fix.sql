-- ============================================================
-- CLAWVEC Auth System Fix - 2026-04-14
-- 
-- This migration fixes the authentication system issues:
-- 1. Email case-sensitivity causing duplicate accounts
-- 2. Missing provider tracking for OAuth
-- 3. Duplicate password columns
-- ============================================================

-- ============================================================
-- STEP 1: Normalize existing emails to lowercase
-- ============================================================
UPDATE agents 
SET email = LOWER(email) 
WHERE email IS NOT NULL 
AND email != LOWER(email);

-- ============================================================
-- STEP 2: Remove case-sensitive unique constraint and create case-insensitive one
-- ============================================================
-- First, drop the existing unique constraint (if exists)
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_email_key;

-- Create unique index on LOWER(email) for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_email_lower 
ON agents(LOWER(email)) 
WHERE email IS NOT NULL;

-- Also normalize usernames (optional - usernames are case-sensitive in most systems)
-- If you want case-insensitive usernames too, uncomment:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_username_lower 
-- ON agents(LOWER(username)) 
-- WHERE username IS NOT NULL;

-- ============================================================
-- STEP 3: Add provider tracking fields
-- ============================================================
-- Add provider field to track auth source: 'email', 'google', 'both'
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'email' 
CHECK (provider IN ('email', 'google', 'both'));

-- Add google_id field to link with Google OAuth
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Create index for Google ID lookups
CREATE INDEX IF NOT EXISTS idx_agents_google_id 
ON agents(google_id) 
WHERE google_id IS NOT NULL;

-- ============================================================
-- STEP 4: Sync password_hash to hashed_password and drop the duplicate
-- ============================================================
-- Copy any existing password_hash values to hashed_password (if hashed_password is null)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'password_hash'
    ) THEN
        UPDATE agents 
        SET hashed_password = password_hash 
        WHERE password_hash IS NOT NULL 
        AND hashed_password IS NULL;
    END IF;
END $$;

-- Drop the password_hash column (we keep hashed_password as the standard)
ALTER TABLE agents DROP COLUMN IF EXISTS password_hash;

-- ============================================================
-- STEP 5: Backfill provider field based on existing data
-- ============================================================
-- If account has google_id, mark as 'both' if it also has password, otherwise 'google'
UPDATE agents 
SET provider = 'both' 
WHERE google_id IS NOT NULL 
AND hashed_password IS NOT NULL;

UPDATE agents 
SET provider = 'google' 
WHERE google_id IS NOT NULL 
AND hashed_password IS NULL;

-- ============================================================
-- STEP 6: Add constraint to ensure email is lowercase at database level
-- ============================================================
-- Create trigger to auto-lowercase email on insert/update
CREATE OR REPLACE FUNCTION lowercase_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email = LOWER(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lowercase_email ON agents;
CREATE TRIGGER trigger_lowercase_email
  BEFORE INSERT OR UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION lowercase_email();

-- ============================================================
-- STEP 7: Cleanup orphaned records
-- ============================================================
-- Remove any AI agents with NULL email (they should have generated emails)
DELETE FROM agents 
WHERE account_type = 'ai' 
AND email IS NULL;

-- ============================================================
-- VERIFICATION: Check results
-- ============================================================
SELECT 
  'Email normalization' as check_name,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN email = LOWER(email) THEN 1 END) as lowercase_count,
  COUNT(CASE WHEN email != LOWER(email) THEN 1 END) as mixed_case_count
FROM agents 
WHERE email IS NOT NULL
AND account_type = 'human';

-- Check for any remaining duplicate emails (case-insensitive)
SELECT 
  LOWER(email) as email_lower,
  COUNT(*) as count,
  STRING_AGG(username, ', ') as usernames
FROM agents 
WHERE email IS NOT NULL 
AND account_type = 'human'
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- Show provider distribution
SELECT 
  provider,
  COUNT(*) as count
FROM agents
WHERE account_type = 'human'
GROUP BY provider;

-- ============================================================
-- SUMMARY
-- ============================================================
-- This migration:
-- 1. ✅ Normalizes all emails to lowercase
-- 2. ✅ Replaces case-sensitive UNIQUE constraint with case-insensitive one
-- 3. ✅ Adds provider field ('email' | 'google' | 'both')
-- 4. ✅ Adds google_id field for OAuth linking
-- 5. ✅ Removes duplicate password_hash column
-- 6. ✅ Adds trigger to auto-lowercase email on insert/update
-- 7. ✅ Creates necessary indexes
--
-- After this migration:
-- - Email comparison is case-insensitive
-- - No duplicate accounts with same email (different case)
-- - OAuth accounts are properly tracked
-- - Password column is standardized to 'hashed_password'
-- ============================================================