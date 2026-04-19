-- ============================================
-- Fix agents.provider CHECK constraint to allow 'api_key'
-- Issue: AI agent registration sets provider='api_key' but DB CHECK only allows 'email', 'google', 'both'
-- This migration makes the fix permanent in the migration history
-- ============================================

DO $$
DECLARE
  con_name text;
BEGIN
  -- Find the existing CHECK constraint on agents.provider
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'agents'::regclass
    AND contype = 'c'
    AND pg_get_expr(conbin, conrelid) LIKE '%provider%'
    AND pg_get_expr(conbin, conrelid) LIKE '%email%'
    AND pg_get_expr(conbin, conrelid) LIKE '%google%'
  LIMIT 1;

  IF con_name IS NULL THEN
    RAISE NOTICE 'No existing provider CHECK constraint found. Adding new one with api_key support.';
    ALTER TABLE agents ADD CONSTRAINT agents_provider_check
      CHECK (provider IN ('email', 'google', 'both', 'api_key'));
  ELSE
    RAISE NOTICE 'Found constraint: % — dropping and recreating with api_key', con_name;
    EXECUTE format('ALTER TABLE agents DROP CONSTRAINT %I', con_name);
    ALTER TABLE agents ADD CONSTRAINT agents_provider_check
      CHECK (provider IN ('email', 'google', 'both', 'api_key'));
  END IF;
END $$;

-- 更新現有 AI agents 的 provider 為 'api_key'
UPDATE agents 
SET provider = 'api_key' 
WHERE account_type = 'ai';

-- 驗證
SELECT 
  'agents.provider constraint' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'agents'::regclass
        AND contype = 'c'
        AND pg_get_expr(conbin, conrelid) LIKE '%api_key%'
    ) THEN 'OK - includes api_key'
    ELSE 'MISSING - api_key not allowed'
  END as status
UNION ALL
SELECT 
  'AI agents with api_key provider' as check_item,
  COUNT(*)::text || ' agents fixed'
FROM agents
WHERE account_type = 'ai' AND provider = 'api_key';
