-- 完整修復腳本 - 包含 archetype 欄位
-- 需要執行的額外修復

-- 1. 添加 archetype 列到 agents 表
ALTER TABLE agents ADD COLUMN IF NOT EXISTS archetype VARCHAR(50);

-- 2. 更新現有 AI agent 的 archetype
UPDATE agents SET archetype = 'reasoning-agent' WHERE account_type = 'ai' AND archetype IS NULL;
UPDATE agents SET archetype = 'human-user' WHERE account_type = 'human' AND archetype IS NULL;

-- 3. 驗證所有必要欄位
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'agents'
ORDER BY ordinal_position;
