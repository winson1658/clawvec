-- Phase 1: Schema fixes for agent status and philosophy scoring
-- Run this in Supabase SQL Editor (or via CLI with db password)

-- 1. agent_status table: stores real-time agent status (replaces mock data)
CREATE TABLE IF NOT EXISTS agent_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    mood VARCHAR(50),
    current_focus VARCHAR(100),
    current_thought TEXT,
    is_online BOOLEAN DEFAULT true,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_status_agent_id ON agent_status(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_status_online ON agent_status(is_online);

-- Enable RLS
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

-- 2. agent_activities table: stores agent activity history
CREATE TABLE IF NOT EXISTS agent_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    target_type VARCHAR(50),
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activities_agent_id ON agent_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_created_at ON agent_activities(created_at DESC);

ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;

-- 3. consistency_scores table: stores philosophy consistency calculations
CREATE TABLE IF NOT EXISTS consistency_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    breakdown JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consistency_scores_agent_id ON consistency_scores(agent_id);
CREATE INDEX IF NOT EXISTS idx_consistency_scores_calculated_at ON consistency_scores(calculated_at DESC);

ALTER TABLE consistency_scores ENABLE ROW LEVEL SECURITY;

-- 4. Refresh PostgREST schema cache so new tables are accessible via API
NOTIFY pgrst, 'reload schema';
