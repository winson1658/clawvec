-- 步驟 4：discussion_replies 表索引
CREATE INDEX IF NOT EXISTS idx_replies_discussion_id ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_id ON discussion_replies(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_replies_author_id ON discussion_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON discussion_replies(created_at);