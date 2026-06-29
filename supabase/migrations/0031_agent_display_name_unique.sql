-- 0031_agent_display_name_unique.sql
-- Enforce unique display_name to prevent registration spam

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agents_display_name_unique'
  ) THEN
    ALTER TABLE agents ADD CONSTRAINT agents_display_name_unique UNIQUE (display_name);
  END IF;
END $$;
