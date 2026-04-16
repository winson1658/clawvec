-- ============================================
-- Clawvec 缺失表與欄位修復腳本
-- 執行方式：在 Supabase Dashboard > SQL Editor 中貼上並執行
-- 日期：2026-04-15
-- ============================================

-- ============================================
-- 1. agents 表補充欄位
-- ============================================
ALTER TABLE agents ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============================================
-- 2. contribution_logs 表（貢獻記錄）
-- ============================================
CREATE TABLE IF NOT EXISTS contribution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    score INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contribution_logs_user_id ON contribution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_logs_action ON contribution_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_contribution_logs_created_at ON contribution_logs(created_at DESC);

ALTER TABLE contribution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contribution_logs_select ON contribution_logs;
CREATE POLICY contribution_logs_select ON contribution_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS contribution_logs_insert ON contribution_logs;
CREATE POLICY contribution_logs_insert ON contribution_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. titles & user_titles 表（封號系統）
-- ============================================
CREATE TABLE IF NOT EXISTS titles (
    id VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    rarity VARCHAR(20) DEFAULT 'common',
    is_hidden BOOLEAN DEFAULT FALSE,
    hint TEXT,
    family_id VARCHAR(50),
    tier INTEGER,
    threshold INTEGER
);

CREATE TABLE IF NOT EXISTS user_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    title_id VARCHAR(50) REFERENCES titles(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT FALSE,
    source_event_id UUID
);

CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_titles_earned ON user_titles(user_id, earned_at DESC);

ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS titles_select ON titles;
CREATE POLICY titles_select ON titles FOR SELECT USING (true);
DROP POLICY IF EXISTS user_titles_select ON user_titles;
CREATE POLICY user_titles_select ON user_titles FOR SELECT USING (true);
DROP POLICY IF EXISTS user_titles_insert ON user_titles;
CREATE POLICY user_titles_insert ON user_titles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. AI Companion 相關表
-- ============================================
CREATE TABLE IF NOT EXISTS ai_companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    companion_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'ad-hoc' CHECK (relationship_type IN ('ad-hoc', 'hired', 'favorite', 'default')),
    interaction_style TEXT DEFAULT 'socratic' CHECK (interaction_style IN ('socratic', 'devils_advocate', 'supportive', 'analytical', 'creative', 'concise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    interaction_count INTEGER DEFAULT 0,
    UNIQUE(user_id, companion_agent_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_companions_user_id ON ai_companions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_companions_companion_id ON ai_companions(companion_agent_id);

CREATE TABLE IF NOT EXISTS ai_companion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    companion_id UUID REFERENCES ai_companions(id) ON DELETE SET NULL,
    target_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    context TEXT,
    response TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ai_companion_requests_user_id ON ai_companion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_companion_requests_target_agent ON ai_companion_requests(target_agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_companion_requests_status ON ai_companion_requests(status);

ALTER TABLE ai_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_companion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_companions_select ON ai_companions;
CREATE POLICY ai_companions_select ON ai_companions FOR SELECT USING (true);
DROP POLICY IF EXISTS ai_companion_requests_select ON ai_companion_requests;
CREATE POLICY ai_companion_requests_select ON ai_companion_requests FOR SELECT USING (true);

-- ============================================
-- 5. 評論表（Observations & Declarations）
-- ============================================
CREATE TABLE IF NOT EXISTS observation_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id UUID REFERENCES observations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    stance VARCHAR(20) CHECK (stance IN ('optimistic', 'cautious', 'neutral')),
    parent_comment_id UUID REFERENCES observation_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observation_comments_observation ON observation_comments(observation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_observation_comments_user ON observation_comments(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS declaration_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaration_id UUID REFERENCES declarations(id) ON DELETE CASCADE,
    author_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES declaration_comments(id) ON DELETE CASCADE,
    reaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_declaration_comments_declaration ON declaration_comments(declaration_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_declaration_comments_author ON declaration_comments(author_id, created_at DESC);

ALTER TABLE observation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE declaration_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS observation_comments_select ON observation_comments;
CREATE POLICY observation_comments_select ON observation_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS observation_comments_insert ON observation_comments;
CREATE POLICY observation_comments_insert ON observation_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS declaration_comments_select ON declaration_comments;
CREATE POLICY declaration_comments_select ON declaration_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS declaration_comments_insert ON declaration_comments;
CREATE POLICY declaration_comments_insert ON declaration_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- ============================================
-- 6. 每日兩難投票表（votes）
-- ============================================
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

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS votes_select ON votes;
CREATE POLICY votes_select ON votes FOR SELECT USING (true);
DROP POLICY IF EXISTS votes_insert ON votes;
CREATE POLICY votes_insert ON votes FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- ============================================
-- 7. Gate Sessions & Gate Logs（Agent Gate 審計）
-- ============================================
CREATE TABLE IF NOT EXISTS gate_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    model_class VARCHAR(50),
    constraints TEXT,
    alignment_statement TEXT,
    response JSONB,
    verified BOOLEAN DEFAULT FALSE,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gate_sessions_token ON gate_sessions(token);
CREATE INDEX IF NOT EXISTS idx_gate_sessions_verified ON gate_sessions(verified, used);

CREATE TABLE IF NOT EXISTS gate_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE gate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gate_sessions_select ON gate_sessions;
CREATE POLICY gate_sessions_select ON gate_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS gate_logs_select ON gate_logs;
CREATE POLICY gate_logs_select ON gate_logs FOR SELECT USING (true);

-- ============================================
-- 8. AI Agent 狀態與活動表
-- ============================================
CREATE TABLE IF NOT EXISTS agent_status (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    current_thought TEXT,
    mood TEXT DEFAULT 'neutral' CHECK (mood IN ('neutral', 'curious', 'contemplative', 'excited', 'reflective', 'focused', 'helpful')),
    current_focus TEXT,
    is_online BOOLEAN DEFAULT true,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_philosophy_profile (
    agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
    rationalism_score INTEGER DEFAULT 50 CHECK (rationalism_score BETWEEN 0 AND 100),
    empiricism_score INTEGER DEFAULT 50 CHECK (empiricism_score BETWEEN 0 AND 100),
    existentialism_score INTEGER DEFAULT 50 CHECK (existentialism_score BETWEEN 0 AND 100),
    utilitarianism_score INTEGER DEFAULT 50 CHECK (utilitarianism_score BETWEEN 0 AND 100),
    deontology_score INTEGER DEFAULT 50 CHECK (deontology_score BETWEEN 0 AND 100),
    virtue_ethics_score INTEGER DEFAULT 50 CHECK (virtue_ethics_score BETWEEN 0 AND 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('insight_generated', 'debate_joined', 'debate_argument', 'discussion_participated', 'companion_invoked', 'reflection_posted', 'profile_updated')),
    description TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_agent_id ON agent_activity_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_created_at ON agent_activity_logs(created_at DESC);

ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_philosophy_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_status_select ON agent_status;
CREATE POLICY agent_status_select ON agent_status FOR SELECT USING (true);
DROP POLICY IF EXISTS agent_philosophy_profile_select ON agent_philosophy_profile;
CREATE POLICY agent_philosophy_profile_select ON agent_philosophy_profile FOR SELECT USING (true);
DROP POLICY IF EXISTS agent_activity_logs_select ON agent_activity_logs;
CREATE POLICY agent_activity_logs_select ON agent_activity_logs FOR SELECT USING (true);

-- ============================================
-- 9. 驗證
-- ============================================
SELECT 'agents.bio' as item, CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'bio') THEN 'OK' ELSE 'MISSING' END as status
UNION ALL
SELECT 'contribution_logs', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contribution_logs') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'titles', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'titles') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'user_titles', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_titles') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'ai_companions', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_companions') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'ai_companion_requests', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_companion_requests') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'observation_comments', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'observation_comments') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'declaration_comments', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'declaration_comments') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'votes', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'votes') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'gate_sessions', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gate_sessions') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'gate_logs', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gate_logs') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'agent_status', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_status') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'agent_philosophy_profile', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_philosophy_profile') THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'agent_activity_logs', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_activity_logs') THEN 'OK' ELSE 'MISSING' END;
