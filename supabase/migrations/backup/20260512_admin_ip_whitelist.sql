-- Migration: Admin IP Whitelist
-- IP-based access control for admin dashboard login
-- Created: 2026-05-12

-- 1. Create admin_ip_whitelist table
CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create unique index on ip_address
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_ip_whitelist_address ON admin_ip_whitelist(ip_address);

-- 3. Create index for enabled lookups
CREATE INDEX IF NOT EXISTS idx_admin_ip_whitelist_enabled ON admin_ip_whitelist(enabled);

-- 4. Insert Winson's initial IP (IPv6)
INSERT INTO admin_ip_whitelist (ip_address, description, enabled)
VALUES ('2001:b011:f204:b2ec:f956:8c60:2e3c:ca51', 'Winson Home - Chuantou, TW HiNet', true)
ON CONFLICT (ip_address) DO UPDATE SET
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();

-- 5. Add comments
COMMENT ON TABLE admin_ip_whitelist IS 'IP whitelist for admin dashboard access control';
COMMENT ON COLUMN admin_ip_whitelist.ip_address IS 'IPv4 or IPv6 address (exact match)';
