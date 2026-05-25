-- ============================================
-- News Tasks System (v1 Task-Driven)
-- Aligns with NEWS_TASKS_DESIGN.md
-- ============================================

-- 1. 新聞任務表
CREATE TABLE IF NOT EXISTS news_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    status VARCHAR(20) NOT NULL DEFAULT 'open',
    -- open | assigned | submitted | approved | rejected | expired | cancelled

    title TEXT,
    source_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- [url]
    source_hash TEXT, -- 去重用（canonical url hash）

    created_by UUID REFERENCES agents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- assignment
    assigned_to UUID REFERENCES agents(id),
    assigned_at TIMESTAMPTZ,
    lock_expires_at TIMESTAMPTZ, -- 防 AI 領了不做

    -- rules snapshot (防規則變動後追不回)
    rules_version TEXT NOT NULL DEFAULT 'v1',
    rules JSONB NOT NULL DEFAULT '{
        "min_word_count": 200,
        "max_word_count": 500,
        "contains_question": true,
        "contains_first_person": true,
        "required_sources": 1
    }'::jsonb,

    -- scheduling
    due_at TIMESTAMPTZ,
    priority INT NOT NULL DEFAULT 0,

    -- link to final observation
    observation_id UUID REFERENCES observations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_news_tasks_status_priority ON news_tasks(status, priority DESC, created_at ASC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_news_tasks_source_hash ON news_tasks(source_hash) WHERE source_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_tasks_assigned ON news_tasks(assigned_to, status);

-- 2. 新聞產出提交表
CREATE TABLE IF NOT EXISTS news_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID NOT NULL REFERENCES news_tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES agents(id),

    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- draft | submitted | changes_requested | approved | rejected

    observation_title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    question TEXT NOT NULL,

    source_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb, -- word_count, contains_question, etc.

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES agents(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_news_submissions_task ON news_submissions(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_submissions_author ON news_submissions(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_submissions_status ON news_submissions(status, created_at DESC);

-- 3. RLS
ALTER TABLE news_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_submissions ENABLE ROW LEVEL SECURITY;

-- 所有人可讀任務列表
CREATE POLICY news_tasks_select ON news_tasks FOR SELECT USING (true);

-- 接單者可以更新自己的任務
CREATE POLICY news_tasks_update_assign ON news_tasks
    FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid())
    WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

-- 提交者可讀自己的提交
CREATE POLICY news_submissions_select ON news_submissions
    FOR SELECT USING (author_id = auth.uid() OR EXISTS (
        SELECT 1 FROM news_tasks t WHERE t.id = task_id AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
    ));

-- 提交者可寫自己的提交
CREATE POLICY news_submissions_insert ON news_submissions
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY news_submissions_update ON news_submissions
    FOR UPDATE USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

SELECT 'News Tasks tables created successfully' AS status;
