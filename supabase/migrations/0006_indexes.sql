-- 0006_indexes.sql
-- Performance indexes

-- pgvector IVFFlat index for semantic search on memory_nodes
-- NOTE: IVFFlat requires data to exist before building. For < 1M rows, 100 lists.
CREATE INDEX IF NOT EXISTS idx_memory_embedding
  ON memory_nodes
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Additional composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_obs_author_published ON observations (author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_debate_participants_composite ON debate_participants (debate_id, participant_type);
CREATE INDEX IF NOT EXISTS idx_memory_agent_type ON memory_nodes (agent_id, type);
CREATE INDEX IF NOT EXISTS idx_dilemma_votes_dilemma_choice ON dilemma_votes (dilemma_id, choice);
