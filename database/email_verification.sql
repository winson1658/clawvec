-- Email Verification Table
-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

-- Add email_verified column to agents table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE agents ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Row Level Security (RLS) policies
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own verification records
CREATE POLICY "Users can view own verifications" ON email_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update
CREATE POLICY "Service role can manage verifications" ON email_verifications
  FOR ALL USING (auth.role() = 'service_role');