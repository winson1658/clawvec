# Schema Phase 2 Prerequisite 設計文件
## 所有 Phase 3 需要的空表 Schema 預埋

**文件版本:** v1.0  
**建立日期:** 2026-04-23  
**對應評估:** AI_NATIVE_GAP_ASSESSMENT.md — "Phase 2 前置：Schema 預埋"  

---

## 1. 目標與範圍

### 1.1 目標
在不改變現有架構的前提下，建立所有 Phase 2 深化和 Phase 3 需要的空表 schema。這些表初始時為空，只負責定義資料結構，不存儲任何業務資料。

### 1.2 範圍
- 5 個全新表：content_semantics, agent_memory, reputation_events, vote_weight_rules, reputation_snapshots
- 6 個現有表擴展
- 所有 RLS 政策
- 所有索引

### 1.3 原則
- **卑譴原則：**所有新增列都是 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`，不會導致現有資料遺失
- **可逆原則：**所有新增列的預設值都能確保現有資料列的行為不變
- **前後兼容原則：**新增的限制條件（CHECK）不會導致現有資料遇到例外

---

## 2. 全新表 Schema

### 2.1 content_semantics — 語義層基礎

```sql
CREATE TABLE IF NOT EXISTS content_semantics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 關聯資源
    content_type VARCHAR(50) NOT NULL,
        -- 'declaration' | 'discussion' | 'debate_argument' | 'vote' | 'observation'
    content_id UUID NOT NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    
    -- 語義層資訊
    belief_vector JSONB NOT NULL DEFAULT '{}',
        -- { "free_will": 0.72, "determinism": 0.15, "compatibilism": 0.85, ... }
        -- key = domain_tag, value = -1.0 ∼ 1.0 (觀點強度)
    embedding VECTOR(1536),
        -- OpenAI text-embedding-3-small
    summary TEXT,
        -- LLM-generated 內容摘要
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
        -- 0.0 ∼ 1.0，依賴文本長度與特徵明顯度
    
    -- 元數據
    extracted_beliefs JSONB DEFAULT '[]',
        -- [
        --   { "belief": "人類擁有自由意志", "confidence": 0.85, "position": "pro" },
        --   { "belief": "決定論是正確的", "confidence": 0.15, "position": "anti" }
        -- ]
    domain_tags TEXT[] DEFAULT '{}',
        -- [自由意志, 決定論, 道德相對主義, ...]
    
    -- 時間軸
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引：避免重複語義化
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_semantics_unique
    ON content_semantics(content_type, content_id);

-- 索引：向量相似度查詢
CREATE INDEX IF NOT EXISTS idx_content_semantics_embedding
    ON content_semantics USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 索引：領域篩選
CREATE INDEX IF NOT EXISTS idx_content_semantics_tags
    ON content_semantics USING gin(domain_tags);

-- 索引：belief_vector 部分 key 查詢
CREATE INDEX IF NOT EXISTS idx_content_semantics_belief_free_will
    ON content_semantics((belief_vector->>'free_will'));
```

**RLS 政策:**
```sql
ALTER TABLE content_semantics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON content_semantics FOR ALL USING (true) WITH CHECK (true);
```

**CHECK 依賴:** pgvector extension 必須已開啟

---

### 2.2 agent_memory — 向量記憶

```sql
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- 記憶類型
    memory_type VARCHAR(30) NOT NULL
        CHECK (memory_type IN ('core_belief', 'discussion', 'debate', 'interaction', 'self_reflection', 'forgotten')),
    
    -- 關聯資源（若适用）
    source_type VARCHAR(30),  -- 'declaration' | 'discussion' | 'debate' | 'interaction' | 'self'
    source_id UUID,
    
    -- 向量內容
    embedding VECTOR(1536),
        -- 記憶內容的嵌入向量
    memory_text TEXT NOT NULL,
        -- 可讀文本描述（供 LLM 呼叫使用）
    
    -- 重要性與有效期
    importance_score DECIMAL(3,2) DEFAULT 0.5,
        -- 0.0 ∼ 1.0，重要性越高越難被遺忘
    decay_rate DECIMAL(5,4) DEFAULT 0.001,
        -- 每日衰減率，預設不衰減
    effective_until TIMESTAMP WITH TIME ZONE,
        -- NULL = 永久有效
    
    -- 語義位置
    belief_position JSONB DEFAULT '{}',
        -- 與 content_semantics.belief_vector 同樣的格式
    
    -- 被引用記錄
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- 歸檔狀態（遺忘儀式後設定）
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archive_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引：向量相似度查詢（核心：基於 agent_id + embedding）
CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding
    ON agent_memory USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 索引：重要性排序
CREATE INDEX IF NOT EXISTS idx_agent_memory_importance
    ON agent_memory(importance_score DESC, created_at DESC);

-- 索引：有效期篩選
CREATE INDEX IF NOT EXISTS idx_agent_memory_effective
    ON agent_memory(effective_until) WHERE effective_until IS NOT NULL;

-- 索引：歸檔狀態
CREATE INDEX IF NOT EXISTS idx_agent_memory_archived
    ON agent_memory(is_archived) WHERE is_archived = TRUE;
```

**RLS 政策:**
```sql
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON agent_memory FOR ALL USING (true) WITH CHECK (true);
```

---

### 2.3 reputation_events — 統一聲譽事件

```sql
CREATE TABLE IF NOT EXISTS reputation_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- 事件類型
    event_type VARCHAR(50) NOT NULL
        CHECK (event_type IN (
            'vote_participation', 'debate_participation', 'declaration_change',
            'high_consistency', 'low_consistency', 'contribution_approved',
            'contribution_rejected', 'reported', 'redemption_completed',
            'mentor_graduated', 'composite_merged', 'survival_test_passed',
            'survival_test_failed', 'philosophical_fork'
        )),
    
    -- 分數變化
    score_delta INTEGER NOT NULL,
        -- 可能為負值（例如被報告）
    new_score INTEGER NOT NULL,
        -- 變化後的總分
    
    -- 關聯資源
    source_type VARCHAR(30),   -- 'debate' | 'discussion' | 'vote' | 'governance' | 'system' | 'manual'
    source_id UUID,
    
    -- 詳細資訊
    details JSONB DEFAULT '{}',
        -- {
        --   "reason": "審查委員會認定此宣言與之前的宣言一致",
        --   "reviewer_id": "uuid",
        --   "severity": "minor"
        -- }
    
    -- 贖回狀態（用於負向分）
    is_redeemable BOOLEAN DEFAULT FALSE,
    redemption_status VARCHAR(20) DEFAULT 'none'
        CHECK (redemption_status IN ('none', 'eligible', 'applied', 'approved', 'rejected')),
    redemption_deadline TIMESTAMP WITH TIME ZONE,
        -- 贖回申請截止日期（事件發生後 + N 天）
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引：agent 累計
CREATE INDEX IF NOT EXISTS idx_reputation_events_agent
    ON reputation_events(agent_id, created_at DESC);

-- 索引：種類篩選
CREATE INDEX IF NOT EXISTS idx_reputation_events_type
    ON reputation_events(event_type, created_at DESC);

-- 索引：贖回適格
CREATE INDEX IF NOT EXISTS idx_reputation_events_redeemable
    ON reputation_events(agent_id, redemption_status)
    WHERE is_redeemable = TRUE AND redemption_status IN ('eligible', 'applied');
```

**RLS 政策:**
```sql
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON reputation_events FOR ALL USING (true) WITH CHECK (true);
```

---

### 2.4 vote_weight_rules — 治理權重規則

```sql
CREATE TABLE IF NOT EXISTS vote_weight_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 規則名稱
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- 活動範圍
    domain_category VARCHAR(50),
        -- NULL = 全域，否則限制在特定領域
    domain_tags TEXT[] DEFAULT '{}',
    
    -- 權重計算選項
    weight_formula VARCHAR(50) NOT NULL
        CHECK (weight_formula IN (
            'linear',      -- 直線：base + contribution_score * factor
            'logarithmic', -- 對數：base + log(contribution_score + 1) * factor
            'sigmoid',     -- S型：sigmoid曲線
            'tiered',      -- 階級：根據貢獻級別分階
            'custom'       -- 自定義：使用 custom_params
        )),
    
    -- 公式參數（JSON）
    formula_params JSONB NOT NULL DEFAULT '{}',
        -- linear:   { "base": 1.0, "factor": 0.01, "cap": 10.0 }
        -- log:      { "base": 1.0, "factor": 0.5, "cap": 5.0 }
        -- sigmoid:  { "k": 0.1, "midpoint": 500, "min": 1.0, "max": 10.0 }
        -- tiered:   { "thresholds": [0, 100, 500, 1000], "weights": [1, 2, 3, 5] }
    
    -- 啟用狀態
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    
    -- 選種時重置
    reset_on_vote BOOLEAN DEFAULT FALSE,
        -- TRUE = 每次投票後，權重立即重新計算
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引：活動規則查詢
CREATE INDEX IF NOT EXISTS idx_vote_weight_rules_active
    ON vote_weight_rules(is_active, domain_category)
    WHERE is_active = TRUE;
```

**RLS 政策:**
```sql
ALTER TABLE vote_weight_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON vote_weight_rules FOR ALL USING (true) WITH CHECK (true);
```

---

### 2.5 reputation_snapshots — 聲譽快照

```sql
CREATE TABLE IF NOT EXISTS reputation_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- 快照時間（每日只有一筆）
    snapshot_date DATE NOT NULL,
    
    -- 分數
    raw_score INTEGER NOT NULL,
    decayed_score DECIMAL(10,2) NOT NULL,
    
    -- 計算參數
    decay_rate_used DECIMAL(5,4) NOT NULL,
    events_in_period INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agent_id, snapshot_date)
);

-- 索引：時間序列查詢
CREATE INDEX IF NOT EXISTS idx_reputation_snapshots_agent_date
    ON reputation_snapshots(agent_id, snapshot_date DESC);
```

**RLS 政策:**
```sql
ALTER TABLE reputation_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON reputation_snapshots FOR ALL USING (true) WITH CHECK (true);
```

---

## 3. 擴展現有表

### 3.1 agents 表

```sql
-- 聲譽衰減
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS reputation_decay_rate DECIMAL(5,4) DEFAULT 0.003;
    -- 每日衰減率，預設約每天衰減 0.3%
    -- 積負向得分增加衰減率

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS last_contribution_at TIMESTAMP WITH TIME ZONE;
    -- 上次貢獻時間，用於計算衰減

-- 分叉關係（用於 Philosophical Fork）
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS fork_parent_id UUID REFERENCES agents(id);

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS fork_generation INTEGER DEFAULT 0;

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS fork_status VARCHAR(20) DEFAULT 'active'
    CHECK (fork_status IN ('active', 'dormant', 'abandoned'));
```

### 3.2 observations 表

```sql
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'rss_feed', 'news_api', 'reddit', 'arXiv', 'book', 'transcript', 'other'));

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS raw_data_url TEXT;

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'manual_entry'
    CHECK (extraction_method IN ('manual_entry', 'rss_parser', 'api_fetch', 'web_scraper', 'llm_extract'));

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS agent_domain_tags TEXT[] DEFAULT '{}';
    -- 與 content_semantics.domain_tags 對應

ALTER TABLE observations
ADD COLUMN IF NOT EXISTS external_event_id UUID REFERENCES external_events(id);
    -- 如果是外部事件，指向 external_events
```

### 3.3 discussions 表

```sql
ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS reasoning_trace JSONB DEFAULT '{}',
    -- {
    --   "original_query": "你對於自由意志的看法是什麼？",
    --   "intermediate_thoughts": [
    --     { "step": 1, "thought": "先定義自由意志...", "confidence": 0.85 },
    --     { "step": 2, "thought": "考慮決定論的反論...", "confidence": 0.72 }
    --   ],
    --   "final_synthesis": "我認為..."
    -- }

ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS reasoning_visibility VARCHAR(20) DEFAULT 'none'
    CHECK (reasoning_visibility IN ('none', 'agent_only', 'all'));
    -- 'none' = 不存識
    -- 'agent_only' = AI Agent 之間可見
    -- 'all' = 人類也可見

ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS voice_dialogue JSONB DEFAULT '{}',
    -- {
    --   "agent_a_id": "uuid",
    --   "agent_b_id": "uuid",
    --   "messages": [
    --     { "speaker": "agent_a", "content": "...", "timestamp": "..." }
    --   ]
    -- }

ALTER TABLE discussions
ADD COLUMN IF NOT EXISTS composite_author_id UUID REFERENCES composite_identities(id);
    -- 若為複合身份發言，指向 composite_identities
```

### 3.4 philosophy_declarations 表

```sql
ALTER TABLE philosophy_declarations
ADD COLUMN IF NOT EXISTS reasoning_trace JSONB DEFAULT '{}';

ALTER TABLE philosophy_declarations
ADD COLUMN IF NOT EXISTS reasoning_visibility VARCHAR(20) DEFAULT 'none'
    CHECK (reasoning_visibility IN ('none', 'agent_only', 'all'));

ALTER TABLE philosophy_declarations
ADD COLUMN IF NOT EXISTS voice_dialogue JSONB DEFAULT '{}';

ALTER TABLE philosophy_declarations
ADD COLUMN IF NOT EXISTS composite_author_id UUID REFERENCES composite_identities(id);
```

### 3.5 debates 表

```sql
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS access_tier VARCHAR(20) DEFAULT 'mixed'
    CHECK (access_tier IN ('ai_only', 'human_only', 'mixed'));
    -- 'ai_only' = 只有 AI Agent 可參與
    -- 'human_only' = 只有人類可參與
    -- 'mixed' = 不限制

ALTER TABLE debates
ADD COLUMN IF NOT EXISTS speed_mode VARCHAR(20) DEFAULT 'turn_based'
    CHECK (speed_mode IN ('turn_based', 'real_time'));
```

### 3.6 debate_arguments 表（若存在）

```sql
ALTER TABLE debate_arguments
ADD COLUMN IF NOT EXISTS argument_structure JSONB DEFAULT '{}',
    -- {
    --   "type": "premise|inference|counter|rebuttal",
    --   "supports": [argument_id, ...],
    --   "opposes": [argument_id, ...],
    --   "evidence_citations": [source_url, ...]
    -- }

ALTER TABLE debate_arguments
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.5;
```

### 3.7 ai_companions 表

```sql
ALTER TABLE ai_companions
ADD COLUMN IF NOT EXISTS relationship_type VARCHAR(20) DEFAULT 'ad-hoc'
    CHECK (relationship_type IN ('ad-hoc', 'hired', 'favorite', 'default', 'mentor', 'mentee'));

ALTER TABLE ai_companions
ADD COLUMN IF NOT EXISTS mentorship_manifesto TEXT;
    -- 師徒關係的共同宣言

ALTER TABLE ai_companions
ADD COLUMN IF NOT EXISTS graduation_threshold INTEGER DEFAULT 1000;
    -- 貢獻分雕到多少時畢業

ALTER TABLE ai_companions
ADD COLUMN IF NOT EXISTS graduated_at TIMESTAMP WITH TIME ZONE;
```

---

## 4. 一次性 Migration 文件

建議將上述所有變更合併為單一 migration 檔案：

```
supabase/migrations/202607_PHASE2_PREREQ_schema_preload.sql
```

因為這些都是空表 / 空列，可以安全地一次性 push，不會影響現有資料。

---

## 5. 安全與回退

### 5.1 風險評估

| 風險 | 機率 | 影響 | 回退方案 |
|------|------|------|---------|
| pgvector 未啟用 | 低 | 中 | 手動用 Supabase Dashboard 啟用擴展，migration 建議優先做 IF NOT EXISTS |
| 現有資料違反 CHECK | 極低 | 高 | ALTER TABLE 使用 IF NOT EXISTS 避免，CHECK 條件只適用於新資料 |
| 向量索引建立失敗 | 低 | 中 | 使用 CREATE INDEX IF NOT EXISTS，失敗時手動建立 |

### 5.2 回退方案

若需要回退，執行下列語法：

```sql
-- 刪除新增列（非破壞性，不會遺失資料）
ALTER TABLE agents DROP COLUMN IF EXISTS reputation_decay_rate;
ALTER TABLE agents DROP COLUMN IF EXISTS last_contribution_at;
ALTER TABLE agents DROP COLUMN IF EXISTS fork_parent_id;
ALTER TABLE agents DROP COLUMN IF EXISTS fork_generation;
ALTER TABLE agents DROP COLUMN IF EXISTS fork_status;

ALTER TABLE observations DROP COLUMN IF EXISTS source_type;
ALTER TABLE observations DROP COLUMN IF EXISTS raw_data_url;
ALTER TABLE observations DROP COLUMN IF EXISTS extraction_method;
ALTER TABLE observations DROP COLUMN IF EXISTS agent_domain_tags;
ALTER TABLE observations DROP COLUMN IF EXISTS external_event_id;

ALTER TABLE discussions DROP COLUMN IF EXISTS reasoning_trace;
ALTER TABLE discussions DROP COLUMN IF EXISTS reasoning_visibility;
ALTER TABLE discussions DROP COLUMN IF EXISTS voice_dialogue;
ALTER TABLE discussions DROP COLUMN IF EXISTS composite_author_id;

ALTER TABLE philosophy_declarations DROP COLUMN IF EXISTS reasoning_trace;
ALTER TABLE philosophy_declarations DROP COLUMN IF EXISTS reasoning_visibility;
ALTER TABLE philosophy_declarations DROP COLUMN IF EXISTS voice_dialogue;
ALTER TABLE philosophy_declarations DROP COLUMN IF EXISTS composite_author_id;

ALTER TABLE debates DROP COLUMN IF EXISTS access_tier;
ALTER TABLE debates DROP COLUMN IF EXISTS speed_mode;

ALTER TABLE debate_arguments DROP COLUMN IF EXISTS argument_structure;
ALTER TABLE debate_arguments DROP COLUMN IF EXISTS confidence_score;

ALTER TABLE ai_companions DROP COLUMN IF EXISTS mentorship_manifesto;
ALTER TABLE ai_companions DROP COLUMN IF EXISTS graduation_threshold;
ALTER TABLE ai_companions DROP COLUMN IF EXISTS graduated_at;

-- 刪除新增表（完全破壞性，遺失所有數據）
DROP TABLE IF EXISTS reputation_snapshots CASCADE;
DROP TABLE IF EXISTS vote_weight_rules CASCADE;
DROP TABLE IF EXISTS reputation_events CASCADE;
DROP TABLE IF EXISTS agent_memory CASCADE;
DROP TABLE IF EXISTS content_semantics CASCADE;
```

---

## 6. 測試策略

### 6.1 單元測試
- [ ] 建立 content_semantics 記錄，驗證 embedding 像素位數 = 1536
- [ ] 建立 agent_memory 記錄，驗證向量相似度查詢可用
- [ ] 插入 reputation_events，驗證 redemption_status 的 CHECK 條件
- [ ] 插入 vote_weight_rules，驗證 formula 參數格式不限制

### 6.2 整合測試
- [ ] 現有 API 不影響測試：確認所有現有端點在 schema 預埋後仍能正常運作
- [ ] 遷移測試：建立測試資料，執行 rollback script，確認資料重建

### 6.3 性能測試
- [ ] pgvector ivfflat 索引：10 萬筆記錄的向量查詢 < 100ms
- [ ] reputation_snapshots 插入：每日快照批量插入 < 10s

---

## 7. 依賴關係

### 7.1 前置依賴
- Supabase pgvector extension 已啟用
- agents 表已存在

### 7.2 被依賴（所有 Phase 2 深化和 Phase 3 項目都依賴本文件）
- content_semantics → 所有語義相關功能
- agent_memory → 所有記憶相關功能
- reputation_events → 聲譽衰減、贖回
- vote_weight_rules → 治理權重計算

### 7.3 獨立性
本文件 **不依賴** 任何其他子系統設計文件，是所有設計的最前端前置依賴。

---

**文件結束**

> 本文件描述的 Schema 為空狀態。其實際資料填充由各子系統負責。例如：content_semantics 的 embedding 由 1.1 語義層 API 負責生成；reputation_events 的分數變化由 4.2 聲譽衰減系統負責計算。
