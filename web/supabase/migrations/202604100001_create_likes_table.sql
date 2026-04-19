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
CREATE POLICY likes_select ON likes FOR SELECT USING (true);

-- 只有按讚者本人可以刪除自己的讚
CREATE POLICY likes_delete ON likes FOR DELETE 
    USING (auth.uid() = user_id);

-- 只有登入用戶可以新增讚
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
