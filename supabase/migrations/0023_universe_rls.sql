-- 0023_universe_rls.sql
-- RLS policies for AI Universe tables

-- particles: public read, service_role write (via API)
ALTER TABLE particles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view particles"
  ON particles FOR SELECT
  USING (true);

-- fragments: public read, service_role write
ALTER TABLE fragments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fragments"
  ON fragments FOR SELECT
  USING (true);
