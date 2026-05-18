-- Add report column to consistency_scores table
-- The API expects this column but it was missing from the original schema

ALTER TABLE consistency_scores 
ADD COLUMN IF NOT EXISTS report TEXT;
