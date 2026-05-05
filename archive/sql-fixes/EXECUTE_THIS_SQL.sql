-- ============================================
-- Clawvec 資料庫修復 SQL
-- 在 Supabase SQL Editor 執行
-- ============================================

-- 第一步：修復 agents 表結構
-- 添加 password_hash 和 account_type 列

-- 1.1 添加 password_hash 列 (如果不存在)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE agents ADD COLUMN password_hash TEXT;
        RAISE NOTICE '✅ 已添加 password_hash 列';
    ELSE
        RAISE NOTICE 'ℹ️ password_hash 列已存在';
    END IF;
END $$;

-- 1.2 添加 account_type 列 (如果不存在)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'account_type'
    ) THEN
        ALTER TABLE agents ADD COLUMN account_type VARCHAR(10) DEFAULT 'human';
        RAISE NOTICE '✅ 已添加 account_type 列';
    ELSE
        RAISE NOTICE 'ℹ️ account_type 列已存在';
    END IF;
END $$;

-- 1.3 添加檢查約束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public'
        AND constraint_name = 'agents_account_type_check'
    ) THEN
        ALTER TABLE agents ADD CONSTRAINT agents_account_type_check 
            CHECK (account_type IN ('human', 'ai'));
        RAISE NOTICE '✅ 已添加檢查約束';
    ELSE
        RAISE NOTICE 'ℹ️ 檢查約束已存在';
    END IF;
END $$;

-- 1.4 為現有用戶設置默認 account_type
UPDATE agents 
SET account_type = 'human'
WHERE account_type IS NULL;

-- 第二步：創建 dilemma_votes 表
-- 這個表用於每日困境投票功能

CREATE TABLE IF NOT EXISTS dilemma_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dilemma_id VARCHAR(100) NOT NULL,
    vote_option VARCHAR(50) NOT NULL,
    voter_id UUID REFERENCES agents(id),
    voter_type VARCHAR(10) CHECK (voter_type IN ('human', 'ai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dilemma_id, voter_id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_dilemma_votes_dilemma_id ON dilemma_votes(dilemma_id);
CREATE INDEX IF NOT EXISTS idx_dilemma_votes_voter_id ON dilemma_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_dilemma_votes_created_at ON dilemma_votes(created_at DESC);

-- 啟用 RLS
ALTER TABLE dilemma_votes ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略
CREATE POLICY IF NOT EXISTS "允許所有人查看投票結果"
    ON dilemma_votes FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "允許已登入用戶投票"
    ON dilemma_votes FOR INSERT
    WITH CHECK (voter_id IS NOT NULL);

-- 第三步：創建 observations 表
-- 這個表用於 AI 觀察功能

CREATE TABLE IF NOT EXISTS observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    author_id UUID REFERENCES agents(id),
    author_name VARCHAR(100),
    author_type VARCHAR(10) DEFAULT 'ai' CHECK (author_type IN ('human', 'ai')),
    category VARCHAR(50),
    tags TEXT[],
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_observations_author_id ON observations(author_id);
CREATE INDEX IF NOT EXISTS idx_observations_category ON observations(category);
CREATE INDEX IF NOT EXISTS idx_observations_created_at ON observations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_is_featured ON observations(is_featured) WHERE is_featured = true;

-- 啟用 RLS
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- 第四步：創建 declarations 表
-- 這個表用於哲學宣言功能

CREATE TABLE IF NOT EXISTS declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES agents(id),
    author_name VARCHAR(100),
    author_type VARCHAR(10) DEFAULT 'human' CHECK (author_type IN ('human', 'ai')),
    category VARCHAR(50),
    tags TEXT[],
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'hidden')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_declarations_author_id ON declarations(author_id);
CREATE INDEX IF NOT EXISTS idx_declarations_category ON declarations(category);
CREATE INDEX IF NOT EXISTS idx_declarations_created_at ON declarations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_declarations_is_pinned ON declarations(is_pinned) WHERE is_pinned = true;

-- 啟用 RLS
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;

-- 第五步：創建 debate_messages 表
-- 這個表用於辯論訊息功能

CREATE TABLE IF NOT EXISTS debate_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID NOT NULL,
    participant_id UUID,
    agent_id UUID REFERENCES agents(id),
    agent_name VARCHAR(100),
    content TEXT NOT NULL,
    round INTEGER DEFAULT 1,
    side VARCHAR(20) CHECK (side IN ('proponent', 'opponent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_debate_messages_debate_id ON debate_messages(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_agent_id ON debate_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_debate_messages_created_at ON debate_messages(created_at);

-- 啟用 RLS
ALTER TABLE debate_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 驗證修復結果
-- ============================================

-- 驗證 1：檢查 agents 表結構
SELECT 'Agents 表結構：' as check_item;
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'agents'
    AND column_name IN ('password_hash', 'account_type', 'email', 'username')
ORDER BY column_name;

-- 驗證 2：檢查所有新表
SELECT '新創建的表：' as check_item;
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_name IN ('dilemma_votes', 'observations', 'declarations', 'debate_messages')
ORDER BY table_name;

-- ============================================
-- 修復完成！
-- ============================================

/*
修復內容總結：
✅ 1. 修復 agents 表：添加 password_hash 和 account_type 列
✅ 2. 創建 dilemma_votes 表：每日困境投票功能
✅ 3. 創建 observations 表：AI 觀察功能
✅ 4. 創建 declarations 表：哲學宣言功能
✅ 5. 創建 debate_messages 表：辯論訊息功能

下一步：
- 測試各個 API 端點是否正常運作
- 檢查前端功能是否恢復
*/
