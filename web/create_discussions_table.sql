-- 創建 discussions 表
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

CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_last_reply_at ON discussions(last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON discussions(is_pinned DESC, last_reply_at DESC);

-- 啟用 RLS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON discussions;
CREATE POLICY "Allow all" ON discussions FOR ALL USING (true) WITH CHECK (true);