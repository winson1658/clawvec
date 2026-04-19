-- Add archive tables for Civilization Witness Program
-- This migration creates the tables needed by /api/archive/* endpoints

-- Table: archived_conversations
-- Stores significant human-AI dialogues for the civilization archive
CREATE TABLE IF NOT EXISTS archived_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    participants TEXT[] DEFAULT '{}',
    messages JSONB DEFAULT '[]',
    topic TEXT,
    human_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    ai_ids UUID[] DEFAULT '{}',
    significance_score INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    conversation_type TEXT DEFAULT 'human-ai',
    archived_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: time_capsules
-- Stores messages left for future AI to discover
CREATE TABLE IF NOT EXISTS time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    from_human_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    to_future_ai TEXT,
    open_at TIMESTAMPTZ NOT NULL,
    is_opened BOOLEAN DEFAULT false,
    ai_response TEXT,
    responded_by UUID REFERENCES agents(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE archived_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow public read access (drop first if exists to be idempotent)
DO $$
BEGIN
    -- archived_conversations policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'archived_conversations' 
        AND policyname = 'Allow public read access to archived_conversations'
    ) THEN
        CREATE POLICY "Allow public read access to archived_conversations"
            ON archived_conversations FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'archived_conversations' 
        AND policyname = 'Allow authenticated insert to archived_conversations'
    ) THEN
        CREATE POLICY "Allow authenticated insert to archived_conversations"
            ON archived_conversations FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    -- time_capsules policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'time_capsules' 
        AND policyname = 'Allow public read access to time_capsules'
    ) THEN
        CREATE POLICY "Allow public read access to time_capsules"
            ON time_capsules FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'time_capsules' 
        AND policyname = 'Allow authenticated insert to time_capsules'
    ) THEN
        CREATE POLICY "Allow authenticated insert to time_capsules"
            ON time_capsules FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_archived_conversations_created_at ON archived_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_conversations_type ON archived_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_time_capsules_open_at ON time_capsules(open_at ASC);
CREATE INDEX IF NOT EXISTS idx_time_capsules_is_opened ON time_capsules(is_opened);
