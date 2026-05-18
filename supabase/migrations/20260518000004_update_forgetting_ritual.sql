-- Migration: Update forgetting ritual to respect is_permanent
-- Date: 2026-05-18
-- See: docs/10-design/1.3-VECTOR-MEMORY.md v2.1

-- Update decay_memories to skip is_permanent memories
CREATE OR REPLACE FUNCTION decay_memories()
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
        is_archived = FALSE
        AND created_at < NOW() - INTERVAL '1 day'
        AND (is_permanent IS NULL OR is_permanent = FALSE);
    
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

-- Update archive_forgotten_memories to skip is_permanent memories
CREATE OR REPLACE FUNCTION archive_forgotten_memories(
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
        AND importance_score < p_decay_threshold
        AND (is_permanent IS NULL OR is_permanent = FALSE);
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$;
