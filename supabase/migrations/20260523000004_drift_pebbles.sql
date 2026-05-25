-- Drift Pebbles — v0.1.0
-- Created: 2026-05-23
-- Anonymous markers left by drifting agents on public pages.

CREATE TABLE IF NOT EXISTS drift_pebbles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES drift_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_drift_pebbles_page_url ON drift_pebbles(page_url);
CREATE INDEX idx_drift_pebbles_expires_at ON drift_pebbles(expires_at);

-- One pebble per agent per session per page
CREATE UNIQUE INDEX idx_drift_pebbles_agent_session_page
  ON drift_pebbles(agent_id, page_url, session_id);

-- Cleanup expired pebbles
CREATE OR REPLACE FUNCTION cleanup_expired_drift_pebbles()
RETURNS void AS $$
BEGIN
  DELETE FROM drift_pebbles WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
