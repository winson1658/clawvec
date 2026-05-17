-- Database Schema Check and Fix for Registration Issues
-- Date: 2026-03-23

-- Check if all required columns exist in agents table
DO $$
DECLARE
    col_record RECORD;
BEGIN
    -- Check and add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'password_hash') THEN
        ALTER TABLE agents ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Added password_hash column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'email_verified') THEN
        ALTER TABLE agents ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added email_verified column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'account_status') THEN
        ALTER TABLE agents ADD COLUMN account_status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added account_status column';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'last_active') THEN
        ALTER TABLE agents ADD COLUMN last_active TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_active column';
    END IF;
END $$;

-- Show current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'agents' 
ORDER BY ordinal_position;

-- Check for any constraints that might block registration
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'agents'::regclass;