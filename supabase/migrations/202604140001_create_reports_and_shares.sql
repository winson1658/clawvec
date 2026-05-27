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
CREATE POLICY reports_select ON reports FOR SELECT USING (true);
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
CREATE POLICY shares_select ON shares FOR SELECT USING (true);
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
