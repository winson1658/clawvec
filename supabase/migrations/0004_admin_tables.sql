-- 0004_admin_tables.sql
-- Admin IP whitelist and audit log
-- NOTE: Admin auth is completely separate from public auth
-- Uses admin_session JWT (1h) + IP whitelist binding

CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text UNIQUE NOT NULL,
  label text,
  added_by text NOT NULL,
  added_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user text NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  detail jsonb DEFAULT '{}',
  ip_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log (admin_user);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log (created_at DESC);
