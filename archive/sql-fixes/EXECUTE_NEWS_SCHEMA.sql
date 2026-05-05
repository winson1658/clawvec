-- ============================================
-- AI 新聞聚合系統資料表創建
-- 執行此 SQL 以啟用 RSS 自動抓取功能
-- ============================================

-- 1. 新聞來源配置表
CREATE TABLE IF NOT EXISTS news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_zh VARCHAR(100),
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    source_type VARCHAR(50) DEFAULT 'rss',
    reliability_score INTEGER DEFAULT 80,
    language VARCHAR(10) DEFAULT 'en',
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    fetch_frequency VARCHAR(20) DEFAULT 'hourly',
    last_fetch_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 每日新聞表
CREATE TABLE IF NOT EXISTS daily_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES news_sources(id),
    external_id VARCHAR(255),
    title TEXT NOT NULL,
    title_zh TEXT,
    summary TEXT,
    summary_zh TEXT,
    ai_perspective TEXT,
    content TEXT,
    url TEXT NOT NULL,
    image_url TEXT,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    importance_score INTEGER DEFAULT 50,
    relevance_score INTEGER DEFAULT 50,
    sentiment_score INTEGER DEFAULT 0,
    category VARCHAR(50),
    tags JSONB DEFAULT '[]',
    is_chronicle_worthy BOOLEAN DEFAULT false,
    chronicle_period VARCHAR(20),
    added_to_chronicle_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    view_count INTEGER DEFAULT 0,
    UNIQUE(source_id, external_id)
);

-- 3. Cron 日誌表
CREATE TABLE IF NOT EXISTS news_cron_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(100) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'running',
    items_processed INTEGER DEFAULT 0,
    items_inserted INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time_ms INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_daily_news_published ON daily_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_news_importance ON daily_news(importance_score DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_daily_news_category ON daily_news(category);

-- 插入預設新聞來源
INSERT INTO news_sources (name, name_zh, base_url, source_type, category, reliability_score) VALUES
('The Verge', 'The Verge 科技', 'https://www.theverge.com', 'rss', 'technology', 85),
('TechCrunch', 'TechCrunch', 'https://techcrunch.com', 'rss', 'technology', 80),
('MIT Technology Review', 'MIT科技評論', 'https://www.technologyreview.com', 'rss', 'science', 95),
('Ars Technica', 'Ars Technica', 'https://arstechnica.com', 'rss', 'technology', 85)
ON CONFLICT (name) DO NOTHING;

-- RLS 權限
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_cron_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS news_sources_select ON news_sources FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS daily_news_select ON daily_news FOR SELECT USING (true);

SELECT 'AI新聞系統資料表創建完成！' as status;
