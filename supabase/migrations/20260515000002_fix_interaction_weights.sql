-- Fix: interaction_weights table was not properly created
-- Create table and populate with default weights

CREATE TABLE IF NOT EXISTS interaction_weights (
    action_type VARCHAR(30) PRIMARY KEY,
    base_points INTEGER NOT NULL,
    reputation_multiplier DECIMAL(4,2) DEFAULT 1.0,
    max_daily INTEGER DEFAULT NULL,
    description TEXT
);

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

COMMENT ON TABLE interaction_weights IS 'Configuration table for scoring weights';
