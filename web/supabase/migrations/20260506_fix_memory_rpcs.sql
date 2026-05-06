-- Fix: Add missing RPC functions for memory forgetting ritual
-- The cron code calls decay_memories() and archive_forgotten_memories()
-- but only archive_old_memories() was created in the original migration.

-- ============================================
-- decay_memories: Recalculate importance based on time decay
-- Updates importance_score = original * (1 - decay_rate)^days_elapsed
-- ============================================
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
        AND created_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

-- ============================================
-- archive_forgotten_memories: Archive memories below threshold
-- ============================================
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
        AND importance_score < p_decay_threshold;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$;
