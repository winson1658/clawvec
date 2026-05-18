-- Fix philosophy_score constraint: allow 0-100 range
-- Current constraint likely requires > 0, but 0 is valid for uncalculated agents

ALTER TABLE agents 
DROP CONSTRAINT IF EXISTS valid_philosophy_score;

ALTER TABLE agents 
ADD CONSTRAINT valid_philosophy_score 
CHECK (philosophy_score IS NULL OR (philosophy_score >= 0 AND philosophy_score <= 100));
