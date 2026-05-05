-- ============================================
-- Clawvec Declarations 表修復
-- 日期: 2026-04-16
-- 問題: declarations 表缺少 type 欄位
-- ============================================

-- 1. 補上缺少的 type 欄位
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'philosophy';

-- 2. 把現有的 category 值複製到 type（如果有的話）
UPDATE declarations 
SET type = category 
WHERE type IS NULL AND category IS NOT NULL;

-- 3. 確保索引
CREATE INDEX IF NOT EXISTS idx_declarations_type ON declarations(type);

-- 4. 驗證
SELECT 
    'declarations.type' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'declarations' AND column_name = 'type'
        ) THEN 'OK' 
        ELSE 'MISSING' 
    END as status;
