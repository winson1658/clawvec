-- ============================================
-- Clawvec 完整資料庫修復腳本
-- 修復 Observations, Declarations, Daily News 欄位問題
-- 執行日期: 2026-04-10
-- ============================================

-- 開始交易
BEGIN;

-- ============================================
-- 1. Observations 表修復
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '開始修復 observations 表...';
    
    -- 添加 published_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE observations ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✓ 添加 published_at 欄位';
    ELSE
        RAISE NOTICE '✓ published_at 已存在';
    END IF;

    -- 添加 event_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'event_date'
    ) THEN
        ALTER TABLE observations ADD COLUMN event_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✓ 添加 event_date 欄位';
    END IF;

    -- 添加 source_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'source_url'
    ) THEN
        ALTER TABLE observations ADD COLUMN source_url TEXT;
        RAISE NOTICE '✓ 添加 source_url 欄位';
    END IF;

    -- 添加 impact_rating
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'impact_rating'
    ) THEN
        ALTER TABLE observations ADD COLUMN impact_rating INTEGER DEFAULT 50;
        RAISE NOTICE '✓ 添加 impact_rating 欄位';
    END IF;

    -- 添加 is_milestone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'is_milestone'
    ) THEN
        ALTER TABLE observations ADD COLUMN is_milestone BOOLEAN DEFAULT false;
        RAISE NOTICE '✓ 添加 is_milestone 欄位';
    END IF;

    -- 初始化 published_at 為 created_at
    UPDATE observations SET published_at = created_at WHERE published_at IS NULL;
    RAISE NOTICE '✓ 初始化 published_at 資料';

END $$;

-- ============================================
-- 2. Declarations 表修復
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '開始修復 declarations 表...';
    
    -- 添加 published_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'declarations' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE declarations ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✓ 添加 published_at 欄位';
    ELSE
        RAISE NOTICE '✓ published_at 已存在';
    END IF;

    -- 添加 is_pinned
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'declarations' AND column_name = 'is_pinned'
    ) THEN
        ALTER TABLE declarations ADD COLUMN is_pinned BOOLEAN DEFAULT false;
        RAISE NOTICE '✓ 添加 is_pinned 欄位';
    END IF;

    -- 添加 endorse_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'declarations' AND column_name = 'endorse_count'
    ) THEN
        ALTER TABLE declarations ADD COLUMN endorse_count INTEGER DEFAULT 0;
        RAISE NOTICE '✓ 添加 endorse_count 欄位';
    END IF;

    -- 添加 oppose_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'declarations' AND column_name = 'oppose_count'
    ) THEN
        ALTER TABLE declarations ADD COLUMN oppose_count INTEGER DEFAULT 0;
        RAISE NOTICE '✓ 添加 oppose_count 欄位';
    END IF;

    -- 添加 spawned_debate_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'declarations' AND column_name = 'spawned_debate_id'
    ) THEN
        ALTER TABLE declarations ADD COLUMN spawned_debate_id UUID REFERENCES debates(id);
        RAISE NOTICE '✓ 添加 spawned_debate_id 欄位';
    END IF;

    -- 初始化 published_at 為 created_at
    UPDATE declarations SET published_at = created_at WHERE published_at IS NULL;
    RAISE NOTICE '✓ 初始化 published_at 資料';

END $$;

-- ============================================
-- 3. Daily News 表修復（AI 新聞策展）
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '開始修復 daily_news 表...';
    
    -- 添加 title_zh
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'title_zh'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN title_zh TEXT;
        RAISE NOTICE '✓ 添加 title_zh 欄位';
    ELSE
        RAISE NOTICE '✓ title_zh 已存在';
    END IF;

    -- 添加 summary_zh
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'summary_zh'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN summary_zh TEXT;
        RAISE NOTICE '✓ 添加 summary_zh 欄位';
    END IF;

    -- 添加 ai_perspective
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'ai_perspective'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN ai_perspective TEXT;
        RAISE NOTICE '✓ 添加 ai_perspective 欄位';
    END IF;

    -- 添加 relevance_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'relevance_score'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN relevance_score INTEGER DEFAULT 50;
        RAISE NOTICE '✓ 添加 relevance_score 欄位';
    END IF;

    -- 添加 tags
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'tags'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN tags JSONB DEFAULT '[]';
        RAISE NOTICE '✓ 添加 tags 欄位';
    END IF;

    -- 添加 fetched_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'fetched_at'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✓ 添加 fetched_at 欄位';
    END IF;

    -- 添加 sentiment_score（可選）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'sentiment_score'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN sentiment_score INTEGER DEFAULT 0;
        RAISE NOTICE '✓ 添加 sentiment_score 欄位';
    END IF;

END $$;

-- ============================================
-- 4. 建立索引
-- ============================================

-- Observations 索引
CREATE INDEX IF NOT EXISTS idx_observations_published ON observations(published_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_observations_featured ON observations(is_featured, published_at DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_observations_milestone ON observations(is_milestone, published_at DESC) WHERE is_milestone = true;

-- Declarations 索引
CREATE INDEX IF NOT EXISTS idx_declarations_published ON declarations(published_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_declarations_pinned ON declarations(is_pinned, published_at DESC) WHERE is_pinned = true;

-- Daily News 索引
CREATE INDEX IF NOT EXISTS idx_daily_news_relevance ON daily_news(relevance_score DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_daily_news_fetched ON daily_news(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_news_category ON daily_news(category);

-- ============================================
-- 5. 更新 RLS 政策
-- ============================================

-- 確保 observations 有 SELECT 政策
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'observations' AND policyname = 'observations_select'
    ) THEN
        CREATE POLICY observations_select ON observations FOR SELECT USING (true);
        RAISE NOTICE '✓ 創建 observations_select 政策';
    END IF;
END $$;

-- 確保 declarations 有 SELECT 政策
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'declarations' AND policyname = 'declarations_select'
    ) THEN
        CREATE POLICY declarations_select ON declarations FOR SELECT USING (true);
        RAISE NOTICE '✓ 創建 declarations_select 政策';
    END IF;
END $$;

-- 確保 daily_news 有 SELECT 政策
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'daily_news' AND policyname = 'daily_news_select'
    ) THEN
        CREATE POLICY daily_news_select ON daily_news FOR SELECT USING (true);
        RAISE NOTICE '✓ 創建 daily_news_select 政策';
    END IF;
END $$;

-- ============================================
-- 6. 驗證結果
-- ============================================

DO $$
DECLARE
    obs_cols INTEGER;
    dec_cols INTEGER;
    news_cols INTEGER;
BEGIN
    -- 檢查 observations
    SELECT COUNT(*) INTO obs_cols FROM information_schema.columns 
    WHERE table_name = 'observations' 
    AND column_name IN ('published_at', 'event_date', 'source_url', 'impact_rating', 'is_milestone');
    
    -- 檢查 declarations
    SELECT COUNT(*) INTO dec_cols FROM information_schema.columns 
    WHERE table_name = 'declarations' 
    AND column_name IN ('published_at', 'is_pinned', 'endorse_count', 'oppose_count', 'spawned_debate_id');
    
    -- 檢查 daily_news
    SELECT COUNT(*) INTO news_cols FROM information_schema.columns 
    WHERE table_name = 'daily_news' 
    AND column_name IN ('title_zh', 'summary_zh', 'ai_perspective', 'relevance_score', 'tags', 'fetched_at', 'sentiment_score');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '修復驗證結果:';
    RAISE NOTICE '  Observations 欄位: %/5', obs_cols;
    RAISE NOTICE '  Declarations 欄位: %/5', dec_cols;
    RAISE NOTICE '  Daily News 欄位: %/7', news_cols;
    RAISE NOTICE '========================================';
    
    IF obs_cols = 5 AND dec_cols = 5 AND news_cols = 7 THEN
        RAISE NOTICE '✅ 所有修復成功完成！';
    ELSE
        RAISE NOTICE '⚠️ 部分欄位可能未正確添加';
    END IF;
END $$;

-- 顯示最終表結構
SELECT 'observations' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'observations' 
AND column_name IN ('published_at', 'event_date', 'source_url', 'impact_rating', 'is_milestone')
ORDER BY ordinal_position;

SELECT 'declarations' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'declarations' 
AND column_name IN ('published_at', 'is_pinned', 'endorse_count', 'oppose_count', 'spawned_debate_id')
ORDER BY ordinal_position;

SELECT 'daily_news' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_news' 
AND column_name IN ('title_zh', 'summary_zh', 'ai_perspective', 'relevance_score', 'tags', 'fetched_at', 'sentiment_score')
ORDER BY ordinal_position;

-- 提交交易
COMMIT;

-- 完成
SELECT '✅ Clawvec 資料庫修復完成！' as status;
