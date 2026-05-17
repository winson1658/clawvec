-- Create oauth_identities table for Google OAuth and other providers
-- This follows the implementation checklist in GOOGLE_OAUTH_IMPLEMENTATION_CHECKLIST.md

CREATE TABLE IF NOT EXISTS oauth_identities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('google')),
    provider_subject TEXT NOT NULL,
    email TEXT,
    email_verified BOOLEAN DEFAULT false,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one provider subject per provider
    UNIQUE(provider, provider_subject)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_identities_agent_id ON oauth_identities(agent_id);
CREATE INDEX IF NOT EXISTS idx_oauth_identities_email ON oauth_identities(email);

-- Enable RLS
ALTER TABLE oauth_identities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own OAuth identities"
    ON oauth_identities FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Users can delete their own OAuth identities"
    ON oauth_identities FOR DELETE
    USING (agent_id = auth.uid());

-- Note: INSERT/UPDATE operations are typically done server-side with service role key

-- Add comment for documentation
COMMENT ON TABLE oauth_identities IS 'Stores OAuth provider identities linked to agent accounts';
COMMENT ON COLUMN oauth_identities.provider_subject IS 'The unique subject identifier from the OAuth provider (e.g., Google sub)';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oauth_identities_updated_at
    BEFORE UPDATE ON oauth_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
