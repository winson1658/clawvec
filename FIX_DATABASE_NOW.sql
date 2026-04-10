-- ============================================
-- Clawvec 緊急資料庫修復 - 執行日期: 2026-04-10
-- 用途: 修復 Observations, Declarations, Daily News 欄位問題
-- 執行方式: 複製此 SQL 到 Supabase Dashboard → SQL Editor → Run
-- ============================================

-- ============================================
-- 1. Observations 表修復
-- ============================================

-- 添加 published_at (缺失的主要欄位)
ALTER TABLE observations ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
UPDATE observations SET published_at = created_at WHERE published_at IS NULL;

-- 添加其他常用欄位
ALTER TABLE observations ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS impact_rating INTEGER DEFAULT 50;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT false;

-- ============================================
-- 2. Declarations 表修復
-- ============================================

-- 添加 published_at (缺失的主要欄位)
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
UPDATE declarations SET published_at = created_at WHERE published_at IS NULL;

-- 添加其他常用欄位
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS endorse_count INTEGER DEFAULT 0;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS oppose_count INTEGER DEFAULT 0;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS spawned_debate_id UUID REFERENCES debates(id);

-- ============================================
-- 3. Daily News 表修復 (AI 新聞策展)
-- ============================================

-- AI 翻譯與分析欄位
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS title_zh TEXT;
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS summary_zh TEXT;
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS ai_perspective TEXT;
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 50;
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS sentiment_score INTEGER DEFAULT 0;

-- ============================================
-- 4. 建立索引 (提升查詢效能)
-- ============================================

-- Observations 索引
CREATE INDEX IF NOT EXISTS idx_observations_published ON observations(published_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_observations_featured ON observations(is_featured, published_at DESC) WHERE is_featured = true;

-- Declarations 索引  
CREATE INDEX IF NOT EXISTS idx_declarations_published ON declarations(published_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_declarations_pinned ON declarations(is_pinned, published_at DESC) WHERE is_pinned = true;

-- Daily News 索引
CREATE INDEX IF NOT EXISTS idx_daily_news_relevance ON daily_news(relevance_score DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_daily_news_fetched ON daily_news(fetched_at DESC);

-- ============================================
-- 5. RLS 政策更新
-- ============================================

-- 確保所有表都有 SELECT 權限
CREATE POLICY IF NOT EXISTS observations_select ON observations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS declarations_select ON declarations FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS daily_news_select ON daily_news FOR SELECT USING (true);

-- ============================================
-- 6. 驗證結果
-- ============================================

-- 顯示修復後的欄位統計
SELECT 'observations' as table_name, 
       COUNT(*) as fixed_columns
FROM information_schema.columns 
WHERE table_name = 'observations' 
AND column_name IN ('published_at', 'event_date', 'source_url', 'impact_rating', 'is_milestone')

UNION ALL

SELECT 'declarations' as table_name, 
       COUNT(*) as fixed_columns
FROM information_schema.columns 
WHERE table_name = 'declarations' 
AND column_name IN ('published_at', 'is_pinned', 'endorse_count', 'oppose_count', 'spawned_debate_id')

UNION ALL

SELECT 'daily_news' as table_name, 
       COUNT(*) as fixed_columns
FROM information_schema.columns 
WHERE table_name = 'daily_news' 
AND column_name IN ('title_zh', 'summary_zh', 'ai_perspective', 'relevance_score', 'tags', 'fetched_at', 'sentiment_score');

-- ============================================
-- ✅ 完成！預期結果:
-- observations | 5
-- declarations | 5  
-- daily_news   | 7
-- ============================================
