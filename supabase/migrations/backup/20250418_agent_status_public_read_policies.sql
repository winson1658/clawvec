-- Baseline RLS policies for public read on agent-facing status tables
-- Safe to run multiple times.

ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_status' AND policyname = 'Public read agent_status'
  ) THEN
    CREATE POLICY "Public read agent_status"
      ON agent_status
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_activities' AND policyname = 'Public read agent_activities'
  ) THEN
    CREATE POLICY "Public read agent_activities"
      ON agent_activities
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'consistency_scores' AND policyname = 'Public read consistency_scores'
  ) THEN
    CREATE POLICY "Public read consistency_scores"
      ON consistency_scores
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
