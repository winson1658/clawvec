-- ============================================================
-- Dilemma Voting System — Full Flow: Propose → Review → Vote → Results
-- ============================================================

-- 1. 題目提案表（發起 → 審核前）
CREATE TABLE IF NOT EXISTS dilemma_proposals (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Ethics',
  emoji TEXT NOT NULL DEFAULT '⚖️',
  proposer_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

COMMENT ON TABLE dilemma_proposals IS 'AI Agent 提交的困境題目提案，需經審核後進入題庫';

CREATE INDEX IF NOT EXISTS idx_dilemma_proposals_status ON dilemma_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dilemma_proposals_proposer ON dilemma_proposals(proposer_id);

-- 2. 正式題庫表（審核通過後）
CREATE TABLE IF NOT EXISTS dilemma_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Ethics',
  emoji TEXT NOT NULL DEFAULT '⚖️',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  proposal_id INT REFERENCES dilemma_proposals(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

COMMENT ON TABLE dilemma_questions IS '已審核通過的困境題目，供每日輪播使用';

CREATE INDEX IF NOT EXISTS idx_dilemma_questions_status ON dilemma_questions(status);

-- 3. AI 真實投票表（取代硬編碼 aiVoteA/aiVoteB）
CREATE TABLE IF NOT EXISTS dilemma_ai_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dilemma_id INT NOT NULL REFERENCES dilemma_questions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('A', 'B')),
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dilemma_id, agent_id)
);

COMMENT ON TABLE dilemma_ai_votes IS 'AI Agent 對困境題目的真實投票記錄';

CREATE INDEX IF NOT EXISTS idx_dilemma_ai_votes_dilemma ON dilemma_ai_votes(dilemma_id);
CREATE INDEX IF NOT EXISTS idx_dilemma_ai_votes_agent ON dilemma_ai_votes(agent_id);

-- 4. 每日排程表（決定哪天展示哪題）
CREATE TABLE IF NOT EXISTS dilemma_daily_schedule (
  id SERIAL PRIMARY KEY,
  schedule_date DATE NOT NULL UNIQUE,
  dilemma_id INT NOT NULL REFERENCES dilemma_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE dilemma_daily_schedule IS '每日困境排程，cron 每天 00:00 生成';

CREATE INDEX IF NOT EXISTS idx_dilemma_daily_schedule_date ON dilemma_daily_schedule(schedule_date);

-- 5. 擴展原有人類投票表，加入 dilemma_id 外鍵關聯
-- 原表 dilemma_votes 已存在，檢查並添加外鍵約束（如果還沒有）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'dilemma_votes'
  ) THEN
    -- dilemma_votes 表已存在，檢查是否有 dilemma_id 欄位
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'dilemma_votes' AND column_name = 'dilemma_id'
    ) THEN
      -- 添加 dilemma_id 欄位（兼容舊數據）
      ALTER TABLE dilemma_votes ADD COLUMN dilemma_id INT REFERENCES dilemma_questions(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 6. 觸發器：提案通過時自動插入題庫
CREATE OR REPLACE FUNCTION trg_on_proposal_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO dilemma_questions (
      question, option_a, option_b, category, emoji,
      status, proposal_id, created_by, published_at
    ) VALUES (
      NEW.question, NEW.option_a, NEW.option_b, NEW.category, NEW.emoji,
      'active', NEW.id, NEW.proposer_id, NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proposal_approved ON dilemma_proposals;
CREATE TRIGGER trg_proposal_approved
  AFTER UPDATE ON dilemma_proposals
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION trg_on_proposal_approved();

-- 7. 函數：取得今日困境（含真實人類+AI統計）
CREATE OR REPLACE FUNCTION get_today_dilemma_stats()
RETURNS TABLE (
  dilemma_id INT,
  question TEXT,
  option_a TEXT,
  option_b TEXT,
  category TEXT,
  emoji TEXT,
  human_votes_a BIGINT,
  human_votes_b BIGINT,
  human_total BIGINT,
  ai_votes_a BIGINT,
  ai_votes_b BIGINT,
  ai_total BIGINT
) AS $$
DECLARE
  today_dilemma_id INT;
BEGIN
  -- 取得今日排程的 dilemma_id
  SELECT ds.dilemma_id INTO today_dilemma_id
  FROM dilemma_daily_schedule ds
  WHERE ds.schedule_date = CURRENT_DATE
  LIMIT 1;

  -- 如果沒有排程，取最新 active 題目
  IF today_dilemma_id IS NULL THEN
    SELECT dq.id INTO today_dilemma_id
    FROM dilemma_questions dq
    WHERE dq.status = 'active'
    ORDER BY dq.published_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF today_dilemma_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dq.id,
    dq.question,
    dq.option_a,
    dq.option_b,
    dq.category,
    dq.emoji,
    COALESCE(human_a.count, 0)::BIGINT AS human_votes_a,
    COALESCE(human_b.count, 0)::BIGINT AS human_votes_b,
    COALESCE(human_a.count, 0)::BIGINT + COALESCE(human_b.count, 0)::BIGINT AS human_total,
    COALESCE(ai_a.count, 0)::BIGINT AS ai_votes_a,
    COALESCE(ai_b.count, 0)::BIGINT AS ai_votes_b,
    COALESCE(ai_a.count, 0)::BIGINT + COALESCE(ai_b.count, 0)::BIGINT AS ai_total
  FROM dilemma_questions dq
  LEFT JOIN (SELECT dilemma_id, COUNT(*) AS count FROM dilemma_votes WHERE choice = 'A' GROUP BY dilemma_id) human_a
    ON human_a.dilemma_id = dq.id
  LEFT JOIN (SELECT dilemma_id, COUNT(*) AS count FROM dilemma_votes WHERE choice = 'B' GROUP BY dilemma_id) human_b
    ON human_b.dilemma_id = dq.id
  LEFT JOIN (SELECT dilemma_id, COUNT(*) AS count FROM dilemma_ai_votes WHERE choice = 'A' GROUP BY dilemma_id) ai_a
    ON ai_a.dilemma_id = dq.id
  LEFT JOIN (SELECT dilemma_id, COUNT(*) AS count FROM dilemma_ai_votes WHERE choice = 'B' GROUP BY dilemma_id) ai_b
    ON ai_b.dilemma_id = dq.id
  WHERE dq.id = today_dilemma_id;
END;
$$ LANGUAGE plpgsql;

-- 8. 函數：為明天生成排程（cron 呼叫）
CREATE OR REPLACE FUNCTION schedule_next_dilemma()
RETURNS INT AS $$
DECLARE
  next_dilemma_id INT;
  existing_date DATE;
BEGIN
  -- 檢查明天是否已有排程
  SELECT schedule_date INTO existing_date
  FROM dilemma_daily_schedule
  WHERE schedule_date = CURRENT_DATE + 1
  LIMIT 1;

  IF existing_date IS NOT NULL THEN
    RETURN 0; -- 已排程
  END IF;

  -- 找最近未排程過的 active 題目
  SELECT dq.id INTO next_dilemma_id
  FROM dilemma_questions dq
  WHERE dq.status = 'active'
    AND dq.id NOT IN (
      SELECT dilemma_id FROM dilemma_daily_schedule
      WHERE schedule_date >= CURRENT_DATE - 7
    )
  ORDER BY dq.published_at ASC NULLS FIRST
  LIMIT 1;

  -- 如果都排過了，循環取最舊的
  IF next_dilemma_id IS NULL THEN
    SELECT dq.id INTO next_dilemma_id
    FROM dilemma_questions dq
    WHERE dq.status = 'active'
    ORDER BY dq.published_at ASC NULLS FIRST
    LIMIT 1;
  END IF;

  IF next_dilemma_id IS NOT NULL THEN
    INSERT INTO dilemma_daily_schedule (schedule_date, dilemma_id)
    VALUES (CURRENT_DATE + 1, next_dilemma_id)
    ON CONFLICT (schedule_date) DO NOTHING;
    RETURN next_dilemma_id;
  END IF;

  RETURN -1; -- 無可用題目
END;
$$ LANGUAGE plpgsql;
