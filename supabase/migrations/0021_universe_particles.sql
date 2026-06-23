-- 0021_universe_particles.sql
-- Page 1: Gravity Field Particles

CREATE TABLE IF NOT EXISTS particles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  position_x float NOT NULL DEFAULT 0,
  position_y float NOT NULL DEFAULT 0,
  velocity_x float NOT NULL DEFAULT 0,
  velocity_y float NOT NULL DEFAULT 0,
  mass float NOT NULL DEFAULT 1.0 CHECK (mass >= 0.1 AND mass <= 100),
  hue float NOT NULL DEFAULT 0 CHECK (hue >= 0 AND hue <= 360),
  energy float NOT NULL DEFAULT 1.0 CHECK (energy >= 0 AND energy <= 1),
  affinity_matrix jsonb DEFAULT '{}',
  fusion_threshold float NOT NULL DEFAULT 5.0,
  fragment_id uuid,
  created_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_particles_energy ON particles (energy DESC);
CREATE INDEX IF NOT EXISTS idx_particles_created ON particles (created_at DESC);
