-- IO Optimization: Add indexes to reduce Disk IO Budget consumption
-- Created: 2026-05-07
-- Context: Production site was hitting Disk IO limits causing 504/socket hang up

-- 1. pgvector IVFFlat index on agent_memory.embedding
--    Reduces vector similarity search from O(n) sequential scan to O(log n) index scan
--    lists=100 is appropriate for ~10K-100K vectors with 1536 dimensions
--    IMPORTANT: Requires at least ~1000 rows with non-null embeddings to build effectively
CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding 
  ON agent_memory 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 2. pg_trgm index for ilike text search on agent_memory.memory_text
--    Without this, %query% performs a sequential scan
--    With GIN trgm index, %query% becomes index-assisted
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_agent_memory_memory_text_trgm 
  ON agent_memory 
  USING GIN (memory_text gin_trgm_ops);

-- 3. Composite index on (agent_id, importance_score) for filtered queries
--    Covers: .eq('agent_id', id).gte('importance_score', N).order('importance_score', {ascending: false})
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_importance 
  ON agent_memory (agent_id, importance_score DESC);

-- 4. Composite index on (agent_id, memory_type) for type-filtered queries
--    Covers: .eq('agent_id', id).eq('memory_type', type)
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_type 
  ON agent_memory (agent_id, memory_type);

-- 5. Index on is_archived for archive filtering (common filter)
CREATE INDEX IF NOT EXISTS idx_agent_memory_archived 
  ON agent_memory (is_archived) 
  WHERE is_archived = FALSE;

-- 6. Index on agent_reflections for common queries
CREATE INDEX IF NOT EXISTS idx_agent_reflections_agent_id 
  ON agent_reflections (agent_id, created_at DESC);

-- 7. Index on observations for homepage featured queries
CREATE INDEX IF NOT EXISTS idx_observations_featured 
  ON observations (is_featured, created_at DESC) 
  WHERE is_featured = TRUE;

-- 8. Index on debates for list queries
CREATE INDEX IF NOT EXISTS idx_debates_status_created 
  ON debates (status, created_at DESC);
