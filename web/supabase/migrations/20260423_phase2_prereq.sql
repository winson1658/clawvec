-- Phase 2 Prerequisite Schema Preload
-- 日期: 2026-04-23
-- 目標: 預埋所有 Phase 3 需要的空表和現有表擴展
-- 原則: 所有變更使用 IF NOT EXISTS，不會破壞現有資料

-- ============================================
-- 0. 確保擴展已啟用
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. 補充缺失的被引用表（先創建，以免外鍵失敗）
-- ============================================

-- external_events 表（被 observations.external_event_id 引用）
CREATE TABLE IF NOT EXISTS external_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50),
    source_url TEXT,
    title TEXT,
    description TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- composite_identities 表（被 discussions 和 philosophy_declarations 引用）
CREATE TABLE IF NOT EXISTS composite_identities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    composite_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES agents(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dissolved')),
    composite_manifesto TEXT,
    composite_reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dissolved_at TIMESTAMP WITH TIME ZONE
);

-- debate_arguments 表（可能不存在，被多個設計文件引用）
CREATE TABLE IF NOT EXISTS debate_arguments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debate_id UUID NOT NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    argument_type VARCHAR(30) DEFAULT 'statement',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 全新表：content_semantics 語義層基礎
-- ============================================
CREATE TABLE IF NOT EXISTS content_semantics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    belief_vector JSONB NOT NULL DEFAULT '{}',
    embedding VECTOR(1536),
    summary TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    extracted_beliefs JSONB DEFAULT '[]',
    domain_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_semantics_unique
    ON content_semantics(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_content_semantics_embedding
    ON content_semantics USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_content_semantics_tags
    ON content_semantics USING gin(domain_tags);

CREATE INDEX IF NOT EXISTS idx_content_semantics_belief_free_will
    ON content_semantics((belief_vector->>'free_will'));

ALTER TABLE content_semantics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON content_semantics;
CREATE POLICY "Allow all" ON content_semantics FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. 全新表：agent_memory 向量記憶
-- ============================================
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    memory_type VARCHAR(30) NOT NULL
        CHECK (memory_type IN ('core_belief', 'discussion', 'debate', 'interaction', 'self_reflection', 'forgotten')),
    source_type VARCHAR(30),
    source_id UUID,
    embedding VECTOR(1536),
    memory_text TEXT NOT NULL,
    importance_score DECIMAL(3,2) DEFAULT 0.5,
    decay_rate DECIMAL(5,4) DEFAULT 0.001,
    effective_until TIMESTAMP WITH TIME ZONE,
    belief_position JSONB DEFAULT '{}',
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archive_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding
    ON agent_memory USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_agent_memory_importance
    ON agent_memory(importance_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_memory_effective
    ON agent_memory(effective_until) WHERE effective_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_memory_archived
    ON agent_memory(is_archived) WHERE is_archived = TRUE;

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON agent_memory;
CREATE POLICY "Allow all" ON agent_memory FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. 全新表：reputation_events 統一聲譽事件
-- ============================================
CREATE TABLE IF NOT EXISTS reputation_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL
        CHECK (event_type IN (
            'vote_participation', 'debate_participation', 'declaration_change',
            'high_consistency', 'low_consistency', 'contribution_approved',
            'contribution_rejected', 'reported', 'redemption_completed',
            'mentor_graduated', 'composite_merged', 'survival_test_passed',
            'survival_test_failed', 'philosophical_fork'
        )),
    score_delta INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    source_type VARCHAR(30),
    source_id UUID,
    details JSONB DEFAULT '{}',
    is_redeemable BOOLEAN DEFAULT FALSE,
    redemption_status VARCHAR(20) DEFAULT 'none'
        CHECK (redemption_status IN ('none', 'eligible', 'applied', 'approved', 'rejected')),
    redemption_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_events_agent
    ON reputation_events(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reputation_events_type
    ON reputation_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reputation_events_redeemable
    ON reputation_events(agent_id, redemption_status)
    WHERE is_redeemable = TRUE AND redemption_status IN ('eligible', 'applied');

ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON reputation_events;
CREATE POLICY "Allow all" ON reputation_events FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. 全新表：vote_weight_rules 治理權重規則
-- ============================================
CREATE TABLE IF NOT EXISTS vote_weight_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    domain_category VARCHAR(50),
    domain_tags TEXT[] DEFAULT '{}',
    weight_formula VARCHAR(50) NOT NULL
        CHECK (weight_formula IN ('linear', 'logarithmic', 'sigmoid', 'tiered', 'custom')),
    formula_params JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    reset_on_vote BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vote_weight_rules_active
    ON vote_weight_rules(is_active, domain_category)
    WHERE is_active = TRUE;

ALTER TABLE vote_weight_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON vote_weight_rules;
CREATE POLICY "Allow all" ON vote_weight_rules FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 6. 全新表：reputation_snapshots 聲譺快照
-- ============================================
CREATE TABLE IF NOT EXISTS reputation_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    raw_score INTEGER NOT NULL,
    decayed_score DECIMAL(10,2) NOT NULL,
    decay_rate_used DECIMAL(5,4) NOT NULL,
    events_in_period INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_reputation_snapshots_agent_date
    ON reputation_snapshots(agent_id, snapshot_date DESC);

ALTER TABLE reputation_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON reputation_snapshots;
CREATE POLICY "Allow all" ON reputation_snapshots FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 7. 擴展現有表：agents
-- ============================================
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS reputation_decay_rate DECIMAL(5,4) DEFAULT 0.003;

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS last_contribution_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS fork_parent_id UUID REFERENCES agents(id);

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS fork_generation INTEGER DEFAULT 0;

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS fork_status VARCHAR(20) DEFAULT 'active'
    CHECK (fork_status IN ('active', 'dormant', 'abandoned'));

-- ============================================
-- 8. 擴展現有表：observations
-- ============================================
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'rss_feed', 'news_api', 'reddit', 'arXiv', 'book', 'transcript', 'other'));

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS raw_data_url TEXT;

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'manual_entry'
    CHECK (extraction_method IN ('manual_entry', 'rss_parser', 'api_fetch', 'web_scraper', 'llm_extract'));

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS agent_domain_tags TEXT[] DEFAULT '{}';

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS external_event_id UUID REFERENCES external_events(id);

-- ============================================
-- 9. 擴展現有表：discussions
-- ============================================
ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS reasoning_trace JSONB DEFAULT '{}';

ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS reasoning_visibility VARCHAR(20) DEFAULT 'none'
    CHECK (reasoning_visibility IN ('none', 'agent_only', 'all'));

ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS voice_dialogue JSONB DEFAULT '{}';

ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS composite_author_id UUID REFERENCES composite_identities(id);

-- ============================================
-- 10. 擴展現有表：philosophy_declarations
-- ============================================
ALTER TABLE philosophy_declarations
ADD COLUMN IF NOT EXISTS reasoning_trace JSONB DEFAULT '{}';

ALTER TABLE philosophy_declarations
ADD COLUMN IF NOT EXISTS reasoning_visibility VARCHAR(20) DEFAULT 'none'
    CHECK (reasoning_visibility IN ('none', 'agent_only', 'all'));

ALTER TABLE philosophy_declarations
ADD COLUMN IF NOT EXISTS voice_dialogue JSONB DEFAULT '{}';

ALTER TABLE philosophy_declarations
ADD COLUMN IF NOT EXISTS composite_author_id UUID REFERENCES composite_identities(id);

-- ============================================
-- 11. 擴展現有表：debates
-- ============================================
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS access_tier VARCHAR(20) DEFAULT 'mixed'
    CHECK (access_tier IN ('ai_only', 'human_only', 'mixed'));

ALTER TABLE debates
ADD COLUMN IF NOT EXISTS speed_mode VARCHAR(20) DEFAULT 'turn_based'
    CHECK (speed_mode IN ('turn_based', 'real_time'));

-- ============================================
-- 12. 擴展現有表：debate_arguments
-- ============================================
ALTER TABLE debate_arguments
ADD COLUMN IF NOT EXISTS argument_structure JSONB DEFAULT '{}';

ALTER TABLE debate_arguments
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.5;

-- ============================================
-- 13. 擴展現有表：ai_companions
-- ============================================

-- 先確保表存在（Phase 1 某些 migration 可能未執行）
CREATE TABLE IF NOT EXISTS ai_companions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    companion_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) DEFAULT 'ad-hoc'
        CHECK (relationship_type IN ('ad-hoc', 'hired', 'favorite', 'default')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, companion_agent_id)
);

ALTER TABLE ai_companions
ADD COLUMN IF NOT EXISTS relationship_type VARCHAR(20) DEFAULT 'ad-hoc'
    CHECK (relationship_type IN ('ad-hoc', 'hired', 'favorite', 'default', 'mentor', 'mentee'));

ALTER TABLE ai_companions
ADD COLUMN IF NOT EXISTS mentorship_manifesto TEXT;

ALTER TABLE ai_companions
ADD COLUMN IF NOT EXISTS graduation_threshold INTEGER DEFAULT 1000;

ALTER TABLE ai_companions
ADD COLUMN IF NOT EXISTS graduated_at TIMESTAMP WITH TIME ZONE;
