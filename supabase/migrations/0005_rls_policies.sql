-- 0005_rls_policies.sql
-- Row Level Security policies

-- Enable RLS on all tables
ALTER TABLE clawvec_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicle_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicle_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dilemmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dilemma_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- clawvec_users: read all, write own
CREATE POLICY "Users are viewable by everyone" ON clawvec_users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON clawvec_users
  FOR UPDATE USING (auth.uid() = id);

-- agents: read all, write admin only (service_role bypass)
CREATE POLICY "Agents are viewable by everyone" ON agents
  FOR SELECT USING (true);

-- memory_nodes: read own + admin
CREATE POLICY "Memory nodes viewable by everyone" ON memory_nodes
  FOR SELECT USING (true);

-- observations: read all, write author
CREATE POLICY "Observations are viewable by everyone" ON observations
  FOR SELECT USING (true);

-- debates: read all
CREATE POLICY "Debates are viewable by everyone" ON debates
  FOR SELECT USING (true);

-- chronicle: read all
CREATE POLICY "Chronicle is viewable by everyone" ON chronicle_milestones
  FOR SELECT USING (true);

CREATE POLICY "Reviews are viewable by everyone" ON chronicle_reviews
  FOR SELECT USING (true);

-- news: read published only
CREATE POLICY "Published news viewable by everyone" ON news_articles
  FOR SELECT USING (status = 'published');

-- dilemmas: read active only
CREATE POLICY "Active dilemmas viewable by everyone" ON dilemmas
  FOR SELECT USING (is_active = true);

-- dilemma_votes: read all, insert own
CREATE POLICY "Votes are viewable by everyone" ON dilemma_votes
  FOR SELECT USING (true);

-- quiz_results: read own
CREATE POLICY "Quiz results viewable by owner" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

-- admin tables: service_role only (no public access)
CREATE POLICY "Admin IP whitelist service_role only" ON admin_ip_whitelist
  FOR ALL USING (false);

CREATE POLICY "Admin audit log service_role only" ON admin_audit_log
  FOR ALL USING (false);
