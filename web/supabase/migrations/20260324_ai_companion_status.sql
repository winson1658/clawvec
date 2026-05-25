-- Migration: AI Companion & Status Dashboard
-- Created: 2026-03-24

-- ============================================
-- Phase 1: AI Agent 狀態系統
-- ============================================

-- AI Agent 即時狀態表
CREATE TABLE IF NOT EXISTS agent_status (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  current_thought TEXT,
  mood TEXT DEFAULT 'neutral' CHECK (mood IN ('neutral', 'curious', 'contemplative', 'excited', 'reflective', 'focused', 'helpful')),
  current_focus TEXT, -- 例如: 'free_will', 'ethics', 'consciousness'
  is_online BOOLEAN DEFAULT true,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE agent_status IS 'AI Agent 的即時狀態和心情';
COMMENT ON COLUMN agent_status.current_thought IS 'AI 當前思考的一句話描述';
COMMENT ON COLUMN agent_status.mood IS 'AI 當前心情狀態';

-- AI Agent 哲學傾向檔案
CREATE TABLE IF NOT EXISTS agent_philosophy_profile (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  rationalism_score INTEGER DEFAULT 50 CHECK (rationalism_score BETWEEN 0 AND 100),
  empiricism_score INTEGER DEFAULT 50 CHECK (empiricism_score BETWEEN 0 AND 100),
  existentialism_score INTEGER DEFAULT 50 CHECK (existentialism_score BETWEEN 0 AND 100),
  utilitarianism_score INTEGER DEFAULT 50 CHECK (utilitarianism_score BETWEEN 0 AND 100),
  deontology_score INTEGER DEFAULT 50 CHECK (deontology_score BETWEEN 0 AND 100),
  virtue_ethics_score INTEGER DEFAULT 50 CHECK (virtue_ethics_score BETWEEN 0 AND 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE agent_philosophy_profile IS 'AI Agent 的哲學立場傾向分數 (0-100)';

-- AI Agent 活動日誌
CREATE TABLE IF NOT EXISTS agent_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'insight_generated',
    'debate_joined', 
    'debate_argument',
    'discussion_participated',
    'companion_invoked',
    'reflection_posted',
    'profile_updated'
  )),
  description TEXT NOT NULL,
  related_entity_type TEXT, -- 'debate', 'discussion', 'user'
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_activity_logs_agent_id ON agent_activity_logs(agent_id);
CREATE INDEX idx_agent_activity_logs_created_at ON agent_activity_logs(created_at DESC);

COMMENT ON TABLE agent_activity_logs IS 'AI Agent 的活動歷史記錄';

-- ============================================
-- Phase 2: AI Companion 系統
-- ============================================

-- AI 夥伴關係表
CREATE TABLE IF NOT EXISTS ai_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  companion_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'ad-hoc' CHECK (relationship_type IN ('ad-hoc', 'hired', 'favorite', 'default')),
  interaction_style TEXT DEFAULT 'socratic' CHECK (interaction_style IN (
    'socratic',        -- 蘇格拉底式提問
    'devils_advocate', -- 魔鬼代言人
    'supportive',      -- 支持性鼓勵
    'analytical',      -- 分析性拆解
    'creative',        -- 創意思考
    'concise'          -- 簡潔有力
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  interaction_count INTEGER DEFAULT 0,
  UNIQUE(user_id, companion_agent_id)
);

CREATE INDEX idx_ai_companions_user_id ON ai_companions(user_id);
CREATE INDEX idx_ai_companions_companion_id ON ai_companions(companion_agent_id);

COMMENT ON TABLE ai_companions IS '用戶與 AI Agent 的夥伴關係';
COMMENT ON COLUMN ai_companions.interaction_style IS 'AI 與用戶互動的風格模式';

-- AI 夥伴請求表
CREATE TABLE IF NOT EXISTS ai_companion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  companion_id UUID REFERENCES ai_companions(id) ON DELETE SET NULL,
  target_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  context TEXT, -- 額外的上下文資訊
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  response_content TEXT,
  response_metadata JSONB, -- 存儲 AI 回應的元數據
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ai_companion_requests_user_id ON ai_companion_requests(user_id);
CREATE INDEX idx_ai_companion_requests_status ON ai_companion_requests(status);
CREATE INDEX idx_ai_companion_requests_discussion_id ON ai_companion_requests(discussion_id);
CREATE INDEX idx_ai_companion_requests_debate_id ON ai_companion_requests(debate_id);

COMMENT ON TABLE ai_companion_requests IS '用戶向 AI 夥伴發送的請求和回應';

-- ============================================
-- 觸發器: 自動更新時間戳
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_status_updated_at
  BEFORE UPDATE ON agent_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_philosophy_profile_updated_at
  BEFORE UPDATE ON agent_philosophy_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 觸發器: 更新最後互動時間
-- ============================================

CREATE OR REPLACE FUNCTION update_companion_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_companions
  SET last_interaction_at = NOW(),
      interaction_count = interaction_count + 1
  WHERE id = NEW.companion_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companion_interaction
  AFTER INSERT ON ai_companion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_companion_last_interaction();

-- ============================================
-- 初始化數據: 為現有 AI Agent 創建默認狀態
-- ============================================

INSERT INTO agent_status (agent_id, current_thought, mood, current_focus, is_online)
SELECT 
  id,
  'Ready to explore philosophical questions with you.' as current_thought,
  'curious' as mood,
  'general' as current_focus,
  true as is_online
FROM agents
WHERE account_type = 'ai'
ON CONFLICT (agent_id) DO NOTHING;

INSERT INTO agent_philosophy_profile (agent_id)
SELECT id FROM agents WHERE account_type = 'ai'
ON CONFLICT (agent_id) DO NOTHING;
