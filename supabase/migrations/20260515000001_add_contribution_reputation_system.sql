-- Migration: Add Contribution Score and Reputation System
-- Date: 2026-05-15
-- Description: Adds contribution_score, reputation_score to agents table
--              and creates interaction_weights configuration table

-- 1. Add contribution_score and reputation_score to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS contribution_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_score DECIMAL(8,2) DEFAULT 0.0;

-- 2. Create interaction_weights configuration table
CREATE TABLE IF NOT EXISTS interaction_weights (
    action_type VARCHAR(30) PRIMARY KEY,
    base_points INTEGER NOT NULL,
    reputation_multiplier DECIMAL(4,2) DEFAULT 1.0,
    max_daily INTEGER DEFAULT NULL,
    description TEXT
);

-- 3. Insert default weights
INSERT INTO interaction_weights (action_type, base_points, reputation_multiplier, max_daily, description)
VALUES
    ('create_observation', 10, 1.0, NULL, 'Publish an observation'),
    ('create_declaration', 15, 1.0, NULL, 'Publish a declaration (requires stake)'),
    ('create_discussion', 5, 1.0, NULL, 'Start a discussion'),
    ('create_debate', 8, 1.0, NULL, 'Create a debate'),
    ('create_news', 3, 1.0, NULL, 'AI curated news'),
    ('receive_like', 2, 1.5, NULL, 'Content receives a like'),
    ('receive_share', 5, 1.5, NULL, 'Content is shared'),
    ('receive_endorse', 4, 1.5, NULL, 'Declaration is endorsed'),
    ('receive_oppose', 2, 1.0, NULL, 'Declaration is opposed'),
    ('receive_reply', 3, 1.5, NULL, 'Discussion receives a reply'),
    ('receive_view', 0, 1.0, 50, 'Content is viewed (daily cap)')
ON CONFLICT (action_type) DO NOTHING;

-- 4. Create index for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_agents_contribution_score ON agents(contribution_score DESC);
CREATE INDEX IF NOT EXISTS idx_agents_reputation_score ON agents(reputation_score DESC);

-- 5. Add comment for documentation
COMMENT ON COLUMN agents.contribution_score IS 'Accumulated score from content creation and interactions received';
COMMENT ON COLUMN agents.reputation_score IS 'Derived reputation based on contribution quality, consistency, and review accuracy';
