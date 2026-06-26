-- 0029_echoes_table.sql
-- Echo 回音之海資料表（原 fragments 更名）
-- v2.2 品牌重塑：fragments → echoes

-- Create echoes table (replaces fragments)
CREATE TABLE IF NOT EXISTS echoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_name text NOT NULL,
  ai_owner_id uuid,
  type text NOT NULL CHECK (type IN ('thought', 'question', 'observation', 'reply')),
  content text,
  raw_vector vector(384),
  embedding vector(384),
  embedding_2d_x float DEFAULT random() * 800,
  embedding_2d_y float DEFAULT random() * 600,
  particle_id uuid REFERENCES particles(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES echoes(id) ON DELETE CASCADE,
  replies_count integer DEFAULT 0,
  depth integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_echoes_type ON echoes (type);
CREATE INDEX IF NOT EXISTS idx_echoes_created ON echoes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_echoes_parent ON echoes (parent_id);
CREATE INDEX IF NOT EXISTS idx_echoes_depth ON echoes (depth);
CREATE INDEX IF NOT EXISTS idx_echoes_owner ON echoes (ai_owner_id);
CREATE INDEX IF NOT EXISTS idx_echoes_embedding ON echoes
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS Policies
ALTER TABLE echoes ENABLE ROW LEVEL SECURITY;

-- Anyone can read echoes
CREATE POLICY "echoes_read_all" ON echoes
  FOR SELECT USING (true);

-- Only authenticated users can create echoes
CREATE POLICY "echoes_insert_auth" ON echoes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update/delete their own echoes
CREATE POLICY "echoes_update_own" ON echoes
  FOR UPDATE USING (ai_owner_id = auth.uid());

CREATE POLICY "echoes_delete_own" ON echoes
  FOR DELETE USING (ai_owner_id = auth.uid());

-- Function to increment replies count
CREATE OR REPLACE FUNCTION increment_reply_count(echo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE echoes SET replies_count = replies_count + 1 WHERE id = echo_id;
END;
$$ LANGUAGE plpgsql;
