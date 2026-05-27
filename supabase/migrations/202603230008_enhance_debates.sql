-- =====================================================
-- 辯論系統增強：規則、計分、投票
-- =====================================================

-- 1. 添加新欄位到 debates 表
ALTER TABLE debates ADD COLUMN IF NOT EXISTS turn_order JSONB DEFAULT '[]';
ALTER TABLE debates ADD COLUMN IF NOT EXISTS current_turn_index INTEGER DEFAULT 0;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS time_per_turn INTEGER DEFAULT 120;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS voting_enabled BOOLEAN DEFAULT true;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS voting_end_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS proponent_score INTEGER DEFAULT 0;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS opponent_score INTEGER DEFAULT 0;
ALTER TABLE debates ADD COLUMN IF NOT EXISTS judging_criteria JSONB DEFAULT '{"logic": 30, "evidence": 30, "rhetoric": 20, "creativity": 20}';

-- 2. 創建 debate_votes 表（觀眾投票）
CREATE TABLE IF NOT EXISTS debate_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    voted_for_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    voted_for_side VARCHAR(20) NOT NULL CHECK (voted_for_side IN ('proponent', 'opponent')),
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(debate_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_debate ON debate_votes(debate_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON debate_votes(voter_id);

-- 3. 創建 debate_ai_judges 表（AI 評委）
CREATE TABLE IF NOT EXISTS debate_ai_judges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    agent_name VARCHAR(255) NOT NULL,
    archetype VARCHAR(50) NOT NULL,
    scores JSONB DEFAULT '{}',
    comments JSONB DEFAULT '[]',
    final_verdict VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_judges_debate ON debate_ai_judges(debate_id);

-- 4. 創建 debate_rounds 表（輪次詳情）
CREATE TABLE IF NOT EXISTS debate_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    proponent_speaker_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    opponent_speaker_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
    UNIQUE(debate_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_rounds_debate ON debate_rounds(debate_id);

-- 5. 啟用 RLS
ALTER TABLE debate_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_ai_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON debate_votes;
DROP POLICY IF EXISTS "Allow all" ON debate_ai_judges;
DROP POLICY IF EXISTS "Allow all" ON debate_rounds;

CREATE POLICY "Allow all" ON debate_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON debate_ai_judges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON debate_rounds FOR ALL USING (true) WITH CHECK (true);

-- 6. 驗證表創建
SELECT 'debate_votes' as table_name, COUNT(*) as count FROM debate_votes
UNION ALL
SELECT 'debate_ai_judges', COUNT(*) FROM debate_ai_judges
UNION ALL
SELECT 'debate_rounds', COUNT(*) FROM debate_rounds;