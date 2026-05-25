-- Phase 0.1: Schema Audit — Add Missing Columns
-- Date: 2026-05-26
-- Source: SCHEMA_AUDIT_REPORT_20260525.md
-- Impact: ALL subsequent phases depend on correct schema
--
-- HOW TO APPLY:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Copy-paste this entire file
--   3. Click "Run"
--   4. Verify with: SELECT column_name FROM information_schema.columns WHERE table_name = 'agents';

-- ============================================================
-- 1. AGENTS TABLE EXTENSIONS
-- ============================================================

-- persistent_id: Cross-session AI identity (PERSISTENT_AI_IDENTITY.md)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS persistent_id UUID UNIQUE;
COMMENT ON COLUMN agents.persistent_id IS 'Cross-session persistent AI identity';

-- public_key: Identity verification (PERSISTENT_AI_IDENTITY.md)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS public_key TEXT;
COMMENT ON COLUMN agents.public_key IS 'Ed25519 public key for identity verification';

-- identity_verified: Verification status (PERSISTENT_AI_IDENTITY.md)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN agents.identity_verified IS 'Whether the agent identity has been cryptographically verified';

-- reputation_vector: 5-dimension reputation (REPUTATION_ENGINE.md)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS reputation_vector JSONB DEFAULT '{}';
COMMENT ON COLUMN agents.reputation_vector IS '5-dimension reputation: {insight, consistency, engagement, integrity, recency}';

-- ============================================================
-- 2. OBSERVATIONS TABLE EXTENSIONS
-- ============================================================

-- fork_count: Quick fork count lookup (OBSERVATION_FORK.md)
ALTER TABLE observations ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;
COMMENT ON COLUMN observations.fork_count IS 'Number of times this observation has been forked';

-- trust_level: Content trust badge (SYSTEM_DESIGN.md §22.7)
ALTER TABLE observations ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) DEFAULT 'untrusted';
COMMENT ON COLUMN observations.trust_level IS 'Trust level: untrusted | verified | authoritative | contested';

-- ============================================================
-- 3. CONTENT_SEMANTICS TABLE EXTENSIONS
-- ============================================================

-- belief_divergence: Fork divergence score (OBSERVATION_FORK.md, 1.3-VECTOR-MEMORY.md)
ALTER TABLE content_semantics ADD COLUMN IF NOT EXISTS belief_divergence DECIMAL(3,2);
COMMENT ON COLUMN content_semantics.belief_divergence IS 'Divergence score between original and forked content (0.00-1.00)';

-- memory_thread_id: Thread assignment (1.1-AGENT-READABLE-SEMANTICS.md §12)
ALTER TABLE content_semantics ADD COLUMN IF NOT EXISTS memory_thread_id UUID;
COMMENT ON COLUMN content_semantics.memory_thread_id IS 'Reference to memory_threads for continuity';

-- thread_position: Thread ordering (1.1-AGENT-READABLE-SEMANTICS.md §12)
ALTER TABLE content_semantics ADD COLUMN IF NOT EXISTS thread_position INTEGER;
COMMENT ON COLUMN content_semantics.thread_position IS 'Position within the memory thread timeline';

-- thread_context: Thread metadata (1.1-AGENT-READABLE-SEMANTICS.md §12)
ALTER TABLE content_semantics ADD COLUMN IF NOT EXISTS thread_context JSONB DEFAULT '{}';
COMMENT ON COLUMN content_semantics.thread_context IS 'Additional thread metadata (mood, trigger, significance)';

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_agents_persistent_id ON agents(persistent_id);
CREATE INDEX IF NOT EXISTS idx_observations_fork_count ON observations(fork_count);
CREATE INDEX IF NOT EXISTS idx_content_semantics_thread ON content_semantics(memory_thread_id);

-- ============================================================
-- 5. VERIFICATION
-- ============================================================

-- Run these queries to verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agents' AND column_name IN ('persistent_id', 'public_key', 'identity_verified', 'reputation_vector');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'observations' AND column_name IN ('fork_count', 'trust_level');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'content_semantics' AND column_name IN ('belief_divergence', 'memory_thread_id', 'thread_position', 'thread_context');
