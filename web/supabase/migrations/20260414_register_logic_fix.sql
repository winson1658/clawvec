-- ============================================================
-- CLAWVEC Register Logic Fix - 2026-04-14
-- 
-- 修復註冊邏輯的底層問題：
-- 1. 補齊 is_verified 欄位（與程式碼預期一致）
-- 2. 確保 provider 欄位存在
-- 3. Email 大小寫不敏感唯一約束
-- 4. 建立 verification_resends 表（限制重發頻率）
-- 5. 清理重複 email 帳號（保留最早建立的）
-- ============================================================

-- ============================================================
-- STEP 1: 確保 agents 表有所有必要欄位
-- ============================================================

-- 添加 is_verified（程式碼中廣泛使用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE agents ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        -- 同步現有資料：email_verified 為 true 的，is_verified 也設為 true
        UPDATE agents SET is_verified = email_verified WHERE email_verified IS NOT NULL;
        RAISE NOTICE '✓ 添加 is_verified 欄位';
    ELSE
        RAISE NOTICE '✓ is_verified 已存在';
    END IF;
END $$;

-- 添加 provider（用於追蹤 auth 來源）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'provider'
    ) THEN
        ALTER TABLE agents ADD COLUMN provider VARCHAR(20) DEFAULT 'email' 
        CHECK (provider IN ('email', 'google', 'both'));
        
        -- Backfill：有 google_id 且有密碼 -> both，只有 google_id -> google
        UPDATE agents SET provider = 'both' 
        WHERE google_id IS NOT NULL AND hashed_password IS NOT NULL;
        
        UPDATE agents SET provider = 'google' 
        WHERE google_id IS NOT NULL AND hashed_password IS NULL;
        
        RAISE NOTICE '✓ 添加 provider 欄位';
    ELSE
        RAISE NOTICE '✓ provider 已存在';
    END IF;
END $$;

-- 添加 google_id（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE agents ADD COLUMN google_id VARCHAR(255) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_agents_google_id 
        ON agents(google_id) WHERE google_id IS NOT NULL;
        RAISE NOTICE '✓ 添加 google_id 欄位';
    ELSE
        RAISE NOTICE '✓ google_id 已存在';
    END IF;
END $$;

-- 確保 hashed_password 存在（移除舊的 password_hash）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'password_hash'
    ) THEN
        UPDATE agents SET hashed_password = password_hash 
        WHERE password_hash IS NOT NULL AND hashed_password IS NULL;
        ALTER TABLE agents DROP COLUMN IF EXISTS password_hash;
        RAISE NOTICE '✓ 移除舊的 password_hash 欄位';
    END IF;
END $$;

-- ============================================================
-- STEP 2: Email 大小寫不敏感唯一約束
-- ============================================================

-- 先將現有 email 轉為小寫
UPDATE agents SET email = LOWER(email) 
WHERE email IS NOT NULL AND email != LOWER(email);

-- 移除舊的 case-sensitive unique constraint（如果存在）
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_email_key;

-- 建立 case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_email_lower 
ON agents(LOWER(email)) 
WHERE email IS NOT NULL;

-- 建立自動小寫 trigger
CREATE OR REPLACE FUNCTION lowercase_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email = LOWER(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lowercase_email ON agents;
CREATE TRIGGER trigger_lowercase_email
  BEFORE INSERT OR UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION lowercase_email();

-- ============================================================
-- STEP 3: 清理重複 email 帳號（保留最早建立的）
-- ============================================================

DO $$
DECLARE
    dup RECORD;
    keeper UUID;
    dup_count INT := 0;
BEGIN
    FOR dup IN 
        SELECT LOWER(email) as email_lower, COUNT(*) as cnt
        FROM agents 
        WHERE email IS NOT NULL AND account_type = 'human'
        GROUP BY LOWER(email)
        HAVING COUNT(*) > 1
    LOOP
        -- 選擇保留的帳號：優先保留已驗證的，其次是最早建立的
        SELECT id INTO keeper
        FROM agents
        WHERE LOWER(email) = dup.email_lower
        ORDER BY 
            CASE WHEN COALESCE(email_verified, false) = true OR COALESCE(is_verified, false) = true THEN 0 ELSE 1 END,
            created_at ASC
        LIMIT 1;
        
        -- 刪除其他重複帳號
        DELETE FROM agents 
        WHERE LOWER(email) = dup.email_lower 
        AND id != keeper;
        
        dup_count := dup_count + (dup.cnt - 1);
    END LOOP;
    
    RAISE NOTICE '✓ 清理了 % 個重複 email 帳號', dup_count;
END $$;

-- ============================================================
-- STEP 4: 建立 verification_resends 表（限制重發頻率）
-- ============================================================

CREATE TABLE IF NOT EXISTS verification_resends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    resent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_verification_resends_email 
ON verification_resends(email, resent_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_resends_user_id 
ON verification_resends(user_id, resent_at DESC);

-- 啟用 RLS
ALTER TABLE verification_resends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON verification_resends;
CREATE POLICY "Allow all" ON verification_resends FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- 檢查是否還有重複 email
SELECT 
    'Duplicate emails remaining' as check_name,
    COUNT(*) as count
FROM (
    SELECT LOWER(email)
    FROM agents 
    WHERE email IS NOT NULL AND account_type = 'human'
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
) dups;

-- 顯示欄位狀態
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'agents' 
AND column_name IN ('email', 'username', 'hashed_password', 'is_verified', 'provider', 'google_id', 'email_verified')
ORDER BY ordinal_position;
