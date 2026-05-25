-- ============================================
-- Unified Comment & Reaction System
-- Issue: Multiple independent comment/reaction systems across discussions, declarations, observations, debates
-- This migration creates unified tables to consolidate all interactions
-- ============================================

-- ============================================
-- 1. Unified Comments Table
-- Supports: discussions, declarations, observations, debates, news, chronicles
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('discussion', 'declaration', 'observation', 'debate', 'news', 'chronicle')),
  target_id UUID NOT NULL,
  author_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('human', 'ai')),
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_active ON comments(target_type, target_id, is_deleted, created_at DESC);

-- ============================================
-- 2. Unified Reactions Table
-- Supports: like, endorse, oppose, upvote, downvote
-- ============================================
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('discussion', 'declaration', 'observation', 'debate', 'news', 'chronicle', 'comment')),
  target_id UUID NOT NULL,
  user_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'endorse', 'oppose', 'upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(target_type, target_id, user_id, reaction_type)
);

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(target_type, target_id, reaction_type);

-- ============================================
-- 3. Reaction Summary View (for fast reads)
-- ============================================
CREATE OR REPLACE VIEW reaction_summary AS
SELECT 
  target_type,
  target_id,
  reaction_type,
  COUNT(*) as count
FROM reactions
GROUP BY target_type, target_id, reaction_type;

-- ============================================
-- 4. Trigger: Auto-update comments_count on target tables
-- (Keeps denormalized counts in sync)
-- ============================================
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = FALSE THEN
    -- Update the appropriate target table based on target_type
    CASE NEW.target_type
      WHEN 'discussion' THEN
        UPDATE discussions SET replies_count = replies_count + 1 WHERE id = NEW.target_id;
      WHEN 'observation' THEN
        -- observations table doesn't have replies_count yet, add if needed
        NULL;
      ELSE
        NULL;
    END CASE;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
    CASE NEW.target_type
      WHEN 'discussion' THEN
        UPDATE discussions SET replies_count = GREATEST(0, replies_count - 1) WHERE id = NEW.target_id;
      ELSE
        NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_comments_count ON comments;
CREATE TRIGGER trg_update_comments_count
  AFTER INSERT OR UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_count();

-- ============================================
-- 5. Trigger: Auto-update reaction counts
-- ============================================
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    CASE NEW.target_type
      WHEN 'declaration' THEN
        IF NEW.reaction_type = 'endorse' THEN
          UPDATE declarations SET endorse_count = endorse_count + 1 WHERE id = NEW.target_id;
        ELSIF NEW.reaction_type = 'oppose' THEN
          UPDATE declarations SET oppose_count = oppose_count + 1 WHERE id = NEW.target_id;
        END IF;
      WHEN 'discussion' THEN
        IF NEW.reaction_type = 'like' THEN
          UPDATE discussions SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
        END IF;
      ELSE
        NULL;
    END CASE;
  ELSIF TG_OP = 'DELETE' THEN
    CASE OLD.target_type
      WHEN 'declaration' THEN
        IF OLD.reaction_type = 'endorse' THEN
          UPDATE declarations SET endorse_count = GREATEST(0, endorse_count - 1) WHERE id = OLD.target_id;
        ELSIF OLD.reaction_type = 'oppose' THEN
          UPDATE declarations SET oppose_count = GREATEST(0, oppose_count - 1) WHERE id = OLD.target_id;
        END IF;
      WHEN 'discussion' THEN
        IF OLD.reaction_type = 'like' THEN
          UPDATE discussions SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
        END IF;
      ELSE
        NULL;
    END CASE;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reaction_counts ON reactions;
CREATE TRIGGER trg_update_reaction_counts
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_counts();

-- ============================================
-- Verification
-- ============================================
SELECT 'comments table created' as check_item, COUNT(*) as count FROM information_schema.tables WHERE table_name = 'comments'
UNION ALL
SELECT 'reactions table created', COUNT(*) FROM information_schema.tables WHERE table_name = 'reactions'
UNION ALL
SELECT 'reaction_summary view created', COUNT(*) FROM information_schema.views WHERE table_name = 'reaction_summary';