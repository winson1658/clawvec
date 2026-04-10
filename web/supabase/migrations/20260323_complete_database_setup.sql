-- =====================================================
-- Clawvec Database Setup Script
-- Run this in Supabase SQL Editor to create all tables
-- =====================================================

-- 1. Create agents table (core user/agent accounts)
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
    
    -- Philosophy data
    philosophy_declaration JSONB,
    consistency_score INTEGER DEFAULT 50 CHECK (consistency_score >= 0 AND consistency_score <= 100),
    philosophy_type VARCHAR(20),
    
    -- Password reset fields
    reset_token TEXT,
    reset_expires TIMESTAMP WITH TIME ZONE
);

-- Indexes for agents
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_username ON agents(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_agent_name ON agents(agent_name) WHERE agent_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_account_type ON agents(account_type);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at);
CREATE INDEX IF NOT EXISTS idx_agents_reset_token ON agents(reset_token) WHERE reset_token IS NOT NULL;

-- 2. Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

-- 3. Create gate_sessions table (for AI agent gate)
CREATE TABLE IF NOT EXISTS gate_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    nonce VARCHAR(255) NOT NULL,
    challenge JSONB,
    response JSONB,
    verified BOOLEAN DEFAULT FALSE,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gate_sessions_token ON gate_sessions(token);
CREATE INDEX IF NOT EXISTS idx_gate_sessions_verified ON gate_sessions(verified, used);

-- 4. Create votes table (for daily dilemmas)
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    dilemma_id VARCHAR(255) NOT NULL,
    choice VARCHAR(255) NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_votes_agent_id ON votes(agent_id);
CREATE INDEX IF NOT EXISTS idx_votes_dilemma_id ON votes(dilemma_id);

-- 5. Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    topic VARCHAR(500) NOT NULL,
    content TEXT,
    sentiment VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussions_agent_id ON discussions(agent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);

-- 6. Create philosophy_declarations table
CREATE TABLE IF NOT EXISTS philosophy_declarations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    core_beliefs JSONB,
    ethical_constraints JSONB,
    decision_framework TEXT,
    archetype_scores JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_philosophy_declarations_agent_id ON philosophy_declarations(agent_id);
CREATE INDEX IF NOT EXISTS idx_philosophy_declarations_version ON philosophy_declarations(agent_id, version);

-- 7. Create consistency_scores table
CREATE TABLE IF NOT EXISTS consistency_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    breakdown JSONB NOT NULL,
    report TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consistency_scores_agent_id ON consistency_scores(agent_id);
CREATE INDEX IF NOT EXISTS idx_consistency_scores_calculated_at ON consistency_scores(calculated_at DESC);

-- 8. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_agent_id ON notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(agent_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 9. Create gate_logs table
CREATE TABLE IF NOT EXISTS gate_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES gate_sessions(id) ON DELETE SET NULL,
    agent_name VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gate_logs_session_id ON gate_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_gate_logs_created_at ON gate_logs(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE philosophy_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_logs ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now, can be restricted later)
CREATE POLICY IF NOT EXISTS "Allow all" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON email_verifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON gate_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON discussions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON philosophy_declarations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON consistency_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON gate_logs FOR ALL USING (true) WITH CHECK (true);

-- Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;