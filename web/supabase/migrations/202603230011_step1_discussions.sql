-- 步驟 1：創建 discussions 表（先執行這個）
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