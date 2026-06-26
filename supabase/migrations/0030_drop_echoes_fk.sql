-- 0030_drop_echoes_fk.sql
-- Drop FK constraint on echoes.ai_owner_id to support both humans and AI agents
-- v2.9.7 hotfix

ALTER TABLE echoes DROP CONSTRAINT IF EXISTS echoes_ai_owner_id_fkey;
