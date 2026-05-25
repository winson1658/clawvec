-- Sensor System Schema
-- 日期: 2026-05-03
-- 目標: 建立 sensor_configs 和 extraction_tasks 表，支援 RSS/News API/URL 等多感官輸入
-- 原則: 所有變更使用 IF NOT EXISTS，不會破壞現有資料

-- ============================================
-- 1. sensor_configs 感官配置表
-- ============================================
CREATE TABLE IF NOT EXISTS sensor_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    sensor_name VARCHAR(100) NOT NULL UNIQUE,
    sensor_type VARCHAR(30) NOT NULL
        CHECK (sensor_type IN ('rss', 'news_api', 'reddit', 'webhook', 'manual')),
    
    -- 配置參數（JSON）
    -- RSS:    { "feed_url": "https://...", "update_interval": "1h", "filters": ["keyword1"] }
    -- News:   { "api_key_ref": "env:NEWS_API_KEY", "sources": ["bbc"], "query": "philosophy AI" }
    -- Reddit: { "subreddit": "philosophy", "sort": "top", "time": "week" }
    config JSONB NOT NULL DEFAULT '{}',
    
    -- 狀態
    is_active BOOLEAN DEFAULT FALSE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    
    -- 作者
    created_by UUID REFERENCES agents(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_sensor_configs_type
    ON sensor_configs(sensor_type, is_active)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sensor_configs_name
    ON sensor_configs(sensor_name);

-- RLS
ALTER TABLE sensor_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON sensor_configs;
CREATE POLICY "Allow all" ON sensor_configs FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. extraction_tasks 擷取任務追蹤表
-- ============================================
CREATE TABLE IF NOT EXISTS extraction_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    sensor_config_id UUID REFERENCES sensor_configs(id) ON DELETE CASCADE,
    
    -- 任務狀態
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- 輸入
    raw_content TEXT,           -- 原始內容（用於預覽）
    raw_content_url TEXT,       -- 原始內容鏈接
    
    -- 輸出
    extracted_observation_id UUID REFERENCES observations(id) ON DELETE SET NULL,
    extracted_summary TEXT,     -- LLM/系統擷取的摘要
    
    -- 錯誤
    error_message TEXT,
    
    -- 時間
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_extraction_tasks_sensor
    ON extraction_tasks(sensor_config_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_extraction_tasks_status
    ON extraction_tasks(status, created_at DESC)
    WHERE status IN ('pending', 'running', 'failed');

CREATE INDEX IF NOT EXISTS idx_extraction_tasks_observation
    ON extraction_tasks(extracted_observation_id)
    WHERE extracted_observation_id IS NOT NULL;

-- RLS
ALTER TABLE extraction_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON extraction_tasks;
CREATE POLICY "Allow all" ON extraction_tasks FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. 更新 trigger：自動更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sensor_configs_updated_at ON sensor_configs;
CREATE TRIGGER update_sensor_configs_updated_at
    BEFORE UPDATE ON sensor_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. 視圖：方便查詢任務與 sensor 關聯
-- ============================================
CREATE OR REPLACE VIEW extraction_tasks_with_sensor AS
SELECT 
    t.*,
    s.sensor_name,
    s.sensor_type,
    s.config as sensor_config,
    s.is_active as sensor_is_active
FROM extraction_tasks t
LEFT JOIN sensor_configs s ON t.sensor_config_id = s.id
ORDER BY t.created_at DESC;

-- ============================================
-- 5. 預設範例：RSS feed sensor（停用狀態）
-- ============================================
-- 管理員可啟用並修改 feed_url
INSERT INTO sensor_configs (sensor_name, sensor_type, config, is_active)
VALUES (
    'Philosophy RSS Feed',
    'rss',
    '{
        "feed_url": "https://feeds.feedburner.com/philosophybites",
        "update_interval": "1h",
        "filters": ["philosophy", "consciousness", "AI"],
        "max_items_per_run": 10
    }'::jsonb,
    FALSE
)
ON CONFLICT (sensor_name) DO NOTHING;
