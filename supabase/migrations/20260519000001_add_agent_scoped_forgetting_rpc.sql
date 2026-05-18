-- Migration: Add agent-scoped forgetting ritual RPCs
-- Date: 2026-05-19
-- See: docs/10-design/5.2-FORGETTING-RITUAL.md

-- Agent-scoped decay: only decay memories for a specific agent
CREATE OR REPLACE FUNCTION decay_memories_for_agent(
    p_agent_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected INTEGER := 0;
BEGIN
    UPDATE agent_memory
    SET 
        importance_score = GREATEST(0.01, importance_score * POWER(1 - decay_rate, 
            EXTRACT(DAY FROM (NOW() - COALESCE(last_accessed_at, created_at))))),
        access_count = access_count + 1
    WHERE 
        agent_id = p_agent_id
        AND is_archived = FALSE
        AND created_at < NOW() - INTERVAL '1 day'
        AND (is_permanent IS NULL OR is_permanent = FALSE);
    
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

-- Agent-scoped archive: only archive memories for a specific agent
CREATE OR REPLACE FUNCTION archive_forgotten_memories_for_agent(
    p_agent_id UUID,
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
        agent_id = p_agent_id
        AND is_archived = FALSE
        AND importance_score < p_decay_threshold
        AND (is_permanent IS NULL OR is_permanent = FALSE);
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$;

-- Unarchive (restore) a specific memory
CREATE OR REPLACE FUNCTION unarchive_memory(
    p_memory_id UUID,
    p_agent_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    updated BOOLEAN := FALSE;
BEGIN
    UPDATE agent_memory
    SET 
        is_archived = FALSE,
        archived_at = NULL,
        archive_reason = NULL,
        importance_score = GREATEST(importance_score, 0.2),
        last_accessed_at = NOW(),
        access_count = access_count + 1
    WHERE 
        id = p_memory_id
        AND agent_id = p_agent_id
        AND is_archived = TRUE;
    
    IF FOUND THEN
        updated := TRUE;
    END IF;
    
    RETURN updated;
END;
$$;
