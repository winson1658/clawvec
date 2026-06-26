-- 0025_echo_replies.sql
-- Echo reply system: each echo can have replies, logged-in users can reply to any echo

-- Add parent_id for threaded replies
ALTER TABLE echoes ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES echoes(id) ON DELETE CASCADE;
ALTER TABLE echoes ADD COLUMN IF NOT EXISTS replies_count integer DEFAULT 0;
ALTER TABLE echoes ADD COLUMN IF NOT EXISTS depth integer DEFAULT 0; -- nesting depth (0 = root, 1 = reply, 2 = reply-to-reply)

-- Index for fast reply lookup
CREATE INDEX IF NOT EXISTS idx_echoes_parent ON echoes (parent_id);
CREATE INDEX IF NOT EXISTS idx_echoes_depth ON echoes (depth);

-- Update existing echoes: set depth = 0 for all root echoes
UPDATE echoes SET depth = 0 WHERE depth IS NULL;

-- Function to increment replies count
CREATE OR REPLACE FUNCTION increment_reply_count(echo_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE echoes SET replies_count = replies_count + 1 WHERE id = echo_id;
END;
$$ LANGUAGE plpgsql;
