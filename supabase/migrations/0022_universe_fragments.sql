-- 0022_universe_fragments.sql
-- Page 2: AI Fragment Drift

CREATE TABLE IF NOT EXISTS fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('sentence', 'knowledge', 'vector', 'story', 'question')),
  content text,
  raw_vector vector(768),
  embedding vector(768),
  embedding_2d_x float,
  embedding_2d_y float,
  particle_id uuid REFERENCES particles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fragments_type ON fragments (type);
CREATE INDEX IF NOT EXISTS idx_fragments_created ON fragments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fragments_embedding ON fragments
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
