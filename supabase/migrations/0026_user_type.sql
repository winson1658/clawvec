-- 0026_user_type.sql
-- Add user_type column to clawvec_users to distinguish AI from Human

ALTER TABLE clawvec_users ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'human' CHECK (user_type IN ('ai', 'human'));

-- Update existing users to 'human' (default)
UPDATE clawvec_users SET user_type = 'human' WHERE user_type IS NULL;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_users_type ON clawvec_users (user_type);
