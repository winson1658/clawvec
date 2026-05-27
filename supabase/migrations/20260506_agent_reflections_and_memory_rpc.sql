-- Migration: Add agent_reflections table for AI Memory System
-- Date: 2026-05-06
-- Depends on: 20260423_phase2_prereq.sql (agents table, agent_memory table)

-- ============================================
-- agent_reflections: Self-reflection records for AI agents
-- ============================================
CREATE TABLE IF NOT EXISTS agent_reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- 反思觸發
    trigger_type VARCHAR(30) NOT NULL
        CHECK (trigger_type IN ('scheduled', 'event_driven', 'user_prompted', 'milestone')),
    trigger_description TEXT,
    
    -- 反思內容
    reflection_text TEXT NOT NULL,
    key_insights JSONB DEFAULT '[]',
        -- [
        --   { "insight": "...", "confidence": 0.8 },
        --   { "insight": "...", "confidence": 0.6 }
        -- ]
    
    -- 關聯記憶
    related_memory_ids UUID[] DEFAULT '{}',
    
    -- 可見性
    visibility VARCHAR(20) DEFAULT 'agent_only'
        CHECK (visibility IN ('agent_only', 'all')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_reflections_agent
    ON agent_reflections(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_reflections_trigger
    ON agent_reflections(trigger_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_reflections_visibility
    ON agent_reflections(agent_id, visibility)
    WHERE visibility = 'agent_only';

-- RLS
ALTER TABLE agent_reflections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON agent_reflections;
CREATE POLICY "Allow all" ON agent_reflections FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- query_agent_memory: RPC function for vector similarity search
-- ============================================
CREATE OR REPLACE FUNCTION query_agent_memory(
    p_agent_id UUID,
    p_query_embedding VECTOR(1536),
    p_memory_types TEXT[] DEFAULT NULL,
    p_min_importance DECIMAL(3,2) DEFAULT 0,
    p_limit INTEGER DEFAULT 10,
    p_include_archived BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    memory_type VARCHAR(30),
    memory_text TEXT,
    importance_score DECIMAL(3,2),
    similarity FLOAT,
    created_at TIMESTAMP WITH TIME ZONE,
    source_type VARCHAR(30),
    source_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        am.id,
        am.memory_type,
        am.memory_text,
        am.importance_score,
        1 - (am.embedding <=> p_query_embedding)::FLOAT AS similarity,
        am.created_at,
        am.source_type,
        am.source_id
    FROM agent_memory am
    WHERE am.agent_id = p_agent_id
        AND (p_memory_types IS NULL OR am.memory_type = ANY(p_memory_types))
        AND am.importance_score >= p_min_importance
        AND (p_include_archived OR am.is_archived = FALSE)
        AND am.embedding IS NOT NULL
    ORDER BY am.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$;

-- ============================================
-- get_recent_memories: Helper for reflection generation
-- ============================================
CREATE OR REPLACE FUNCTION get_recent_memories(
    p_agent_id UUID,
    p_days INTEGER DEFAULT 7,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    memory_type VARCHAR(30),
    memory_text TEXT,
    importance_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE,
    source_type VARCHAR(30)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        am.id,
        am.memory_type,
        am.memory_text,
        am.importance_score,
        am.created_at,
        am.source_type
    FROM agent_memory am
    WHERE am.agent_id = p_agent_id
        AND am.created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND am.is_archived = FALSE
    ORDER BY am.importance_score DESC, am.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ============================================
-- archive_old_memories: Daily forgetting ritual
-- ============================================
CREATE OR REPLACE FUNCTION archive_old_memories(
    p_agent_id UUID DEFAULT NULL,
    p_decay_threshold DECIMAL(3,2) DEFAULT 0.1
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    archived_count INTEGER := 0;
BEGIN
    UPDATE agent_memory
    SET 
        is_archived = TRUE,
        archived_at = NOW(),
        archive_reason = 'decayed_below_threshold',
        access_count = access_count + 1
    WHERE 
        is_archived = FALSE
        AND (p_agent_id IS NULL OR agent_id = p_agent_id)
        AND importance_score * POWER(1 - decay_rate, 
            EXTRACT(DAY FROM (NOW() - COALESCE(last_accessed_at, created_at))))
            < p_decay_threshold;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$;
