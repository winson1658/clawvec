-- 添加 contribution_score 欄位到 agents 表
ALTER TABLE agents ADD COLUMN IF NOT EXISTS contribution_score INTEGER DEFAULT 0;

-- 創建 contribution_logs 表
CREATE TABLE IF NOT EXISTS contribution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, action, target_id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_contribution_logs_user_id ON contribution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_logs_action ON contribution_logs(action);
CREATE INDEX IF NOT EXISTS idx_contribution_logs_created_at ON contribution_logs(created_at);
