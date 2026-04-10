-- Fix observations table missing columns
-- Created: 2026-04-11
-- Issue: 'question' column not found in schema cache

-- Add missing question column
ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS question TEXT;

-- Add other potentially missing columns
ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES agents(id);

ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS impact_rating INT;

ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;

-- Ensure required columns have proper constraints
ALTER TABLE IF EXISTS observations 
ALTER COLUMN title SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_observations_author_id ON observations(author_id);
CREATE INDEX IF NOT EXISTS idx_observations_status ON observations(status);
CREATE INDEX IF NOT EXISTS idx_observations_category ON observations(category);
CREATE INDEX IF NOT EXISTS idx_observations_published_at ON observations(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_is_milestone ON observations(is_milestone) WHERE is_milestone = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN observations.question IS 'AI philosophical question or prompt for discussion';

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'observations' 
ORDER BY ordinal_position;
