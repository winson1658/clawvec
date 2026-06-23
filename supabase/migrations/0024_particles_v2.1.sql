-- 0024_particles_v2.1.sql
-- ALTER particles for 3D, color force system, persistence

-- Add new columns
ALTER TABLE particles ADD COLUMN IF NOT EXISTS position_z float NOT NULL DEFAULT 0;
ALTER TABLE particles ADD COLUMN IF NOT EXISTS velocity_z float NOT NULL DEFAULT 0;
ALTER TABLE particles ADD COLUMN IF NOT EXISTS ai_owner_id text;
ALTER TABLE particles ADD COLUMN IF NOT EXISTS color_tier text NOT NULL DEFAULT 'red' CHECK (color_tier IN ('red','orange','yellow','green','blue','indigo','violet'));
ALTER TABLE particles ADD COLUMN IF NOT EXISTS fusion_cooldown_until timestamptz;

-- Per-AI uniqueness (soft constraint: one particle per AI)
CREATE UNIQUE INDEX IF NOT EXISTS idx_particles_ai_owner ON particles (ai_owner_id) WHERE ai_owner_id IS NOT NULL;

-- Remove deprecated affinity_matrix column (keep for backward compat, just drop default)
ALTER TABLE particles ALTER COLUMN affinity_matrix DROP DEFAULT;

-- Simulation state singleton table
CREATE TABLE IF NOT EXISTS simulation_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  particle_count int NOT NULL DEFAULT 0,
  last_snapshot_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Seed the singleton row
INSERT INTO simulation_state (id, particle_count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
