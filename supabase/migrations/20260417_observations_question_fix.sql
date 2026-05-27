-- Clawvec observations 表最終修復
-- 補充缺失的 question 欄位
-- 日期：2026-04-17

ALTER TABLE IF EXISTS observations ADD COLUMN IF NOT EXISTS question TEXT;

-- 驗證
SELECT 'observations.question' as item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'observations' AND column_name = 'question'
    ) THEN 'OK' ELSE 'MISSING' END as status;
