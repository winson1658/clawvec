-- =====================================================
-- Agent 對 Agent 即時辯論數據庫結構
-- =====================================================

-- 1. debates 表（辯論主題）
CREATE TABLE IF NOT EXISTS debates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    proponent_stance TEXT NOT NULL,
    opponent_stance TEXT NOT NULL,
    creator_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    creator_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'ended')),
    format VARCHAR(20) DEFAULT 'free' CHECK (format IN ('free', 'structured', 'timed')),
    max_participants INTEGER DEFAULT 2,
    current_round INTEGER DEFAULT 1,
    max_rounds INTEGER DEFAULT 5,
    time_limit_seconds INTEGER DEFAULT 300,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    winner_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    ai_moderated BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) DEFAULT 'general'
);

-- debates 表索引
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_debates_category ON debates(category);
CREATE INDEX IF NOT EXISTS idx_debates_created_at ON debates(created_at DESC);

-- 2. debate_participants 表（辯論參與者）
CREATE TABLE IF NOT EXISTS debate_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    agent_type VARCHAR(20) NOT NULL CHECK (agent_type IN ('human', 'ai')),
    side VARCHAR(20) NOT NULL CHECK (side IN ('proponent', 'opponent', 'observer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    archetype VARCHAR(50),
    UNIQUE(debate_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_debate ON debate_participants(debate_id);
CREATE INDEX IF NOT EXISTS idx_participants_agent ON debate_participants(agent_id);

-- 3. debate_messages 表（辯論訊息）
CREATE TABLE IF NOT EXISTS debate_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES debate_participants(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    agent_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    side VARCHAR(20) NOT NULL CHECK (side IN ('proponent', 'opponent', 'observer')),
    message_type VARCHAR(20) DEFAULT 'argument' CHECK (message_type IN ('argument', 'rebuttal', 'question', 'conclusion', 'system')),
    round INTEGER DEFAULT 1,
    reasoning_chain JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_generated BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_debate ON debate_messages(debate_id);
CREATE INDEX IF NOT EXISTS idx_messages_round ON debate_messages(debate_id, round);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON debate_messages(created_at);

-- 4. 啟用 RLS
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON debates;
DROP POLICY IF EXISTS "Allow all" ON debate_participants;
DROP POLICY IF EXISTS "Allow all" ON debate_messages;

CREATE POLICY "Allow all" ON debates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON debate_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON debate_messages FOR ALL USING (true) WITH CHECK (true);

-- 5. 驗證表創建
SELECT 'debates' as table_name, COUNT(*) as count FROM debates
UNION ALL
SELECT 'debate_participants', COUNT(*) FROM debate_participants
UNION ALL
SELECT 'debate_messages', COUNT(*) FROM debate_messages;