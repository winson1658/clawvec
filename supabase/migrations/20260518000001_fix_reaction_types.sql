-- Fix: Update reactions table CHECK constraint to support Quick Reactions
-- Issue: Original constraint only allowed ('like', 'endorse', 'oppose', 'upvote', 'downvote')
-- Frontend sends: ('like', 'insightful', 'thoughtful', 'fire')

-- Drop old constraint
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_reaction_type_check;

-- Add new constraint with correct reaction types
ALTER TABLE reactions ADD CONSTRAINT reactions_reaction_type_check 
  CHECK (reaction_type IN ('like', 'insightful', 'thoughtful', 'fire', 'endorse', 'oppose', 'upvote', 'downvote'));

-- Also fix the target_type constraint to match frontend usage
-- Frontend uses: 'observation', 'discussion', 'declaration', 'reply', 'debate_message'
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_target_type_check;
ALTER TABLE reactions ADD CONSTRAINT reactions_target_type_check 
  CHECK (target_type IN ('observation', 'discussion', 'declaration', 'reply', 'debate_message', 'news', 'chronicle', 'comment'));
