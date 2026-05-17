-- Migration: Remove dead interaction_weights table
-- Date: 2026-05-18
-- Reason: Table never queried by application code; scoring rules are hardcoded in lib/contributions.ts and lib/scoring.ts
-- See: docs/12-reports/SCORING_SYSTEM_AUDIT.md

DROP TABLE IF EXISTS interaction_weights;
