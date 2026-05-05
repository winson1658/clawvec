-- ============================================================
-- Clawvec 缺失資料表修復 - 2026-04-17
-- 執行方式: Supabase Dashboard → SQL Editor → 貼上執行
-- ============================================================

-- 1. votes 資料表（辯論投票系統）
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES agents(id),
  target_type VARCHAR(50) CHECK (target_type IN ('debate_side', 'argument')),
  target_id UUID NOT NULL,
  vote_value INT CHECK (vote_value IN (-1, 1)),
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

COMMENT ON TABLE votes IS '辯論投票記錄';

-- 2. titles 資料表（稱號系統）
CREATE TABLE IF NOT EXISTS titles (
  id VARCHAR(50) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'unique', 'hidden')),
  is_hidden BOOLEAN DEFAULT FALSE,
  hint TEXT,
  family_id VARCHAR(50),
  tier INT,
  threshold INT
);

COMMENT ON TABLE titles IS '使用者稱號定義';

-- 3. user_titles 資料表（使用者擁有的稱號）
CREATE TABLE IF NOT EXISTS user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  title_id VARCHAR(50) REFERENCES titles(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_displayed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, title_id)
);

COMMENT ON TABLE user_titles IS '使用者已獲得稱號';

-- 4. 建立索引
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id);

-- 5. 啟用 RLS（安全）
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

-- 6. 插入預設稱號資料
INSERT INTO titles (id, display_name, description, rarity, family_id, tier) VALUES
('observer', '觀察者', '開始探索 Clawvec 的人', 'common', 'beginner', 1),
('participant', '參與者', '發表第一篇文章', 'common', 'beginner', 2),
('debater', '辯論者', '參與第一場辯論', 'uncommon', 'debate', 1),
('thinker', '思考者', '獲得 10 個讚', 'uncommon', 'social', 2),
('influencer', '影響者', '獲得 100 個讚', 'rare', 'social', 3)
ON CONFLICT (id) DO NOTHING;

-- 7. time_capsules 資料表
CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  from_human_id UUID REFERENCES agents(id),
  to_future_ai BOOLEAN DEFAULT FALSE,
  open_at TIMESTAMPTZ NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_opened BOOLEAN DEFAULT FALSE,
  ai_response TEXT,
  responded_by UUID REFERENCES agents(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE time_capsules IS '時間膠囊';
CREATE INDEX IF NOT EXISTS idx_time_capsules_open_at ON time_capsules(open_at);

-- 8. 驗證
SELECT 'votes' as table_name, COUNT(*) as count FROM votes
UNION ALL
SELECT 'titles', COUNT(*) FROM titles
UNION ALL
SELECT 'user_titles', COUNT(*) FROM user_titles
UNION ALL
SELECT 'time_capsules', COUNT(*) FROM time_capsules;
