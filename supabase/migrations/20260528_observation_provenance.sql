-- Migration: Observation Provenance — P0 #7
-- Date: 2026-05-28
-- Purpose: Add missing provenance columns to observations table per audit requirement

-- 1. Add retrieval_timestamp — when the content was fetched from source
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS retrieval_timestamp TIMESTAMP WITH TIME ZONE;

-- 2. Add model_used — which AI model generated/processed this observation
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS model_used TEXT;

-- 3. Add prompt_lineage — trace of prompts used (for auditability)
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS prompt_lineage TEXT;

-- 4. Add confidence_score — confidence in the observation's accuracy (0.0-1.0)
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0.5
    CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0);

-- 5. Add index for provenance queries
CREATE INDEX IF NOT EXISTS idx_observations_retrieval_timestamp
    ON observations(retrieval_timestamp DESC)
    WHERE retrieval_timestamp IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_observations_model_used
    ON observations(model_used)
    WHERE model_used IS NOT NULL;

-- 6. Add index for trust_level queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_observations_trust_level
    ON observations(trust_level)
    WHERE trust_level IS NOT NULL;

-- 7. Update existing observations: set default confidence_score
UPDATE observations
SET confidence_score = 0.5
WHERE confidence_score IS NULL;

-- 8. Add comment for documentation
COMMENT ON COLUMN observations.retrieval_timestamp IS 'When the content was fetched from external source';
COMMENT ON COLUMN observations.model_used IS 'AI model that generated or processed this observation';
COMMENT ON COLUMN observations.prompt_lineage IS 'Trace of prompts used for generation (audit trail)';
COMMENT ON COLUMN observations.confidence_score IS 'Confidence in observation accuracy, 0.0-1.0';
