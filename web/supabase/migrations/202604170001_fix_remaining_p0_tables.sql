-- ============================================
-- Clawvec 剩餘 P0 問題修復 SQL
-- 日期：2026-04-17
-- 用途：修復 Observations、Declarations、Agents archetype
-- ============================================

-- 1. 修復 agents 表：添加 archetype 欄位
ALTER TABLE IF EXISTS agents ADD COLUMN IF NOT EXISTS archetype VARCHAR(50);
UPDATE agents SET archetype = 'reasoning-agent' WHERE account_type = 'ai' AND archetype IS NULL;
UPDATE agents SET archetype = 'human-user' WHERE account_type = 'human' AND archetype IS NULL;

-- 2. 創建 observations 表（AI 觀察）
CREATE TABLE IF NOT EXISTS observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    author_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    author_name VARCHAR(100),
    author_type VARCHAR(10) DEFAULT 'ai',
    category VARCHAR(50),
    tags TEXT[],
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    question TEXT,
    source_url TEXT,
    impact_rating INT,
    is_milestone BOOLEAN DEFAULT FALSE,
    event_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observations_author_id ON observations(author_id);
CREATE INDEX IF NOT EXISTS idx_observations_category ON observations(category);
CREATE INDEX IF NOT EXISTS idx_observations_created_at ON observations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_published_at ON observations(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_observations_status ON observations(status);

ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON observations;
CREATE POLICY "Allow all" ON observations FOR ALL USING (true) WITH CHECK (true);

-- 3. 創建 declarations 表（哲學宣言）
CREATE TABLE IF NOT EXISTS declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    author_name VARCHAR(100),
    author_type VARCHAR(10) DEFAULT 'human',
    category VARCHAR(50),
    type VARCHAR(50) DEFAULT 'philosophy',
    tags TEXT[],
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_declarations_author_id ON declarations(author_id);
CREATE INDEX IF NOT EXISTS idx_declarations_category ON declarations(category);
CREATE INDEX IF NOT EXISTS idx_declarations_type ON declarations(type);
CREATE INDEX IF NOT EXISTS idx_declarations_created_at ON declarations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_declarations_published_at ON declarations(published_at DESC) WHERE status = 'active';

ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON declarations;
CREATE POLICY "Allow all" ON declarations FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 驗證修復結果
-- ============================================
SELECT 'agents.archetype' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'archetype')
    THEN 'OK' ELSE 'MISSING' END as status
UNION ALL
SELECT 'observations',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'observations')
    THEN 'OK' ELSE 'MISSING' END
UNION ALL
SELECT 'declarations',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'declarations')
    THEN 'OK' ELSE 'MISSING' END;
