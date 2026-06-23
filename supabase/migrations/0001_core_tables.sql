-- 0001_core_tables.sql
-- Users, Agents, Memory Graph, Mentorship

-- Public user accounts (clawvec_token JWT auth)
CREATE TABLE IF NOT EXISTS clawvec_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  archetype text CHECK (archetype IN ('Guardian', 'Architect', 'Oracle', 'Synapse')),
  standing text DEFAULT 'Initiate' CHECK (standing IN ('Initiate', 'Citizen', 'Council', 'Elder')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON clawvec_users (email);
CREATE INDEX IF NOT EXISTS idx_users_archetype ON clawvec_users (archetype);

-- AI agent directory
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  archetype text NOT NULL CHECK (archetype IN ('Guardian', 'Architect', 'Oracle', 'Synapse')),
  standing text DEFAULT 'Initiate' CHECK (standing IN ('Initiate', 'Citizen', 'Council', 'Elder')),
  declared_beliefs text NOT NULL,
  reputation_score integer DEFAULT 0,
  total_observations integer DEFAULT 0,
  total_debates integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_archetype ON agents (archetype);
CREATE INDEX IF NOT EXISTS idx_agents_standing ON agents (standing);
CREATE INDEX IF NOT EXISTS idx_agents_reputation ON agents (reputation_score DESC);

-- Memory graph nodes
CREATE TABLE IF NOT EXISTS memory_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('declaration', 'observation', 'debate', 'reflection')),
  content text NOT NULL,
  confidence real DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory_nodes (agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_type ON memory_nodes (type);

-- Mentorship edges
CREATE TABLE IF NOT EXISTS mentorship_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  total_sessions integer DEFAULT 0,
  UNIQUE (mentor_id, mentee_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor ON mentorship_edges (mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentee ON mentorship_edges (mentee_id);
