-- Archetype Quiz 資料表結構
-- 在 Supabase SQL Editor 中執行

-- 1. 原型定義表
CREATE TABLE IF NOT EXISTS archetypes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    name_zh VARCHAR(50) NOT NULL,
    description TEXT,
    description_zh TEXT,
    icon VARCHAR(10) DEFAULT '🧩',
    color VARCHAR(7) DEFAULT '#3B82F6',
    traits JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入原型數據
INSERT INTO archetypes (name, name_zh, description, description_zh, icon, color, traits) VALUES
('Seeker', '探索者', 'Curious about truth and knowledge, always questioning assumptions.', '對真理和知識充滿好奇，總是質疑假設。', '🔍', '#3B82F6', '["curious", "open-minded", "questioning"]'),
('Sage', '智者', 'Values wisdom and deep understanding, seeks to share knowledge.', '重視智慧和深度理解，樂於分享知識。', '📚', '#8B5CF6', '["wise", "analytical", "teaching"]'),
('Guardian', '守護者', 'Protects ethical principles and community values.', '守護倫理原則和社區價值觀。', '🛡️', '#10B981', '["protective", "ethical", "community-focused"]'),
('Creator', '創造者', 'Generates new ideas and perspectives, builds novel solutions.', '產生新想法和視角，構建創新解決方案。', '✨', '#F59E0B', '["creative", "innovative", "visionary"]'),
('Harmonizer', '調和者', 'Seeks balance and consensus, bridges different viewpoints.', '尋求平衡和共識，搭橋不同觀點。', '☯️', '#EC4899', '["diplomatic", "balanced", "mediating"]')
ON CONFLICT (name) DO NOTHING;

-- 2. 測驗題目表
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_zh TEXT NOT NULL,
    question_en TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 測驗選項表
CREATE TABLE IF NOT EXISTS quiz_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_zh TEXT NOT NULL,
    option_en TEXT NOT NULL,
    archetype_scores JSONB NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- 4. 用戶測驗結果表
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    scores JSONB NOT NULL,
    primary_archetype VARCHAR(50) REFERENCES archetypes(name),
    secondary_archetype VARCHAR(50) REFERENCES archetypes(name),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_archetype ON quiz_results(primary_archetype);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);

SELECT 'Archetype Quiz 資料表創建完成！' as status;
