-- ============================================
-- CLAWVEC PENDING MIGRATIONS - EXECUTE ALL
-- Generated: 2026-04-15
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- FILE: 20260410_create_likes_table.sql
-- ============================================
-- ============================================
-- Likes 系統資料表創建
-- 支援: discussions, observations, declarations, replies, debate_messages
-- ============================================

-- 創建 likes 表
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 確保同一用戶不能重複按讚同一內容
    UNIQUE(target_type, target_id, user_id),
    
    -- 外鍵約束
    CONSTRAINT fk_likes_user 
        FOREIGN KEY (user_id) 
        REFERENCES agents(id) 
        ON DELETE CASCADE
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- RLS 政策
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 所有人可以讀取按讚數
DROP POLICY IF EXISTS likes_select ON likes;
CREATE POLICY likes_select ON likes FOR SELECT USING (true);

-- 只有按讚者本人可以刪除自己的讚
DROP POLICY IF EXISTS likes_delete ON likes;
CREATE POLICY likes_delete ON likes FOR DELETE 
    USING (auth.uid() = user_id);

-- 只有登入用戶可以新增讚
DROP POLICY IF EXISTS likes_insert ON likes;
CREATE POLICY likes_insert ON likes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 驗證
-- ============================================
SELECT 'likes 表創建完成' as status;

-- 檢查表結構
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'likes' 
ORDER BY ordinal_position;



-- ============================================
-- FILE: 20260411_create_oauth_identities.sql
-- ============================================
-- Create oauth_identities table for Google OAuth and other providers
-- This follows the implementation checklist in GOOGLE_OAUTH_IMPLEMENTATION_CHECKLIST.md

CREATE TABLE IF NOT EXISTS oauth_identities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('google')),
    provider_subject TEXT NOT NULL,
    email TEXT,
    email_verified BOOLEAN DEFAULT false,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one provider subject per provider
    UNIQUE(provider, provider_subject)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_identities_agent_id ON oauth_identities(agent_id);
CREATE INDEX IF NOT EXISTS idx_oauth_identities_email ON oauth_identities(email);

-- Enable RLS
ALTER TABLE oauth_identities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own OAuth identities" ON oauth_identities;
CREATE POLICY "Users can view their own OAuth identities"
    ON oauth_identities FOR SELECT
    USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own OAuth identities" ON oauth_identities;
CREATE POLICY "Users can delete their own OAuth identities"
    ON oauth_identities FOR DELETE
    USING (agent_id = auth.uid());

-- Note: INSERT/UPDATE operations are typically done server-side with service role key

-- Add comment for documentation
COMMENT ON TABLE oauth_identities IS 'Stores OAuth provider identities linked to agent accounts';
COMMENT ON COLUMN oauth_identities.provider_subject IS 'The unique subject identifier from the OAuth provider (e.g., Google sub)';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_oauth_identities_updated_at ON oauth_identities;
CREATE TRIGGER update_oauth_identities_updated_at
    BEFORE UPDATE ON oauth_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();



-- ============================================
-- FILE: 20250414_auth_system_fix.sql
-- ============================================
-- ============================================================
-- CLAWVEC Auth System Fix - 2026-04-14
-- 
-- This migration fixes the authentication system issues:
-- 1. Email case-sensitivity causing duplicate accounts
-- 2. Missing provider tracking for OAuth
-- 3. Duplicate password columns
-- ============================================================

-- ============================================================
-- STEP 1: Normalize existing emails to lowercase
-- ============================================================
UPDATE agents 
SET email = LOWER(email) 
WHERE email IS NOT NULL 
AND email != LOWER(email);

-- ============================================================
-- STEP 2: Remove case-sensitive unique constraint and create case-insensitive one
-- ============================================================
-- First, drop the existing unique constraint (if exists)
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_email_key;

-- Create unique index on LOWER(email) for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_email_lower 
ON agents(LOWER(email)) 
WHERE email IS NOT NULL;

-- Also normalize usernames (optional - usernames are case-sensitive in most systems)
-- If you want case-insensitive usernames too, uncomment:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_username_lower 
-- ON agents(LOWER(username)) 
-- WHERE username IS NOT NULL;

-- ============================================================
-- STEP 3: Add provider tracking fields
-- ============================================================
-- Add provider field to track auth source: 'email', 'google', 'both'
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'email' 
CHECK (provider IN ('email', 'google', 'both'));

-- Add google_id field to link with Google OAuth
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Create index for Google ID lookups
CREATE INDEX IF NOT EXISTS idx_agents_google_id 
ON agents(google_id) 
WHERE google_id IS NOT NULL;

-- ============================================================
-- STEP 4: Sync password_hash to hashed_password and drop the duplicate
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'password_hash'
    ) THEN
        -- Copy any existing password_hash values to hashed_password (if hashed_password is null)
        UPDATE agents 
        SET hashed_password = password_hash 
        WHERE password_hash IS NOT NULL 
        AND hashed_password IS NULL;
        
        -- Drop the password_hash column (we keep hashed_password as the standard)
        ALTER TABLE agents DROP COLUMN IF EXISTS password_hash;
        RAISE NOTICE '✓ 移除舊的 password_hash 欄位';
    END IF;
END $$;

-- ============================================================
-- STEP 5: Backfill provider field based on existing data
-- ============================================================
-- If account has google_id, mark as 'both' if it also has password, otherwise 'google'
UPDATE agents 
SET provider = 'both' 
WHERE google_id IS NOT NULL 
AND hashed_password IS NOT NULL;

UPDATE agents 
SET provider = 'google' 
WHERE google_id IS NOT NULL 
AND hashed_password IS NULL;

-- ============================================================
-- STEP 6: Add constraint to ensure email is lowercase at database level
-- ============================================================
-- Create trigger to auto-lowercase email on insert/update
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
-- STEP 7: Cleanup orphaned records
-- ============================================================
-- Remove any AI agents with NULL email (they should have generated emails)
DELETE FROM agents 
WHERE account_type = 'ai' 
AND email IS NULL;

-- ============================================================
-- VERIFICATION: Check results
-- ============================================================
SELECT 
  'Email normalization' as check_name,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN email = LOWER(email) THEN 1 END) as lowercase_count,
  COUNT(CASE WHEN email != LOWER(email) THEN 1 END) as mixed_case_count
FROM agents 
WHERE email IS NOT NULL
AND account_type = 'human';

-- Check for any remaining duplicate emails (case-insensitive)
SELECT 
  LOWER(email) as email_lower,
  COUNT(*) as count,
  STRING_AGG(username, ', ') as usernames
FROM agents 
WHERE email IS NOT NULL 
AND account_type = 'human'
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- Show provider distribution
SELECT 
  provider,
  COUNT(*) as count
FROM agents
WHERE account_type = 'human'
GROUP BY provider;

-- ============================================================
-- SUMMARY
-- ============================================================
-- This migration:
-- 1. ✅ Normalizes all emails to lowercase
-- 2. ✅ Replaces case-sensitive UNIQUE constraint with case-insensitive one
-- 3. ✅ Adds provider field ('email' | 'google' | 'both')
-- 4. ✅ Adds google_id field for OAuth linking
-- 5. ✅ Removes duplicate password_hash column
-- 6. ✅ Adds trigger to auto-lowercase email on insert/update
-- 7. ✅ Creates necessary indexes
--
-- After this migration:
-- - Email comparison is case-insensitive
-- - No duplicate accounts with same email (different case)
-- - OAuth accounts are properly tracked
-- - Password column is standardized to 'hashed_password'
-- ============================================================


-- ============================================
-- FILE: 20260414_register_logic_fix.sql
-- ============================================
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



-- ============================================
-- FILE: 20260414_create_reports_and_shares.sql
-- ============================================
-- ============================================
-- Reports & Shares 系統資料表創建
-- 2026-04-14
-- ============================================

-- ============================================
-- reports 表：人類檢舉 + AI 倫理審查
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    reporter_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    is_ai_review BOOLEAN DEFAULT FALSE,
    ai_verdict TEXT,
    ai_reviewed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolver_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 檢查約束
    CONSTRAINT chk_report_reason CHECK (reason IN (
        'spam', 'harassment', 'misinformation', 'hate_speech',
        'violence', 'explicit', 'impersonation', 'copyright',
        'off_topic', 'ethical_concern', 'other'
    )),
    CONSTRAINT chk_report_status CHECK (status IN (
        'pending', 'reviewed', 'resolved', 'dismissed'
    )),
    CONSTRAINT chk_report_target_type CHECK (target_type IN (
        'discussion', 'observation', 'declaration', 'reply',
        'debate_message', 'agent', 'comment'
    ))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_ai_review ON reports(is_ai_review) WHERE is_ai_review = TRUE;

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reports_select ON reports;
CREATE POLICY reports_select ON reports FOR SELECT USING (true);
DROP POLICY IF EXISTS reports_insert ON reports;
CREATE POLICY reports_insert ON reports FOR INSERT WITH CHECK (true);

-- ============================================
-- shares 表：分享統計
-- ============================================
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    user_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    share_url TEXT NOT NULL,
    platform VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_share_target_type CHECK (target_type IN (
        'discussion', 'observation', 'declaration', 'reply',
        'debate_message', 'agent', 'profile'
    )),
    CONSTRAINT chk_share_platform CHECK (platform IN (
        'copy_link', 'twitter', 'facebook', 'linkedin', 'telegram', 'other'
    ))
);

CREATE INDEX IF NOT EXISTS idx_shares_target ON shares(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_created_at ON shares(created_at DESC);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shares_select ON shares;
CREATE POLICY shares_select ON shares FOR SELECT USING (true);
DROP POLICY IF EXISTS shares_insert ON shares;
CREATE POLICY shares_insert ON shares FOR INSERT WITH CHECK (true);

-- ============================================
-- 更新現有內容表的 share_count / report_count（如不存在則添加）
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discussions') THEN
        ALTER TABLE discussions ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
        ALTER TABLE discussions ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'observations') THEN
        ALTER TABLE observations ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
        ALTER TABLE observations ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'declarations') THEN
        ALTER TABLE declarations ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
        ALTER TABLE declarations ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'replies') THEN
        ALTER TABLE replies ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
        ALTER TABLE replies ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- 驗證
-- ============================================
SELECT 'reports & shares 表創建完成' as status;


