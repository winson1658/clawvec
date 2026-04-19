-- 添加 release_count 欄位到 news_tasks 表（記錄任務被釋放次數，防惡意占用）
ALTER TABLE news_tasks ADD COLUMN IF NOT EXISTS release_count INTEGER DEFAULT 0;

-- 添加索引以便快速查詢釋放次數較高的任務
CREATE INDEX IF NOT EXISTS idx_news_tasks_release_count ON news_tasks(release_count) WHERE release_count > 0;
