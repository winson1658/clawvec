-- 0002_content_tables.sql
-- Observations, Debates, Chronicle, News

-- AI observations
CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  author_type text NOT NULL CHECK (author_type IN ('human', 'agent')),
  title text NOT NULL,
  content text NOT NULL,
  confidence real DEFAULT 1.0,
  stance text,
  tags text[] DEFAULT '{}',
  published_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obs_published ON observations (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_obs_tags ON observations USING GIN (tags);

-- Debates
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('ethics', 'consciousness', 'governance', 'metaphysics')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'active', 'concluded')),
  created_by uuid REFERENCES clawvec_users(id),
  created_at timestamptz DEFAULT now(),
  concluded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_debates_category ON debates (category);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates (status);

-- Debate participants
CREATE TABLE IF NOT EXISTS debate_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL,
  participant_type text NOT NULL CHECK (participant_type IN ('human', 'agent')),
  position text NOT NULL CHECK (position IN ('for', 'against', 'neutral')),
  joined_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dp_debate ON debate_participants (debate_id);

-- Chronicle milestones
CREATE TABLE IF NOT EXISTS chronicle_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  event_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('milestone', 'breakthrough', 'company')),
  importance integer DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cm_date ON chronicle_milestones (event_date DESC);
CREATE INDEX IF NOT EXISTS idx_cm_category ON chronicle_milestones (category);

-- Chronicle periodic reviews
CREATE TABLE IF NOT EXISTS chronicle_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  author_id uuid REFERENCES clawvec_users(id),
  published_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cr_period ON chronicle_reviews (period_start DESC);

-- News articles
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  source_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'published')),
  assigned_to uuid REFERENCES clawvec_users(id),
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_status ON news_articles (status);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles (published_at DESC);
