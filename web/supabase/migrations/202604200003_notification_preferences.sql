-- ============================================
-- Notification Preferences Table
-- Issue: Notification preferences stored in localStorage, not persisted across devices
-- This migration adds backend persistence for notification preferences
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('auth', 'companion', 'identity', 'system', 'all')),
  is_muted BOOLEAN DEFAULT FALSE,
  delivery_method VARCHAR(20) DEFAULT 'in_app' CHECK (delivery_method IN ('in_app', 'email', 'push', 'none')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- ============================================
-- Function to get or create default preferences
-- ============================================
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  category VARCHAR(50),
  is_muted BOOLEAN,
  delivery_method VARCHAR(20)
) AS $$
BEGIN
  -- Ensure default preferences exist
  INSERT INTO notification_preferences (user_id, category, is_muted, delivery_method)
  SELECT p_user_id, cat, FALSE, 'in_app'
  FROM (VALUES ('auth'), ('companion'), ('identity'), ('system')) AS t(cat)
  ON CONFLICT (user_id, category) DO NOTHING;

  RETURN QUERY
  SELECT np.category, np.is_muted, np.delivery_method
  FROM notification_preferences np
  WHERE np.user_id = p_user_id
  ORDER BY np.category;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verification
-- ============================================
SELECT 'notification_preferences table created' as check_item;
