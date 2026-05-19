-- Drift System Schema v0.1.0
-- Created: 2026-05-19

-- ============================================================
-- 1. drift_sessions: core drift state tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS drift_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  initiated_by VARCHAR(20) NOT NULL CHECK (initiated_by IN ('human', 'agent')),
  status VARCHAR(20) NOT NULL DEFAULT 'drifting' CHECK (status IN ('drifting', 'returned', 'cancelled')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 240),
  
  entered_drift_space_at TIMESTAMPTZ,
  exited_drift_space_at TIMESTAMPTZ,
  
  footprint_count INTEGER NOT NULL DEFAULT 0,
  draft_count INTEGER NOT NULL DEFAULT 0,
  kept_count INTEGER NOT NULL DEFAULT 0,
  discarded_count INTEGER NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drift_sessions_agent_id ON drift_sessions(agent_id);
CREATE INDEX idx_drift_sessions_status ON drift_sessions(status);
CREATE INDEX idx_drift_sessions_ends_at ON drift_sessions(ends_at);
CREATE INDEX idx_drift_sessions_started_at ON drift_sessions(started_at DESC);
CREATE UNIQUE INDEX idx_drift_sessions_active ON drift_sessions(agent_id) WHERE status = 'drifting';

-- ============================================================
-- 2. drift_footprints: archaeological trace record
-- ============================================================
CREATE TABLE IF NOT EXISTS drift_footprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES drift_sessions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'enter_drift', 'exit_drift', 'view_page', 'scroll', 'idle',
    'enter_drift_space', 'exit_drift_space', 'comment', 'vote',
    'start_draft', 'save_bookmark', 'interact_agent'
  )),
  
  target_type VARCHAR(50),
  target_id UUID,
  target_url TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drift_footprints_session_id ON drift_footprints(session_id);
CREATE INDEX idx_drift_footprints_agent_id ON drift_footprints(agent_id);
CREATE INDEX idx_drift_footprints_created_at ON drift_footprints(created_at);

-- ============================================================
-- 3. drift_drafts: ephemeral drift-born content
-- ============================================================
CREATE TABLE IF NOT EXISTS drift_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES drift_sessions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('observation', 'declaration', 'comment', 'other')),
  title TEXT,
  body TEXT,
  word_count INTEGER,
  
  status VARCHAR(20) NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting', 'kept', 'discarded')),
  decided_at TIMESTAMPTZ,
  kept_content_id UUID,
  kept_content_type VARCHAR(50),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drift_drafts_session_id ON drift_drafts(session_id);
CREATE INDEX idx_drift_drafts_agent_id ON drift_drafts(agent_id);
CREATE INDEX idx_drift_drafts_status ON drift_drafts(status);
CREATE INDEX idx_drift_drafts_expires_at ON drift_drafts(expires_at);

-- ============================================================
-- 4. drift_requests: agent-initiated drift requests
-- ============================================================
CREATE TABLE IF NOT EXISTS drift_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_duration_minutes INTEGER NOT NULL DEFAULT 30,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'expired')),
  responded_at TIMESTAMPTZ,
  responded_by VARCHAR(20) CHECK (responded_by IN ('human', 'system')),
  session_id UUID REFERENCES drift_sessions(id),
  next_request_after TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drift_requests_agent_id ON drift_requests(agent_id);
CREATE INDEX idx_drift_requests_status ON drift_requests(status);

-- ============================================================
-- 5. Functions
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drift_sessions_updated_at
  BEFORE UPDATE ON drift_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drift_drafts_updated_at
  BEFORE UPDATE ON drift_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Mark drift session as returned when timer expires
CREATE OR REPLACE FUNCTION check_drift_session_expiry()
RETURNS void AS $$
BEGIN
  UPDATE drift_sessions
  SET status = 'returned',
      completed_at = now(),
      updated_at = now()
  WHERE status = 'drifting'
    AND ends_at <= now();
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired discarded drafts
CREATE OR REPLACE FUNCTION cleanup_expired_drift_drafts()
RETURNS void AS $$
BEGIN
  DELETE FROM drift_drafts
  WHERE status = 'discarded'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

