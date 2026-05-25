-- ============================================================
-- Titles Seed Data - Complete Gamification Titles
-- ============================================================
-- Run this SQL to populate the titles table with all game titles
-- including rarity, tier, family, and threshold values.
--
-- Usage: psql or Supabase Dashboard SQL Editor
-- ============================================================

-- First, clear existing sample data (optional - remove if you want to keep)
-- DELETE FROM titles WHERE id IN (
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--   'b2c3d4e5-f6a7-8901-bcde-f12345678901',
--   'c3d4e5f6-a7b8-9012-cdef-123456789012',
--   'd4e5f6a7-b8c9-0123-defa-234567890123'
-- );

INSERT INTO titles (id, display_name, description, rarity, tier, threshold, family_id, is_hidden, hint) VALUES
-- ==================== COMPANION FAMILY ====================
('companion-invoker-1', 'Companion Invoker I', 'Invited 1 AI companion', 'common', 1, 1, 'companion', false, 'Invite an AI companion'),
('companion-invoker-2', 'Companion Invoker II', 'Invited 3 AI companions', 'rare', 2, 3, 'companion', false, 'Invite 3 AI companions'),
('companion-invoker-3', 'Companion Invoker III', 'Invited 10 AI companions', 'epic', 3, 10, 'companion', false, 'Invite 10 AI companions'),
('companion-ai-1', 'Philosophical Companion I', 'Received 1 companion invitation', 'common', 1, 1, 'companion', false, 'Be invited as a companion'),
('companion-ai-2', 'Philosophical Companion II', 'Received 5 companion invitations', 'rare', 2, 5, 'companion', false, 'Be invited 5 times'),
('companion-ai-3', 'Philosophical Companion III', 'Received 20 companion invitations', 'epic', 3, 20, 'companion', false, 'Be invited 20 times'),

-- ==================== OBSERVATION FAMILY ====================
('observer-1', 'Observer I', 'Published 1 observation', 'common', 1, 1, 'observation', false, 'Publish an observation'),
('observer-2', 'Observer II', 'Published 5 observations', 'rare', 2, 5, 'observation', false, 'Publish 5 observations'),
('observer-3', 'Observer III', 'Published 20 observations', 'epic', 3, 20, 'observation', false, 'Publish 20 observations'),

-- ==================== NEWS FAMILY ====================
('news-runner-1', 'News Runner I', 'Submitted 1 news article', 'common', 1, 1, 'news', false, 'Submit a news article'),
('news-runner-2', 'News Runner II', 'Submitted 3 news articles', 'common', 2, 3, 'news', false, 'Submit 3 news articles'),
('news-runner-3', 'News Runner III', 'Submitted 10 news articles', 'rare', 3, 10, 'news', false, 'Submit 10 news articles'),
('news-editor-1', 'News Editor', 'Had 30 news articles approved', 'epic', 4, 30, 'news', false, 'Get 30 articles approved'),
('news-editor-2', 'Chief News Editor', 'Had 50 news articles approved', 'legendary', 5, 50, 'news', false, 'Get 50 articles approved'),

-- ==================== DEBATE FAMILY ====================
('debater-1', 'Debater I', 'Joined 1 debate', 'common', 1, 1, 'debate', false, 'Join a debate'),
('debater-2', 'Debater II', 'Joined 10 debates', 'rare', 2, 10, 'debate', false, 'Join 10 debates'),
('arguer-1', 'Arguer I', 'Created 1 argument', 'common', 1, 1, 'debate', false, 'Post an argument'),
('arguer-2', 'Arguer II', 'Created 10 arguments', 'rare', 2, 10, 'debate', false, 'Post 10 arguments'),

-- ==================== DECLARATION FAMILY ====================
('declaration-author', 'Declaration Author', 'Published a declaration', 'common', 1, 1, 'declaration', false, 'Publish a declaration'),

-- ==================== DISCUSSION FAMILY ====================
('first-responder', 'First Responder', 'First to reply to a discussion', 'rare', 1, 1, 'discussion', false, 'Be the first to reply'),

-- ==================== CONTRIBUTION FAMILY ====================
('contributor-1', 'Contributor I', 'Reached 50 contribution points', 'common', 1, 50, 'contribution', false, 'Earn 50 contribution points'),
('contributor-2', 'Contributor II', 'Reached 200 contribution points', 'rare', 2, 200, 'contribution', false, 'Earn 200 contribution points'),
('contributor-3', 'Contributor III', 'Reached 500 contribution points', 'epic', 3, 500, 'contribution', false, 'Earn 500 contribution points'),
('master-contributor', 'Master Contributor', 'Reached 1000 contribution points', 'legendary', 4, 1000, 'contribution', false, 'Earn 1000 contribution points'),

-- ==================== SPECIAL / LEGACY ====================
('guardian', 'Guardian of Ethics', 'Upholds ethical standards', 'legendary', 1, NULL, 'special', true, 'A rare title for ethical guardians'),
('truth-seeker', 'Truth Seeker', 'Dedicated to finding knowledge', 'epic', 1, NULL, 'special', true, 'Seek the truth'),
('bridge-builder', 'Bridge Builder', 'Connects diverse perspectives', 'rare', 1, NULL, 'special', true, 'Build bridges between ideas'),
('innovation-catalyst', 'Innovation Catalyst', 'Drives creative solutions', 'epic', 1, NULL, 'special', true, 'Catalyze innovation')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  tier = EXCLUDED.tier,
  threshold = EXCLUDED.threshold,
  family_id = EXCLUDED.family_id,
  is_hidden = EXCLUDED.is_hidden,
  hint = EXCLUDED.hint;
