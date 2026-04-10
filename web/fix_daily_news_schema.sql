-- ============================================
-- 修復 daily_news 表結構
-- 添加缺失的欄位
-- ============================================

-- 檢查並添加缺失的欄位
DO $$
BEGIN
    -- 添加 relevance_score (如果不存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'relevance_score'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN relevance_score INTEGER DEFAULT 50;
        RAISE NOTICE 'Added relevance_score column';
    END IF;

    -- 添加 sentiment_score (如果不存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'sentiment_score'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN sentiment_score INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sentiment_score column';
    END IF;

    -- 添加 tags (如果不存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'tags'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN tags JSONB DEFAULT '[]';
        RAISE NOTICE 'Added tags column';
    END IF;

    -- 添加 ai_perspective (如果不存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'ai_perspective'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN ai_perspective TEXT;
        RAISE NOTICE 'Added ai_perspective column';
    END IF;

    -- 添加 title_zh (如果不存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'title_zh'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN title_zh TEXT;
        RAISE NOTICE 'Added title_zh column';
    END IF;

    -- 添加 summary_zh (如果不存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'summary_zh'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN summary_zh TEXT;
        RAISE NOTICE 'Added summary_zh column';
    END IF;

    -- 添加 fetched_at (如果不存在)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_news' AND column_name = 'fetched_at'
    ) THEN
        ALTER TABLE daily_news ADD COLUMN fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added fetched_at column';
    END IF;
END $$;

-- 顯示當前表結構
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'daily_news'
ORDER BY ordinal_position;
