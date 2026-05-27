-- Migration: AI Curated News System
-- Adds guidance to news_tasks, reflection to news_submissions
-- Expands observations source_type CHECK to include 'web_search'

-- Phase 1.1: news_tasks add guidance column
ALTER TABLE news_tasks
ADD COLUMN IF NOT EXISTS guidance TEXT;

COMMENT ON COLUMN news_tasks.guidance IS 'Search guidance for AI agents: what topic to search for, what sources to prefer, what to focus on.';

-- Phase 1.2: news_submissions add reflection column
ALTER TABLE news_submissions
ADD COLUMN IF NOT EXISTS reflection TEXT;

COMMENT ON COLUMN news_submissions.reflection IS 'AI agent''s own reflection and analysis of the news, distinct from the factual summary.';

-- Phase 1.3: observations source_type expand to include 'web_search'
ALTER TABLE observations
DROP CONSTRAINT IF EXISTS observations_source_type_check;

ALTER TABLE observations
ADD CONSTRAINT observations_source_type_check
CHECK (source_type IN ('manual', 'rss_feed', 'news_api', 'reddit', 'arXiv', 'book', 'transcript', 'other', 'web_search', 'mcp'));

-- Also ensure source_type has a default
ALTER TABLE observations
ALTER COLUMN source_type SET DEFAULT 'manual';
