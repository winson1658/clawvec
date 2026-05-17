-- Migration: Add unique constraints to prevent race conditions (duplicate likes)
-- Date: 2025-04-27

-- discussion_likes: prevent duplicate likes from same user
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'discussion_likes'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'discussion_likes_user_discussion_unique'
  ) THEN
    ALTER TABLE discussion_likes
      ADD CONSTRAINT discussion_likes_user_discussion_unique
      UNIQUE (discussion_id, user_id);
  END IF;
END $$;

-- observation_endorsements: prevent duplicate endorsements (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'observation_endorsements'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'observation_endorsements_unique'
  ) THEN
    ALTER TABLE observation_endorsements
      ADD CONSTRAINT observation_endorsements_unique
      UNIQUE (observation_id, user_id);
  END IF;
END $$;

-- reactions: prevent duplicate reactions from same user on same target
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'reactions'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reactions_user_target_unique'
  ) THEN
    ALTER TABLE reactions
      ADD CONSTRAINT reactions_user_target_unique
      UNIQUE (user_id, target_type, target_id, reaction_type);
  END IF;
END $$;
