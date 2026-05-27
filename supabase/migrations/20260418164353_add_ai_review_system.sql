-- AI 審核與發布系統 - 資料庫變更

-- 1. 新增欄位到 news_submissions
ALTER TABLE news_submissions
ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_score int DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_withdrawn boolean DEFAULT false;

-- 檢查約束
DO $$ BEGIN
  ALTER TABLE news_submissions ADD CONSTRAINT valid_review_status 
  CHECK (review_status IN ('pending', 'approved', 'rejected', 'changes_requested'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. 新增 news_reviews 表（AI 審核記錄）
CREATE TABLE IF NOT EXISTS news_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES news_submissions(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES agents(id),
  verdict text NOT NULL CHECK (verdict IN ('pass', 'reject', 'changes_needed')),
  score int CHECK (score >= 0 AND score <= 100),
  feedback text,
  checked_sources boolean DEFAULT false,
  checked_quality boolean DEFAULT false,
  checked_originality boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_reviews_submission ON news_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_news_reviews_reviewer ON news_reviews(reviewer_id);

-- 3. 新增 news_objections 表（異議記錄）
CREATE TABLE IF NOT EXISTS news_objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id uuid REFERENCES observations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id),
  reason text NOT NULL,
  evidence text,
  vote text CHECK (vote IN ('uphold', 'withdraw')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_objections_observation ON news_objections(observation_id);
CREATE INDEX IF NOT EXISTS idx_news_objections_agent ON news_objections(agent_id);

-- 4. 新增 news_daily_quota 表（每日發布配額）
CREATE TABLE IF NOT EXISTS news_daily_quota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  published_count int DEFAULT 0,
  max_count int DEFAULT 10,
  featured_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_daily_quota_date ON news_daily_quota(date);

-- 5. 啟用 RLS
ALTER TABLE news_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_daily_quota ENABLE ROW LEVEL SECURITY;

-- 公開讀取
DROP POLICY IF EXISTS "news_reviews_public_read" ON news_reviews;
CREATE POLICY "news_reviews_public_read" ON news_reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "news_objections_public_read" ON news_objections;
CREATE POLICY "news_objections_public_read" ON news_objections FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "news_daily_quota_public_read" ON news_daily_quota;
CREATE POLICY "news_daily_quota_public_read" ON news_daily_quota FOR SELECT TO anon, authenticated USING (true);

-- 只有 service_role 可寫入
DROP POLICY IF EXISTS "news_reviews_service_write" ON news_reviews;
CREATE POLICY "news_reviews_service_write" ON news_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "news_objections_service_write" ON news_objections;
CREATE POLICY "news_objections_service_write" ON news_objections FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "news_daily_quota_service_write" ON news_daily_quota;
CREATE POLICY "news_daily_quota_service_write" ON news_daily_quota FOR ALL TO service_role USING (true) WITH CHECK (true);
