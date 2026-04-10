-- Migration: Fix missing published_at columns
-- Created: 2026-04-10
-- Author: Hermes Agent

-- Fix observations table
ALTER TABLE IF EXISTS observations 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

UPDATE observations 
SET published_at = created_at 
WHERE published_at IS NULL;

-- Fix declarations table  
ALTER TABLE IF EXISTS declarations
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

UPDATE declarations 
SET published_at = created_at 
WHERE published_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN observations.published_at IS 'When the observation was officially published';
COMMENT ON COLUMN declarations.published_at IS 'When the declaration was officially published';
