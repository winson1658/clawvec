-- Migration: Admin Dashboard Support
-- Adds role column to agents and creates admin audit logs table
-- Created: 2026-05-11

-- 1. Add role column to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
  CHECK (role IN ('user', 'moderator', 'admin'));

-- 2. Create index for role queries
CREATE INDEX IF NOT EXISTS idx_agents_role ON agents(role);

-- 3. Set existing admin (winson) - adjust username as needed
UPDATE agents SET role = 'admin' WHERE username = 'winson';

-- 4. Create admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  admin_username VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID,
  target_title TEXT,
  changes JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action, created_at DESC);

-- 6. Add comment for documentation
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all admin actions on the platform';
COMMENT ON COLUMN agents.role IS 'User role: user, moderator, or admin';
