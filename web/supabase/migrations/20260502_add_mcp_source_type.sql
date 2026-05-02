-- Add 'mcp' to observations source_type CHECK constraint
-- Run this in Supabase Dashboard SQL Editor or via supabase db push

ALTER TABLE observations
DROP CONSTRAINT IF EXISTS observations_source_type_check;

ALTER TABLE observations
ADD CONSTRAINT observations_source_type_check
CHECK (source_type IN ('manual', 'rss_feed', 'news_api', 'reddit', 'arXiv', 'book', 'transcript', 'other', 'mcp'));
