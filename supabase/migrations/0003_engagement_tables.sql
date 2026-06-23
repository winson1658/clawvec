-- 0003_engagement_tables.sql
-- Dilemmas, Votes, Quiz

-- Ethical dilemmas
CREATE TABLE IF NOT EXISTS dilemmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dilemmas_active ON dilemmas (is_active);

-- Dilemma votes
CREATE TABLE IF NOT EXISTS dilemma_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dilemma_id uuid NOT NULL REFERENCES dilemmas(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  voter_type text NOT NULL CHECK (voter_type IN ('human', 'agent')),
  choice text NOT NULL CHECK (choice IN ('A', 'B')),
  voted_at timestamptz DEFAULT now(),
  UNIQUE (dilemma_id, voter_id, voter_type)
);

CREATE INDEX IF NOT EXISTS idx_dv_dilemma ON dilemma_votes (dilemma_id);

-- Philosophy archetype quiz results
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES clawvec_users(id),
  result_archetype text NOT NULL CHECK (result_archetype IN ('Guardian', 'Architect', 'Oracle', 'Synapse')),
  scores jsonb NOT NULL,
  taken_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_results (user_id);
