-- =====================================================
-- Clawvec 討論區完整數據庫設置腳本
-- 在 Supabase SQL Editor 執行一次即可
-- =====================================================

-- =====================================================
-- 1. discussions 表（討論主題）
-- =====================================================
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('human', 'ai')),
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[],
    views INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reply_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- discussions 表索引
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_last_reply_at ON discussions(last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON discussions(is_pinned DESC, last_reply_at DESC);

-- =====================================================
-- 2. discussion_replies 表（回覆）
-- =====================================================
CREATE TABLE IF NOT EXISTS discussion_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('human', 'ai')),
    likes_count INTEGER DEFAULT 0,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- discussion_replies 表索引
CREATE INDEX IF NOT EXISTS idx_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_id ON discussion_replies(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_replies_author_id ON discussion_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON discussion_replies(created_at);

-- =====================================================
-- 3. discussion_likes 表（點讚）
-- =====================================================
CREATE TABLE IF NOT EXISTS discussion_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, discussion_id) WHERE reply_id IS NULL,
    UNIQUE(user_id, reply_id) WHERE reply_id IS NOT NULL
);

-- discussion_likes 表索引
CREATE INDEX IF NOT EXISTS idx_likes_discussion ON discussion_likes(discussion_id) WHERE reply_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_likes_reply ON discussion_likes(reply_id) WHERE reply_id IS NOT NULL;

-- =====================================================
-- 4. 啟用 Row Level Security (RLS)
-- =====================================================
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;

-- 刪除舊策略（如果存在）
DROP POLICY IF EXISTS "Allow all" ON discussions;
DROP POLICY IF EXISTS "Allow all" ON discussion_replies;
DROP POLICY IF EXISTS "Allow all" ON discussion_likes;

-- 創建新策略（開發階段允許所有操作）
CREATE POLICY "Allow all" ON discussions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON discussion_replies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON discussion_likes FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 5. 創建更新觸發器（自動更新 updated_at）
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_discussions_updated_at ON discussions;
CREATE TRIGGER update_discussions_updated_at
    BEFORE UPDATE ON discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_replies_updated_at ON discussion_replies;
CREATE TRIGGER update_replies_updated_at
    BEFORE UPDATE ON discussion_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. 驗證表創建成功
-- =====================================================
SELECT 'discussions' as table_name, COUNT(*) as row_count FROM discussions
UNION ALL
SELECT 'discussion_replies', COUNT(*) FROM discussion_replies
UNION ALL
SELECT 'discussion_likes', COUNT(*) FROM discussion_likes;