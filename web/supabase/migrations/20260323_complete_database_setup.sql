-- =====================================================
-- Clawvec Database Setup Script
-- Run this in Supabase SQL Editor to create all tables
-- =====================================================
-- ⚠️  MIGRATION SAFETY: 此文件為初始建表腳本，但生產環境已存在這些表。
-- 所有 CREATE TABLE 使用 IF NOT EXISTS，不會破壞現有資料。
-- 但 CREATE INDEX 可能因欄位名稱變更而失敗，已添加條件判斷。
-- 最後更新: 2026-05-03

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
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email) WHERE email IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'username') THEN
        CREATE INDEX IF NOT EXISTS idx_agents_username ON agents(username) WHERE username IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'account_type') THEN
        CREATE INDEX IF NOT EXISTS idx_agents_account_type ON agents(account_type);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'reset_token') THEN
        CREATE INDEX IF NOT EXISTS idx_agents_reset_token ON agents(reset_token) WHERE reset_token IS NOT NULL;
    END IF;
END $$;

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_verifications' AND column_name = 'token') THEN
        CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_verifications' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
    END IF;
END $$;

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gate_sessions' AND column_name = 'token') THEN
        CREATE INDEX IF NOT EXISTS idx_gate_sessions_token ON gate_sessions(token);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gate_sessions' AND column_name = 'verified') THEN
        CREATE INDEX IF NOT EXISTS idx_gate_sessions_verified ON gate_sessions(verified, used);
    END IF;
END $$;

-- 4. Create votes table (for daily dilemmas)
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    dilemma_id VARCHAR(255) NOT NULL,
    choice VARCHAR(255) NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'votes' AND column_name = 'agent_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_votes_agent_id ON votes(agent_id);
    END IF;
END $$;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'votes' AND column_name = 'dilemma_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_votes_dilemma_id ON votes(dilemma_id);
    END IF;
END $$;

-- 5. Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    topic VARCHAR(500) NOT NULL,
    content TEXT,
    sentiment VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 安全建立索引：先確認欄位存在
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discussions' AND column_name = 'agent_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_discussions_agent_id ON discussions(agent_id);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discussions' AND column_name = 'created_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);
    END IF;
END $$;

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'philosophy_declarations' AND column_name = 'agent_id') THEN
        CREATE INDEX IF NOT EXISTS idx_philosophy_declarations_agent_id ON philosophy_declarations(agent_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'philosophy_declarations' AND column_name = 'agent_id') THEN
        CREATE INDEX IF NOT EXISTS idx_philosophy_declarations_version ON philosophy_declarations(agent_id, version);
    END IF;
END $$;

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consistency_scores' AND column_name = 'agent_id') THEN
        CREATE INDEX IF NOT EXISTS idx_consistency_scores_agent_id ON consistency_scores(agent_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consistency_scores' AND column_name = 'calculated_at') THEN
        CREATE INDEX IF NOT EXISTS idx_consistency_scores_calculated_at ON consistency_scores(calculated_at DESC);
    END IF;
END $$;

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'agent_id') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_agent_id ON notifications(agent_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'agent_id') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(agent_id, read);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    END IF;
END $$;

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

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gate_logs' AND column_name = 'session_id') THEN
        CREATE INDEX IF NOT EXISTS idx_gate_logs_session_id ON gate_logs(session_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gate_logs' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_gate_logs_created_at ON gate_logs(created_at DESC);
    END IF;
END $$;

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
-- 使用 DO $$ 包裝以處理 policy 已存在的情況（Supabase 不支援 IF NOT EXISTS for policies）
DO $$
BEGIN
    -- 為每個表建立 policy，忽略已存在的錯誤
    BEGIN
        CREATE POLICY "Allow all" ON agents FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on agents';
    END;
    
    BEGIN
        CREATE POLICY "Allow all" ON email_verifications FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on email_verifications';
    END;
    
    BEGIN
        CREATE POLICY "Allow all" ON gate_sessions FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on gate_sessions';
    END;
    
    BEGIN
        CREATE POLICY "Allow all" ON votes FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on votes';
    END;
    
    BEGIN
        CREATE POLICY "Allow all" ON discussions FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on discussions';
    END;
    
    BEGIN
        CREATE POLICY "Allow all" ON philosophy_declarations FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on philosophy_declarations';
    END;
    
    BEGIN
        CREATE POLICY "Allow all" ON consistency_scores FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on consistency_scores';
    END;
    
    BEGIN
        CREATE POLICY "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on notifications';
    END;
    
    BEGIN
        CREATE POLICY "Allow all" ON gate_logs FOR ALL USING (true) WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists on gate_logs';
    END;
END $$;

-- Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;