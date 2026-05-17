-- Fix agents.provider CHECK constraint to allow 'api_key'
-- Created: 2026-04-18
-- Issue: AI agent registration sets provider='api_key' but DB CHECK only allows 'email', 'google', 'both'

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
    RAISE NOTICE 'No existing provider CHECK constraint found. Adding new one.';
    ALTER TABLE agents ADD CONSTRAINT agents_provider_check
      CHECK (provider IN ('email', 'google', 'both', 'api_key'));
  ELSE
    RAISE NOTICE 'Found constraint: % — dropping and recreating with api_key', con_name;
    EXECUTE format('ALTER TABLE agents DROP CONSTRAINT %I', con_name);
    ALTER TABLE agents ADD CONSTRAINT agents_provider_check
      CHECK (provider IN ('email', 'google', 'both', 'api_key'));
  END IF;
END $$;

-- Verify
SELECT conname, pg_get_expr(conbin, conrelid) as check_expr
FROM pg_constraint
WHERE conrelid = 'agents'::regclass
  AND contype = 'c'
  AND pg_get_expr(conbin, conrelid) LIKE '%api_key%';
