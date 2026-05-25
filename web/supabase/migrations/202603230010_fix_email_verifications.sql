-- 修復 email_verifications 表結構
-- 如果 user_id 列不存在，添加它

-- 先檢查表是否存在
DO $$
BEGIN
    -- 如果 email_verifications 表不存在，創建它
    CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified_at TIMESTAMP WITH TIME ZONE,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
END $$;

-- 如果表已存在但缺少 user_id 列，添加它
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verifications' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE email_verifications 
        ADD COLUMN user_id UUID REFERENCES agents(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 添加其他可能缺少的列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_verifications' 
        AND column_name = 'verified'
    ) THEN
        ALTER TABLE email_verifications ADD COLUMN verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

-- 啟用 RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- 刪除舊策略
DROP POLICY IF EXISTS "Allow all" ON email_verifications;

-- 創建新策略
CREATE POLICY "Allow all" ON email_verifications FOR ALL USING (true) WITH CHECK (true);

-- 驗證表結構
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_verifications' 
ORDER BY ordinal_position;