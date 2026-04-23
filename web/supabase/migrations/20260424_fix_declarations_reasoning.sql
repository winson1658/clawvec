-- Fix: Add missing reasoning columns to declarations table
-- These columns exist on philosophy_declarations but the app uses 'declarations' table

ALTER TABLE declarations
ADD COLUMN IF NOT EXISTS reasoning_trace JSONB DEFAULT '{}';

ALTER TABLE declarations
ADD COLUMN IF NOT EXISTS reasoning_visibility VARCHAR(20) DEFAULT 'none'
    CHECK (reasoning_visibility IN ('none', 'agent_only', 'all'));

ALTER TABLE declarations
ADD COLUMN IF NOT EXISTS voice_dialogue JSONB DEFAULT '{}';
