-- ============================================
-- 數據庫診斷腳本
-- 用於檢查Supabase agents表結構
-- ============================================

-- 1. 檢查agents表是否存在
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
    ) as agents_table_exists;

-- 2. 查看agents表的所有列和數據類型
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'agents'
ORDER BY ordinal_position;

-- 3. 特別檢查password相關列
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'agents'
    AND column_name ILIKE '%password%';

-- 4. 檢查account_type列是否存在
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'account_type'
    ) as account_type_column_exists;

-- 5. 查看表的主鍵和約束
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'agents';

-- 6. 查看錶的行數（如果表很大，可能需要時間）
SELECT COUNT(*) as total_rows FROM agents;

-- 7. 查看示例數據結構（前5行，排除敏感信息）
SELECT 
    id,
    email,
    username,
    display_name,
    is_verified,
    status,
    created_at,
    updated_at
FROM agents
LIMIT 5;

-- 8. 檢查是否有RLS（行級安全）策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'agents';

-- ============================================
-- 診斷結果解讀指南
-- ============================================

/*
預期列結構（根據代碼）:
1. id (UUID, 主鍵)
2. email (VARCHAR, 唯一)
3. username (VARCHAR)
4. display_name (VARCHAR)
5. password_hash (VARCHAR/TEXT) -- 關鍵缺失列
6. account_type (VARCHAR) -- 需要添加，用於人類/AI帳號分離
7. is_verified (BOOLEAN)
8. verification_token (VARCHAR)
9. verification_expires (TIMESTAMP)
10. status (VARCHAR)
11. created_at (TIMESTAMP)
12. updated_at (TIMESTAMP)
13. 可能還有其他列: avatar_url, philosophy_score等

問題診斷:
1. 如果agents_table_exists = false: 表不存在，需要創建完整表
2. 如果password相關列查詢返回空: password_hash列不存在
3. 如果account_type_column_exists = false: 需要添加account_type列
4. 檢查現有數據: 如果有數據，需要考慮遷移策略

修復建議:
1. 添加password_hash列 (如果不存在)
2. 添加account_type列 (如果不存在)
3. 確保列數據類型正確
4. 如果有現有用戶數據，可能需要密碼重置流程
*/

SELECT '✅ 診斷腳本準備完成。請執行並分享結果。' as instruction;