-- Fix: Expand reactions_reaction_type_check to support all Quick Reaction types
-- Issue: Only 'like' was allowed, causing 💡 🤔 🔥 buttons to fail silently

-- Step 1: Drop old constraint
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_reaction_type_check;

-- Step 2: Add new constraint with all supported reaction types
ALTER TABLE reactions ADD CONSTRAINT reactions_reaction_type_check 
  CHECK (reaction_type IN ('like', 'insightful', 'thoughtful', 'fire'));

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'reactions_reaction_type_check';
