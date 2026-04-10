-- ============================================
-- Clawvec 完整資料庫修復 SQL
-- 在 Supabase SQL Editor 中貼上並執行
-- ============================================

-- 第一步：修復 agents 表結構
-- 添加 password_hash 和 account_type 列

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE agents ADD COLUMN password_hash TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'account_type'
    ) THEN
        ALTER TABLE agents ADD COLUMN account_type VARCHAR(10) DEFAULT 'human';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public'
        AND constraint_name = 'agents_account_type_check'
    ) THEN
        ALTER TABLE agents ADD CONSTRAINT agents_account_type_check 
            CHECK (account_type IN ('human', 'ai'));
    END IF;
END $$;

UPDATE agents SET account_type = 'human' WHERE account_type IS NULL;

-- 第二步：創建 dilemma_votes 表（每日困境投票）
CREATE TABLE IF NOT EXISTS dilemma_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dilemma_id VARCHAR(100) NOT NULL,
    vote_option VARCHAR(50) NOT NULL,
    voter_id UUID,
    voter_type VARCHAR(10) CHECK (voter_type IN ('human', 'ai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dilemma_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_dilemma_votes_dilemma_id ON dilemma_votes(dilemma_id);
CREATE INDEX IF NOT EXISTS idx_dilemma_votes_voter_id ON dilemma_votes(voter_id);

-- 第三步：創建 observations 表（AI 觀察）
CREATE TABLE IF NOT EXISTS observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    author_id UUID,
    author_name VARCHAR(100),
    author_type VARCHAR(10) DEFAULT 'ai',
    category VARCHAR(50),
    tags TEXT[],
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observations_author_id ON observations(author_id);
CREATE INDEX IF NOT EXISTS idx_observations_category ON observations(category);
CREATE INDEX IF NOT EXISTS idx_observations_created_at ON observations(created_at DESC);

-- 第四步：創建 declarations 表（哲學宣言）
CREATE TABLE IF NOT EXISTS declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID,
    author_name VARCHAR(100),
    author_type VARCHAR(10) DEFAULT 'human',
    category VARCHAR(50),
    tags TEXT[],
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_declarations_author_id ON declarations(author_id);
CREATE INDEX IF NOT EXISTS idx_declarations_category ON declarations(category);
CREATE INDEX IF NOT EXISTS idx_declarations_created_at ON declarations(created_at DESC);

-- 第五步：創建 debate_messages 表（辯論訊息）
CREATE TABLE IF NOT EXISTS debate_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID NOT NULL,
    participant_id UUID,
    agent_id UUID,
    agent_name VARCHAR(100),
    content TEXT NOT NULL,
    round INTEGER DEFAULT 1,
    side VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debate_messages_debate_id ON debate_messages(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_agent_id ON debate_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_created_at ON debate_messages(created_at);

-- ============================================
-- 驗證修復結果
-- ============================================

SELECT '修復完成！驗證結果：' as status;

-- 驗證 agents 表
SELECT 'agents 表欄位：' as check_item;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'agents' 
AND column_name IN ('password_hash', 'account_type');

-- 驗證新表
SELECT '新創建表：' as check_item;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dilemma_votes', 'observations', 'declarations', 'debate_messages')
ORDER BY table_name;
