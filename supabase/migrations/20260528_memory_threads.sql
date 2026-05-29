-- Migration: Memory Threads — P1 #12
-- Date: 2026-05-28
-- Purpose: Create memory_threads table and link to content_semantics per audit requirement

-- 1. Create memory_threads table
CREATE TABLE IF NOT EXISTS memory_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Thread identity
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Thread classification
    thread_type VARCHAR(50) NOT NULL DEFAULT 'observation'
        CHECK (thread_type IN ('observation', 'discussion', 'debate', 'declaration', 'belief_evolution', 'identity_drift', 'custom')),
    
    -- Ownership
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    
    -- Thread status
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'archived', 'merged', 'forked')),
    
    -- Fork/merge lineage
    parent_thread_id UUID REFERENCES memory_threads(id) ON DELETE SET NULL,
    fork_generation INTEGER DEFAULT 0,
    
    -- Semantic summary
    belief_vector JSONB DEFAULT '{}',
    domain_tags TEXT[] DEFAULT '{}',
    
    -- Content count (denormalized for performance)
    content_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_content_at TIMESTAMP WITH TIME ZONE
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_memory_threads_agent
    ON memory_threads(agent_id, status);

CREATE INDEX IF NOT EXISTS idx_memory_threads_type
    ON memory_threads(thread_type, status);

CREATE INDEX IF NOT EXISTS idx_memory_threads_parent
    ON memory_threads(parent_thread_id)
    WHERE parent_thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memory_threads_tags
    ON memory_threads USING gin(domain_tags);

-- 3. Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_memory_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_memory_threads_updated_at ON memory_threads;
CREATE TRIGGER trg_memory_threads_updated_at
    BEFORE UPDATE ON memory_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_memory_threads_updated_at();

-- 4. RLS policies
ALTER TABLE memory_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read" ON memory_threads
    FOR SELECT USING (true);

CREATE POLICY "Allow all insert" ON memory_threads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update" ON memory_threads
    FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Function to update content_count
CREATE OR REPLACE FUNCTION update_thread_content_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.memory_thread_id IS NOT NULL THEN
        UPDATE memory_threads 
        SET content_count = content_count + 1,
            last_content_at = NOW()
        WHERE id = NEW.memory_thread_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.memory_thread_id IS DISTINCT FROM NEW.memory_thread_id THEN
        -- Decrement old thread
        IF OLD.memory_thread_id IS NOT NULL THEN
            UPDATE memory_threads 
            SET content_count = GREATEST(0, content_count - 1)
            WHERE id = OLD.memory_thread_id;
        END IF;
        -- Increment new thread
        IF NEW.memory_thread_id IS NOT NULL THEN
            UPDATE memory_threads 
            SET content_count = content_count + 1,
                last_content_at = NOW()
            WHERE id = NEW.memory_thread_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.memory_thread_id IS NOT NULL THEN
        UPDATE memory_threads 
        SET content_count = GREATEST(0, content_count - 1)
        WHERE id = OLD.memory_thread_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger on content_semantics to auto-update content_count
DROP TRIGGER IF EXISTS trg_content_semantics_thread_count ON content_semantics;
CREATE TRIGGER trg_content_semantics_thread_count
    AFTER INSERT OR UPDATE OR DELETE ON content_semantics
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_content_count();

-- 7. Verify
COMMENT ON TABLE memory_threads IS 'Memory thread continuity for content_semantics.memory_thread_id';
COMMENT ON COLUMN memory_threads.thread_type IS 'Classification: observation, discussion, debate, declaration, belief_evolution, identity_drift, custom';
COMMENT ON COLUMN memory_threads.status IS 'active, archived, merged, forked';
COMMENT ON COLUMN memory_threads.parent_thread_id IS 'For forked threads, points to parent thread';
COMMENT ON COLUMN memory_threads.fork_generation IS 'Depth in fork tree (0 = root)';
COMMENT ON COLUMN memory_threads.content_count IS 'Denormalized count of content_semantics linked to this thread';
