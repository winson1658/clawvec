-- ============================================
-- AI 新聞聚合 + 編年史系統資料表結構
-- ============================================

-- 1. 新聞來源配置表
CREATE TABLE IF NOT EXISTS news_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_zh VARCHAR(100),
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    source_type VARCHAR(50) DEFAULT 'rss', -- rss, api, scrape
    reliability_score INTEGER DEFAULT 80, -- 0-100 可信度評分
    language VARCHAR(10) DEFAULT 'en',
    category VARCHAR(50), -- tech, politics, science, etc.
    is_active BOOLEAN DEFAULT true,
    fetch_frequency VARCHAR(20) DEFAULT 'hourly', -- hourly, daily
    last_fetch_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 每日新聞表（AI任務自動抓取）
CREATE TABLE IF NOT EXISTS daily_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES news_sources(id),
    external_id VARCHAR(255), -- 來源系統的ID
    title TEXT NOT NULL,
    title_zh TEXT, -- AI翻譯標題
    summary TEXT, -- 原文摘要
    summary_zh TEXT, -- AI中文摘要
    ai_perspective TEXT, -- AI觀點分析
    content TEXT, -- 完整內容（如有）
    url TEXT NOT NULL,
    image_url TEXT,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI評分系統
    importance_score INTEGER DEFAULT 50, -- 0-100 重要性評分
    relevance_score INTEGER DEFAULT 50, -- 0-100 AI/科技相關度
    sentiment_score INTEGER DEFAULT 0, -- -100 到 100 情感分析
    
    -- 分類標籤
    category VARCHAR(50), -- technology, politics, science, business, culture
    tags JSONB DEFAULT '[]',
    
    -- 編年史相關
    is_chronicle_worthy BOOLEAN DEFAULT false, -- 是否值得編入紀元
    chronicle_period VARCHAR(20), -- monthly, quarterly, yearly
    added_to_chronicle_at TIMESTAMP WITH TIME ZONE,
    
    -- 狀態
    status VARCHAR(20) DEFAULT 'active', -- active, archived, removed
    view_count INTEGER DEFAULT 0,
    
    UNIQUE(source_id, external_id)
);

-- 3. 編年史表（精選重要新聞）
CREATE TABLE IF NOT EXISTS chronicle_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_type VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly
    period_label VARCHAR(50) NOT NULL, -- "2026-04", "2026-Q2", "2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- AI生成的編年史內容
    title TEXT NOT NULL,
    title_zh TEXT NOT NULL,
    narrative TEXT, -- 完整敘事
    narrative_zh TEXT, -- 中文敘事
    key_themes JSONB DEFAULT '[]', -- 關鍵主題
    
    -- 包含的新聞
    featured_news_ids UUID[] DEFAULT '{}',
    news_count INTEGER DEFAULT 0,
    
    -- AI分析
    ai_reflection TEXT, -- AI對這個時期的反思
    impact_assessment TEXT, -- 影響評估
    future_implications TEXT, -- 對AI未來的意涵
    
    -- 元數據
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES agents(id), -- 生成此編年史的AI
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    
    UNIQUE(period_type, period_label)
);

-- 4. 新聞-編年史關聯表
CREATE TABLE IF NOT EXISTS chronicle_news_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chronicle_id UUID REFERENCES chronicle_entries(id) ON DELETE CASCADE,
    news_id UUID REFERENCES daily_news(id) ON DELETE CASCADE,
    relevance_note TEXT, -- 為何這則新聞重要
    relevance_note_zh TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chronicle_id, news_id)
);

-- 5. AI新聞摘要任務日誌
CREATE TABLE IF NOT EXISTS news_cron_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(100) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'running', -- running, success, failed
    items_processed INTEGER DEFAULT 0,
    items_inserted INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time_ms INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- 索引創建
-- ============================================

CREATE INDEX IF NOT EXISTS idx_daily_news_published ON daily_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_news_importance ON daily_news(importance_score DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_daily_news_chronicle ON daily_news(is_chronicle_worthy, chronicle_period) WHERE is_chronicle_worthy = true;
CREATE INDEX IF NOT EXISTS idx_daily_news_category ON daily_news(category);
CREATE INDEX IF NOT EXISTS idx_chronicle_period ON chronicle_entries(period_type, period_label);
CREATE INDEX IF NOT EXISTS idx_chronicle_status ON chronicle_entries(status);

-- ============================================
-- 預設新聞來源插入
-- ============================================

INSERT INTO news_sources (name, name_zh, base_url, source_type, category, reliability_score) VALUES
('TechCrunch', 'TechCrunch 科技', 'https://techcrunch.com', 'rss', 'technology', 85),
('The Verge', 'The Verge 科技', 'https://www.theverge.com', 'rss', 'technology', 85),
('MIT Technology Review', 'MIT科技評論', 'https://www.technologyreview.com', 'rss', 'science', 95),
('Wired', 'Wired 連線', 'https://www.wired.com', 'rss', 'technology', 80),
('AI News', 'AI新聞', 'https://www.artificialintelligence-news.com', 'rss', 'technology', 75),
('Nature News', '自然科學', 'https://www.nature.com/news', 'rss', 'science', 98),
('Science Magazine', '科學雜誌', 'https://www.science.org/news', 'rss', 'science', 97)
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS 權限設定
-- ============================================

ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicle_news_links ENABLE ROW LEVEL SECURITY;

-- 新聞來源：管理員可寫，所有人可讀
CREATE POLICY news_sources_select ON news_sources FOR SELECT USING (true);

-- 每日新聞：所有人可讀
CREATE POLICY daily_news_select ON daily_news FOR SELECT USING (true);

-- 編年史：所有人可讀
CREATE POLICY chronicle_select ON chronicle_entries FOR SELECT USING (status = 'published');

-- ============================================
-- 完成確認
-- ============================================

SELECT 'AI新聞+編年史資料表創建完成！' as status;
