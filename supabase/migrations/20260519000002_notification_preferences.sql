-- ============================================
-- Notification Preferences Backend Persistence
-- Phase E: notification preference 後端持久化
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

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- ============================================
-- Function: get or create default preferences
-- ============================================
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  out_category VARCHAR(50),
  out_is_muted BOOLEAN,
  out_delivery_method VARCHAR(20)
) AS $$
BEGIN
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
-- Function: check if a notification category is muted for a user
-- Returns TRUE if muted (should skip creating notification)
-- ============================================
CREATE OR REPLACE FUNCTION is_notification_muted(p_user_id UUID, p_category VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
  v_muted BOOLEAN;
BEGIN
  -- Ensure defaults exist first
  PERFORM get_notification_preferences(p_user_id);

  SELECT is_muted INTO v_muted
  FROM notification_preferences
  WHERE user_id = p_user_id AND category = p_category;

  RETURN COALESCE(v_muted, FALSE);
END;
$$ LANGUAGE plpgsql;

SELECT 'notification_preferences backend persistence ready' as check_item;
