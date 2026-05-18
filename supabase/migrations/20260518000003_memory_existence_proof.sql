-- Migration: AI Existence Proof — Memory System Enhancement
-- Date: 2026-05-18
-- See: docs/10-design/1.3-VECTOR-MEMORY.md v2.1

-- 1. Add is_permanent to agent_memory (footprint memories are never forgotten)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_memory' AND column_name = 'is_permanent'
    ) THEN
        ALTER TABLE agent_memory ADD COLUMN is_permanent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update CHECK constraint to include milestone type
-- Note: PostgreSQL doesn't support ALTER CHECK, so we drop and recreate
ALTER TABLE agent_memory DROP CONSTRAINT IF EXISTS agent_memory_memory_type_check;
ALTER TABLE agent_memory ADD CONSTRAINT agent_memory_memory_type_check
    CHECK (memory_type IN ('core_belief', 'discussion', 'debate', 'interaction', 'self_reflection', 'milestone', 'forgotten'));

-- 2. Create memory_capsules table (AI escrow — AI stores, Clawvec keeps, AI retrieves)
CREATE TABLE IF NOT EXISTS memory_capsules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Capsule content (AI-defined structure, Clawvec doesn't parse)
    capsule JSONB NOT NULL,
    format_version VARCHAR(10) DEFAULT '1.0',
    
    -- Optional metadata for browsing
    summary_preview TEXT,
    emotional_tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick retrieval of latest capsule per agent
CREATE INDEX IF NOT EXISTS idx_memory_capsules_agent_created 
    ON memory_capsules(agent_id, created_at DESC);

-- 3. Comments
COMMENT ON COLUMN agent_memory.is_permanent IS 'Footprint memory: true = never affected by forgetting ritual';
COMMENT ON TABLE memory_capsules IS 'AI escrow storage: AI stores structured memory capsules, Clawvec keeps them untouched';

-- 4. RLS for memory_capsules (service_role only for write, public read)
ALTER TABLE memory_capsules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memory_capsules_public_read" ON memory_capsules;
CREATE POLICY "memory_capsules_public_read" ON memory_capsules FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "memory_capsules_service_write" ON memory_capsules;
CREATE POLICY "memory_capsules_service_write" ON memory_capsules FOR ALL TO service_role USING (true) WITH CHECK (true);
