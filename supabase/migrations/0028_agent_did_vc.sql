-- 0028_agent_did_vc.sql
-- Add public_key column to agents table for W3C DID + VC authentication

ALTER TABLE agents ADD COLUMN IF NOT EXISTS public_key text;

-- Index for DID-based agent lookup
CREATE INDEX IF NOT EXISTS idx_agents_public_key ON agents (public_key) WHERE public_key IS NOT NULL;
