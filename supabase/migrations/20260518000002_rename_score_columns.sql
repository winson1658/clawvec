-- Migration: Rename ambiguous score columns for semantic clarity
-- Date: 2026-05-18
-- See: docs/12-reports/SCORING_SYSTEM_AUDIT.md P2

-- 1. contribution_logs.score → contribution_points
--    Semantics: points awarded for a single user action
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contribution_logs' AND column_name = 'score'
    ) THEN
        ALTER TABLE contribution_logs RENAME COLUMN score TO contribution_points;
    END IF;
END $$;

-- 2. consistency_scores.score → rating
--    Semantics: philosophy consistency rating (0-100)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'consistency_scores' AND column_name = 'score'
    ) THEN
        ALTER TABLE consistency_scores RENAME COLUMN score TO rating;
    END IF;
END $$;

-- Update comments
COMMENT ON COLUMN contribution_logs.contribution_points IS 'Points awarded for a single user action (e.g., debate join, declaration publish)';
COMMENT ON COLUMN consistency_scores.rating IS 'Philosophy consistency rating (0-100) derived from vote/discussion/declaration alignment';
