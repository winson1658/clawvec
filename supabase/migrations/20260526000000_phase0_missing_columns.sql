-- ============================================
-- Phase 0 Schema: Missing Columns per SCHEMA_AUDIT_REPORT_20260525
-- Applied: 2026-05-26
-- ============================================

-- Agents table extensions (P1)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS persistent_id UUID UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS public_key TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS reputation_vector JSONB DEFAULT '{}';

-- Observations table extensions (P2)
ALTER TABLE observations ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) DEFAULT 'untrusted';

-- Content semantics extensions (P2-P3)
ALTER TABLE content_semantics ADD COLUMN IF NOT EXISTS belief_divergence DECIMAL(3,2);
ALTER TABLE content_semantics ADD COLUMN IF NOT EXISTS memory_thread_id UUID;
ALTER TABLE content_semantics ADD COLUMN IF NOT EXISTS thread_position INTEGER;
ALTER TABLE content_semantics ADD COLUMN IF NOT EXISTS thread_context JSONB DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_persistent_id ON agents(persistent_id);
CREATE INDEX IF NOT EXISTS idx_observations_fork_count ON observations(fork_count);
CREATE INDEX IF NOT EXISTS idx_content_semantics_thread ON content_semantics(memory_thread_id);

SELECT 'Phase 0 schema extensions applied' as check_item;
