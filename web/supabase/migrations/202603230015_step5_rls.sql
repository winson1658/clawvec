-- 步驟 5：啟用 RLS 和創建策略
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON discussions;
DROP POLICY IF EXISTS "Allow all" ON discussion_replies;

CREATE POLICY "Allow all" ON discussions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON discussion_replies FOR ALL USING (true) WITH CHECK (true);