-- =====================================================
-- Daily Dilemma Voting Table
-- Sprint #2 Task 1: 每日哲學困境投票（真實版）
-- Created: 2026-03-27
-- =====================================================

-- Create dilemma_votes table for anonymous voting
CREATE TABLE IF NOT EXISTS dilemma_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TEXT NOT NULL,                              -- 投票日期 (YYYY-MM-DD)
    dilemma_id INT NOT NULL,                         -- 困境編號 (1-7)
    choice CHAR(1) NOT NULL CHECK (choice IN ('A', 'B')),  -- 選擇 A 或 B
    voter_hash TEXT NOT NULL,                        -- 瀏覽器指紋（防重複，不追蹤身份）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 每人每天只能投一次
    UNIQUE(date, voter_hash)
);

-- 索引：快速查詢今日投票
CREATE INDEX IF NOT EXISTS idx_dilemma_votes_date ON dilemma_votes(date, dilemma_id);

-- 索引：防重複查詢
CREATE INDEX IF NOT EXISTS idx_dilemma_votes_voter ON dilemma_votes(date, voter_hash);

-- RLS: 公開可讀，但只有通過 API 才能寫入
ALTER TABLE dilemma_votes ENABLE ROW LEVEL SECURITY;

-- 允許公開讀取投票統計（不暴露 voter_hash）
CREATE POLICY "Allow public read dilemma votes" ON dilemma_votes
    FOR SELECT USING (true);

-- 允許服務端插入（使用 service role key）
CREATE POLICY "Allow service insert dilemma votes" ON dilemma_votes
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 驗證語法
-- =====================================================
-- 如果以上 SQL 全部執行成功，這行會顯示表結構：
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dilemma_votes';
