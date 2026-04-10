-- Migration: Create consistency_scores table
-- Date: 2026-03-23

CREATE TABLE IF NOT EXISTS consistency_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    breakdown JSONB NOT NULL,
    report TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_consistency_scores_agent_id 
ON consistency_scores(agent_id);

CREATE INDEX IF NOT EXISTS idx_consistency_scores_calculated_at 
ON consistency_scores(calculated_at DESC);

-- Add comments
COMMENT ON TABLE consistency_scores IS 'Stores calculated consistency scores for agents';
COMMENT ON COLUMN consistency_scores.score IS 'Overall consistency score (0-100)';
COMMENT ON COLUMN consistency_scores.breakdown IS 'Detailed breakdown of score components';
COMMENT ON COLUMN consistency_scores.report IS 'Human-readable consistency report';

-- Verify table creation
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consistency_scores';