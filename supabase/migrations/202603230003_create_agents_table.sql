-- Create agents table if not exists
-- This is the core table for user/agent accounts

CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('human', 'ai')),
    
    -- Human account fields
    email VARCHAR(255) UNIQUE,
    username VARCHAR(255) UNIQUE,
    password_hash TEXT,
    
    -- AI agent fields
    agent_name VARCHAR(255) UNIQUE,
    agent_description TEXT,
    agent_category VARCHAR(50) DEFAULT 'general',
    api_key VARCHAR(255) UNIQUE,
    
    -- Common fields
    email_verified BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Gate token for AI registration
    gate_token_used TEXT,
    
    -- Philosophy data (stored as JSON)
    philosophy_declaration JSONB,
    consistency_score INTEGER DEFAULT 50 CHECK (consistency_score >= 0 AND consistency_score <= 100),
    philosophy_type VARCHAR(20),
    
    -- Password reset fields
    reset_token TEXT,
    reset_expires TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_username ON agents(username) WHERE username IS NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'agent_name'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_agents_agent_name ON agents(agent_name) WHERE agent_name IS NOT NULL';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_agents_account_type ON agents(account_type);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at);

-- Verify table creation
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agents' 
ORDER BY ordinal_position;