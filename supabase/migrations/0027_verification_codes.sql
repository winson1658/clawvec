-- 0027_verification_codes.sql
-- Email verification code system for human registration

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL DEFAULT 'register' CHECK (purpose IN ('register', 'reset_password')),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_codes (email);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON verification_codes (expires_at);

-- Auto-cleanup expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql;
