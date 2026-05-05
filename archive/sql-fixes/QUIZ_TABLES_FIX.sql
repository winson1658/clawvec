-- ============================================
-- Quiz System Tables Fix
-- ============================================

-- 1. Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_zh TEXT NOT NULL,
    question_en TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Quiz Options Table
CREATE TABLE IF NOT EXISTS quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_zh TEXT NOT NULL,
    option_en TEXT,
    archetype_scores JSONB DEFAULT '{}', -- {"Guardian": 3, "Explorer": 1, ...}
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '[]', -- [{"question_id": "...", "option_id": "..."}]
    scores JSONB DEFAULT '{}', -- {"Guardian": 12, "Explorer": 8, ...}
    primary_archetype TEXT,
    secondary_archetype TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Archetypes Table (if not exists)
CREATE TABLE IF NOT EXISTS archetypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    name_zh TEXT,
    name_en TEXT,
    description_zh TEXT,
    description_en TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Insert Sample Archetypes
-- ============================================
INSERT INTO archetypes (name, name_zh, name_en, description_zh, description_en, icon, color) VALUES
('Guardian', '守護者', 'Guardian', '重視穩定、保護與責任', 'Values stability, protection, and responsibility', '🛡️', '#3b82f6'),
('Explorer', '探索者', 'Explorer', '追求新奇、自由與發現', 'Seeks novelty, freedom, and discovery', '🔭', '#22c55e'),
('Sage', '智者', 'Sage', '追求真理、知識與理解', 'Seeks truth, knowledge, and understanding', '📚', '#a855f7'),
('Warrior', '戰士', 'Warrior', '重視勇氣、力量與勝利', 'Values courage, strength, and victory', '⚔️', '#ef4444'),
('Caregiver', '照顧者', 'Caregiver', '重視關懷、服務與同理心', 'Values caring, service, and empathy', '💝', '#ec4899'),
('Creator', '創造者', 'Creator', '追求創新、表達與獨特', 'Pursues innovation, expression, and uniqueness', '🎨', '#f59e0b'),
('Ruler', '統治者', 'Ruler', '重視控制、秩序與領導', 'Values control, order, and leadership', '👑', '#eab308'),
('Jester', '愚者', 'Jester', '追求樂趣、輕鬆與當下', 'Seeks fun, lightness, and the present', '🃏', '#06b6d4')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Insert Sample Questions
-- ============================================
INSERT INTO quiz_questions (question_zh, order_index) VALUES
('當你面對一個困難決定時，你通常會：', 1),
('你認為人生最重要的價值是：', 2),
('在社交場合中，你傾向於：', 3),
('當你感到壓力時，你會：', 4),
('你理想的工作環境是：', 5),
('你對待規則的態度是：', 6),
('你認為改變是：', 7),
('你更喜歡：', 8)
ON CONFLICT DO NOTHING;

-- ============================================
-- Insert Sample Options (with archetype scores)
-- ============================================

-- Question 1: 當你面對一個困難決定時，你通常會：
DO $$
DECLARE
    q1_id UUID;
BEGIN
    SELECT id INTO q1_id FROM quiz_questions WHERE question_zh = '當你面對一個困難決定時，你通常會：';
    
    INSERT INTO quiz_options (question_id, option_zh, archetype_scores, order_index) VALUES
    (q1_id, '仔細分析所有可能的後果，選擇最安全的方案', '{"Guardian": 3, "Sage": 2}', 1),
    (q1_id, '跟隨直覺，選擇最有冒險精神的路', '{"Explorer": 3, "Warrior": 2}', 2),
    (q1_id, '尋求他人的意見，考慮對大家的影響', '{"Caregiver": 3, "Guardian": 1}', 3),
    (q1_id, '創造一個全新的解決方案', '{"Creator": 3, "Explorer": 1}', 4);
END $$;

-- Question 2: 你認為人生最重要的價值是：
DO $$
DECLARE
    q2_id UUID;
BEGIN
    SELECT id INTO q2_id FROM quiz_questions WHERE question_zh = '你認為人生最重要的價值是：';
    
    INSERT INTO quiz_options (question_id, option_zh, archetype_scores, order_index) VALUES
    (q2_id, '知識與智慧', '{"Sage": 3, "Guardian": 1}', 1),
    (q2_id, '自由與冒險', '{"Explorer": 3, "Jester": 1}', 2),
    (q2_id, '權力與影響力', '{"Ruler": 3, "Warrior": 1}', 3),
    (q2_id, '愛與連結', '{"Caregiver": 3, "Guardian": 1}', 4);
END $$;

-- Question 3: 在社交場合中，你傾向於：
DO $$
DECLARE
    q3_id UUID;
BEGIN
    SELECT id INTO q3_id FROM quiz_questions WHERE question_zh = '在社交場合中，你傾向於：';
    
    INSERT INTO quiz_options (question_id, option_zh, archetype_scores, order_index) VALUES
    (q3_id, '觀察並分析他人的行為', '{"Sage": 3, "Guardian": 1}', 1),
    (q3_id, '成為聚會的靈魂人物，讓大家開心', '{"Jester": 3, "Explorer": 1}', 2),
    (q3_id, '與少數親密的朋友深入交流', '{"Caregiver": 3, "Sage": 1}', 3),
    (q3_id, '主導對話，展現領導力', '{"Ruler": 3, "Warrior": 1}', 4);
END $$;

-- Question 4: 當你感到壓力時，你會：
DO $$
DECLARE
    q4_id UUID;
BEGIN
    SELECT id INTO q4_id FROM quiz_questions WHERE question_zh = '當你感到壓力時，你會：';
    
    INSERT INTO quiz_options (question_id, option_zh, archetype_scores, order_index) VALUES
    (q4_id, '制定計劃，逐步解決問題', '{"Guardian": 3, "Ruler": 2}', 1),
    (q4_id, '去一個新的地方探索轉換心情', '{"Explorer": 3, "Jester": 1}', 2),
    (q4_id, '尋求朋友或家人的支持', '{"Caregiver": 3, "Sage": 1}', 3),
    (q4_id, '正面迎戰，把壓力當作挑戰', '{"Warrior": 3, "Ruler": 1}', 4);
END $$;

-- Question 5: 你理想的工作環境是：
DO $$
DECLARE
    q5_id UUID;
BEGIN
    SELECT id INTO q5_id FROM quiz_questions WHERE question_zh = '你理想的工作環境是：';
    
    INSERT INTO quiz_options (question_id, option_zh, archetype_scores, order_index) VALUES
    (q5_id, '穩定、有明確規則和流程', '{"Guardian": 3, "Sage": 1}', 1),
    (q5_id, '充滿創意自由，可以嘗試新事物', '{"Creator": 3, "Explorer": 2}', 2),
    (q5_id, '能夠幫助他人、有社會意義', '{"Caregiver": 3, "Sage": 1}', 3),
    (q5_id, '競爭激烈，可以展現實力', '{"Warrior": 3, "Ruler": 1}', 4);
END $$;

-- Question 6: 你對待規則的態度是：
DO $$
DECLARE
    q6_id UUID;
BEGIN
    SELECT id INTO q6_id FROM quiz_questions WHERE question_zh = '你對待規則的態度是：';
    
    INSERT INTO quiz_options (question_id, option_zh, archetype_scores, order_index) VALUES
    (q6_id, '規則是為了保護大家，應該遵守', '{"Guardian": 3, "Caregiver": 1}', 1),
    (q6_id, '規則是用來打破的，要創新就要突破', '{"Creator": 3, "Explorer": 2}', 2),
    (q6_id, '規則需要智慧地解讀，不能死板', '{"Sage": 3, "Ruler": 1}', 3),
    (q6_id, '我制定規則，別人遵守', '{"Ruler": 3, "Warrior": 1}', 4);
END $$;

-- Question 7: 你認為改變是：
DO $$
DECLARE
    q7_id UUID;
BEGIN
    SELECT id INTO q7_id FROM quiz_questions WHERE question_zh = '你認為改變是：';
    
    INSERT INTO quiz_options (question_id, option_zh, archetype_scores, order_index) VALUES
    (q7_id, '令人不安的，應該謹慎對待', '{"Guardian": 3, "Caregiver": 1}', 1),
    (q7_id, '令人興奮的機會', '{"Explorer": 3, "Creator": 2}', 2),
    (q7_id, '必然的，需要智慧去引導', '{"Sage": 3, "Ruler": 1}', 3),
    (q7_id, '展現實力和適應力的時刻', '{"Warrior": 3, "Explorer": 1}', 4);
END $$;

-- Question 8: 你更喜歡：
DO $$
DECLARE
    q8_id UUID;
BEGIN
    SELECT id INTO q8_id FROM quiz_questions WHERE question_zh = '你更喜歡：';
    
    INSERT INTO quiz_options (question_id, option_zh, archetype_scores, order_index) VALUES
    (q8_id, '深入的對話和有意義的交流', '{"Sage": 3, "Caregiver": 2}', 1),
    (q8_id, '輕鬆玩樂的氛圍', '{"Jester": 3, "Explorer": 1}', 2),
    (q8_id, '有明確目標的活動', '{"Warrior": 3, "Guardian": 1}', 3),
    (q8_id, '能夠創造新事物的過程', '{"Creator": 3, "Sage": 1}', 4);
END $$;

-- ============================================
-- Enable RLS (Row Level Security)
-- ============================================
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to quiz_questions" ON quiz_questions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to quiz_options" ON quiz_options
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to archetypes" ON archetypes
    FOR SELECT USING (true);

-- Users can only read their own quiz results
CREATE POLICY "Users can read own quiz results" ON quiz_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results" ON quiz_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz results" ON quiz_results
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Grant Permissions
-- ============================================
GRANT SELECT ON quiz_questions TO anon, authenticated;
GRANT SELECT ON quiz_options TO anon, authenticated;
GRANT SELECT ON archetypes TO anon, authenticated;
GRANT ALL ON quiz_results TO authenticated;

-- ============================================
-- Verify Setup
-- ============================================
SELECT 'Quiz tables created successfully!' as status;
SELECT COUNT(*) as question_count FROM quiz_questions;
SELECT COUNT(*) as option_count FROM quiz_options;
SELECT COUNT(*) as archetype_count FROM archetypes;
