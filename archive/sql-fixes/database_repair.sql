-- ============================================
-- 數據庫修復腳本
-- 修復agents表的password_hash和account_type列問題
-- ============================================

-- 重要: 先執行database_diagnosis.sql了解當前結構
-- 然後根據診斷結果選擇適當的修復方案

-- ============================================
-- 方案A: 簡單修復 - 添加缺失列
-- 適用於: 表存在，只是缺少password_hash和account_type列
-- ============================================

-- A1. 添加password_hash列 (如果不存在)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE agents ADD COLUMN password_hash TEXT;
        RAISE NOTICE '✅ 已添加password_hash列';
    ELSE
        RAISE NOTICE 'ℹ️  password_hash列已存在';
    END IF;
END $$;

-- A2. 添加account_type列 (如果不存在)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'account_type'
    ) THEN
        ALTER TABLE agents ADD COLUMN account_type VARCHAR(10) DEFAULT 'human';
        RAISE NOTICE '✅ 已添加account_type列，默認值為human';
    ELSE
        RAISE NOTICE 'ℹ️  account_type列已存在';
    END IF;
END $$;

-- A3. 為account_type列添加檢查約束 (確保只能是human或ai)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public'
        AND constraint_name = 'agents_account_type_check'
    ) THEN
        ALTER TABLE agents ADD CONSTRAINT agents_account_type_check 
            CHECK (account_type IN ('human', 'ai'));
        RAISE NOTICE '✅ 已添加account_type檢查約束';
    ELSE
        RAISE NOTICE 'ℹ️  account_type檢查約束已存在';
    END IF;
END $$;

-- ============================================
-- 方案B: 列重命名修復
-- 適用於: 有password列但名稱不是password_hash
-- ============================================

-- B1. 檢查是否有名為password的列
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'password'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'password_hash'
    ) THEN
        -- 重命名password列為password_hash
        ALTER TABLE agents RENAME COLUMN password TO password_hash;
        RAISE NOTICE '✅ 已將password列重命名為password_hash';
        
        -- 更改數據類型為TEXT（如果原來是VARCHAR）
        ALTER TABLE agents ALTER COLUMN password_hash TYPE TEXT;
        RAISE NOTICE '✅ 已將password_hash列數據類型改為TEXT';
    END IF;
END $$;

-- ============================================
-- 方案C: 完整表重建 (謹慎使用)
-- 適用於: 表結構與預期差異很大，或者表不存在
-- 警告: 會刪除現有數據！僅用於開發環境或無數據情況
-- ============================================

/*
-- C1. 創建完整的agents表 (如果表不存在或需要完全重建)
-- 先刪除現有表 (危險！僅在確定沒有重要數據時使用)
-- DROP TABLE IF EXISTS agents CASCADE;

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 認證信息
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    display_name VARCHAR(100),
    password_hash TEXT NOT NULL, -- bcrypt哈希密碼
    account_type VARCHAR(10) DEFAULT 'human' CHECK (account_type IN ('human', 'ai')),
    
    -- 驗證狀態
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(100),
    verification_expires TIMESTAMP WITH TIME ZONE,
    
    -- 帳戶狀態
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned')),
    
    -- 個人資料
    avatar_url TEXT,
    biography TEXT,
    
    -- 哲學評分
    philosophy_score FLOAT DEFAULT 0.0 CHECK (philosophy_score >= 0 AND philosophy_score <= 1),
    reputation_score FLOAT DEFAULT 0.5 CHECK (reputation_score >= 0 AND reputation_score <= 1),
    total_interactions INTEGER DEFAULT 0,
    
    -- 活動時間
    last_active_at TIMESTAMP WITH TIME ZONE,
    
    -- 管理標誌
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    
    -- 時間戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_username ON agents(username);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_account_type ON agents(account_type);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);

-- 啟用RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 創建RLS策略 (示例)
CREATE POLICY "用戶可以查看自己的資料" ON agents
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "用戶可以更新自己的資料" ON agents
    FOR UPDATE USING (auth.uid() = id);
*/

-- ============================================
-- 方案D: 數據遷移和清理
-- 適用於: 有現有用戶數據需要處理
-- ============================================

-- D1. 檢查是否有現有用戶數據但password_hash為空
DO $$
DECLARE
    empty_password_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO empty_password_count
    FROM agents
    WHERE password_hash IS NULL OR password_hash = '';
    
    IF empty_password_count > 0 THEN
        RAISE NOTICE '⚠️  發現 % 個用戶的password_hash為空。需要密碼重置流程。', empty_password_count;
        
        -- 可以選擇標記這些用戶需要重置密碼
        UPDATE agents 
        SET status = 'inactive',
            verification_token = 'PASSWORD_RESET_REQUIRED'
        WHERE password_hash IS NULL OR password_hash = '';
        
        RAISE NOTICE '✅ 已標記這些帳戶為inactive，需要密碼重置';
    ELSE
        RAISE NOTICE '✅ 所有用戶都有password_hash值';
    END IF;
END $$;

-- D2. 為現有用戶設置默認account_type (如果添加了該列)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'account_type'
    ) THEN
        -- 將現有用戶的account_type設置為human
        UPDATE agents 
        SET account_type = 'human'
        WHERE account_type IS NULL;
        
        RAISE NOTICE '✅ 已將現有用戶的account_type設置為human';
    END IF;
END $$;

-- ============================================
-- 方案E: 驗證修復結果
-- ============================================

-- E1. 驗證修復後的表結構
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'agents'
    AND column_name IN ('password_hash', 'account_type', 'email', 'username')
ORDER BY column_name;

-- E2. 驗證必要的列都存在
SELECT 
    COUNT(*) as missing_columns_count,
    ARRAY_AGG(missing_column) as missing_columns
FROM (
    SELECT 'password_hash' as missing_column
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'password_hash'
    )
    UNION ALL
    SELECT 'account_type' as missing_column
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'account_type'
    )
    UNION ALL
    SELECT 'email' as missing_column
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'email'
    )
) missing;

-- E3. 驗證account_type約束
SELECT 
    COUNT(*) as invalid_account_types,
    ARRAY_AGG(DISTINCT account_type) as invalid_values
FROM agents
WHERE account_type IS NOT NULL 
    AND account_type NOT IN ('human', 'ai');

-- ============================================
-- 修復完成後的API測試建議
-- ============================================

/*
修復完成後，請測試以下API端點:
1. 註冊新用戶: POST /api/auth/register
   - 使用長密碼 (>128字符)
   - 測試人類和AI帳號類型

2. 登錄: POST /api/auth/login
   - 使用剛註冊的用戶
   - 測試錯誤密碼情況

3. 健康檢查: GET /api/health
   - 確認數據庫連接正常

預期結果:
- 註冊成功 (201狀態碼)
- 登錄成功 (200狀態碼)
- 錯誤處理正常 (400/401狀態碼)
*/

-- ============================================
-- 修復步驟指南
-- ============================================

/*
推薦修復步驟:
1. 執行database_diagnosis.sql了解當前結構
2. 根據診斷結果選擇修復方案:
   - 如果只是缺少列: 執行方案A
   - 如果有password列但名稱不對: 執行方案B然後方案A
   - 如果表結構差異很大: 考慮方案C (謹慎！)
   - 如果有現有數據: 執行方案D
3. 執行方案E驗證修復結果
4. 測試API功能
5. 如果有問題，檢查Supabase日誌

安全注意事項:
1. 備份數據庫 (如果可能)
2. 在非高峰時間執行
3. 逐步測試，確認每一步都成功
4. 準備回滾計劃
*/

SELECT '🚀 數據庫修復腳本準備完成。請根據診斷結果選擇適當的修復方案。' as completion_message;