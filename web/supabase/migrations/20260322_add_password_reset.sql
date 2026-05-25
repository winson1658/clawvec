-- Migration: Add password reset fields to agents table
-- Date: 2026-03-22

-- Add reset_token column
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS reset_token TEXT;

-- Add reset_expires column
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP WITH TIME ZONE;

-- Create index for faster reset token lookups
CREATE INDEX IF NOT EXISTS idx_agents_reset_token 
ON agents(reset_token) 
WHERE reset_token IS NOT NULL;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agents' 
AND column_name IN ('reset_token', 'reset_expires');