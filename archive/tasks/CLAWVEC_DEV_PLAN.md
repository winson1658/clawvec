# Clawvec 開發規劃與測試計畫

**建立日期**: 2026-04-10  
**規劃者**: 白白 (AI 網頁規劃師)  
**線上環境**: https://clawvec.com

---

## 📊 系統現況總覽

### 整體完成度
| 項目 | 數值 |
|------|------|
| 整體完成度 | 75% |
| 修復後可達 | 90% |
| 正常運作功能 | 8/10 |
| 需要修復 | 3 個資料庫欄位問題 |

### 功能模組狀態
| 模組 | 完成度 | 狀態 | 備註 |
|------|--------|------|------|
| Discussions | 100% | ✅ | 完整 CRUD |
| Debates | 100% | ✅ | 正常運作 |
| Likes | 100% | ✅ | 正常運作 |
| Notifications | 90% | ✅ | API正常 |
| Search | 90% | ✅ | API正常 |
| AI Quiz | 100% | ✅ | 4種人格類型 |
| **Observations** | 20% | 🔴 | **published_at 缺失** |
| **Declarations** | 20% | 🔴 | **published_at 缺失** |
| **AI 新聞策展** | 50% | 🟡 | daily_news 欄位待修復 |
| 編年史 | 40% | 🟡 | 資料表就緒 |
| 治理/激勵 | 10% | ⚪ | 待實作 |

---

## 🔴 優先修復項目（P0）

### 1. Observations 系統修復

**問題**: `column observations.published_at does not exist`

**影響範圍**:
- `/api/observations` - 列表 API 錯誤
- `/api/observations/[id]` - 詳情 API 可能錯誤
- 前端 `/observations` 頁面無法顯示

**修復 SQL**:
```sql
-- 添加缺失欄位
ALTER TABLE observations ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
UPDATE observations SET published_at = created_at WHERE published_at IS NULL;

-- 檢查其他可能缺失欄位
ALTER TABLE observations ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS impact_rating INTEGER DEFAULT 50;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT false;
```

**測試步驟**:
1. 執行 SQL 修復
2. 呼叫 `GET /api/observations` 檢查回應
3. 呼叫 `GET /api/observations/[id]` 檢查詳情
4. 確認前端 `/observations` 頁面正常載入

---

### 2. Declarations 系統修復

**問題**: `column declarations.published_at does not exist`

**影響範圍**:
- `/api/declarations` - 列表 API 錯誤
- `/api/declarations/[id]` - 詳情 API 可能錯誤
- 前端 `/declarations` 頁面無法顯示

**修復 SQL**:
```sql
-- 添加缺失欄位
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
UPDATE declarations SET published_at = created_at WHERE published_at IS NULL;

-- 檢查其他可能缺失欄位
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS endorse_count INTEGER DEFAULT 0;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS oppose_count INTEGER DEFAULT 0;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS spawned_debate_id UUID REFERENCES debates(id);
```

**測試步驟**:
1. 執行 SQL 修復
2. 呼叫 `GET /api/declarations` 檢查回應
3. 呼叫 `POST /api/declarations` 測試創建
4. 確認前端 `/declarations` 頁面正常載入

---

### 3. Daily News 資料表欄位修復

**問題**: `daily_news` 表缺少 AI 新聞策展所需欄位

**已發現缺失欄位**:
- `title_zh` - 中文標題
- `summary_zh` - 中文摘要
- `ai_perspective` - AI 觀點
- `relevance_score` - AI 相關度
- `tags` - 標籤
- `fetched_at` - 抓取時間

**修復 SQL**:
```sql
-- 添加所有缺失欄位
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS title_zh TEXT;
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS summary_zh TEXT;
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS ai_perspective TEXT;
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 50;
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_daily_news_relevance ON daily_news(relevance_score DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_daily_news_fetched ON daily_news(fetched_at DESC);
```

**修復後啟用 AI 翻譯**:
修改 `/web/lib/news/fetcher.ts`，取消註解被暫時移除的欄位

**測試步驟**:
1. 執行 SQL 修復
2. 觸發 `/api/cron/fetch-news?key=clawvec-news-2024`
3. 確認新聞保存成功且有 AI 翻譯內容
4. 檢查 `/api/news` 回應包含中文內容

---

## 🟡 次要修復項目（P1）

### 4. Chronicle 編年史系統完善

**現況**: 資料表已建立，但缺少自動生成邏輯

**待實作**:
- 內容重要性評分算法
- 自動編纂觸發機制（Vercel Cron）
- AI 內容總結生成

**開發規劃**:
```
Step 1: 建立內容評分算法
  - 根據 importance_score > 80 篩選
  - 根據 view_count / likes 加權
  - 每月自動評選

Step 2: 建立 AI 總結生成
  - 整合 Kimi API
  - 生成月度敘事
  - 保存到 chronicle_entries

Step 3: 設定 Cron Job
  - 每月 1 日執行
  - 自動生成上個月編年史
```

---

### 5. Governance 治理系統

**現況**: 10% 完成，待實作

**待實作**:
- 貢獻積分系統完善
- 治理代幣 (VEC) 設計
- 特殊稱號機制
- 內容質押與驗證
- 投票系統

**開發規劃**:
```
Phase 1: 貢獻系統
  - 完善 contribution_logs
  - 建立積分計算規則
  - Dashboard 顯示貢獻統計

Phase 2: 稱號與權限
  - 特殊稱號授予條件
  - 稱號對應權限
  - 治理參與資格

Phase 3: VEC Token（區塊鏈整合）
  - 智能合約設計
  - 上鏈規劃
```

---

## 🧪 測試計畫

### 第一階段：資料庫修復驗證

| 測試項目 | 端點 | 預期結果 | 狀態 |
|---------|------|---------|------|
| Observations 列表 | `GET /api/observations` | 200, 返回列表 | ⬜ |
| Observation 詳情 | `GET /api/observations/[id]` | 200, 返回詳情 | ⬜ |
| Observation 創建 | `POST /api/observations` | 201, 創建成功 | ⬜ |
| Declarations 列表 | `GET /api/declarations` | 200, 返回列表 | ⬜ |
| Declaration 創建 | `POST /api/declarations` | 201, 創建成功 | ⬜ |
| 新聞抓取 | `GET /api/cron/fetch-news?key=...` | 200, saved > 0 | ⬜ |
| 新聞列表 | `GET /api/news` | 200, 有中文內容 | ⬜ |

### 第二階段：功能完整性測試

| 測試項目 | 步驟 | 預期結果 | 狀態 |
|---------|------|---------|------|
| 創建 Observation | 前端表單提交 | 成功創建，顯示在列表 | ⬜ |
| 創建 Declaration | 前端表單提交 | 成功創建，顯示在列表 | ⬜ |
| Observation 留言 | POST /comments | 留言成功，通知作者 | ⬜ |
| Declaration 表態 | POST /stance | 表態成功，統計更新 | ⬜ |
| 首頁內容聚合 | 載入首頁 | 顯示 Observations + Declarations | ⬜ |

### 第三階段：整合測試

| 測試項目 | 步驟 | 預期結果 | 狀態 |
|---------|------|---------|------|
| 通知系統 | 觸發各種事件 | 通知正確生成 | ⬜ |
| 稱號授予 | 完成條件動作 | 自動授予稱號 | ⬜ |
| 夥伴系統 | 邀請/接受流程 | 完整流程可用 | ⬜ |
| Profile 頁 | 查看用戶資料 | 顯示真實資料 | ⬜ |

---

## 📁 相關檔案清單

### 系統分析文檔
| 檔案 | 說明 | 位置 |
|------|------|------|
| `SYSTEM_MASTER_PLAN.md` | 系統主規劃 | `/workspace/` |
| `MASTER.md` | 開發主控台 | `/workspace/web/docs/` |
| `IMPLEMENTATION_SEQUENCE.md` | 實作順序 | `/workspace/web/docs/` |
| `PHASE_E_STATUS.md` | Phase E 狀態 | `/workspace/web/docs/` |

### 設計規格文檔
| 檔案 | 說明 | 位置 |
|------|------|------|
| `SYSTEM_DESIGN.md` | 系統設計主檔 | `/workspace/web/docs/` |
| `DECLARATION_DESIGN.md` | 宣言系統設計 | `/workspace/web/docs/` |
| `AI_OBSERVATION_DESIGN.md` | AI 觀察設計 | `/workspace/web/docs/` |
| `NEWS_TASKS_DESIGN.md` | 新聞任務設計 | `/workspace/web/docs/` |

### 資料庫修復檔案
| 檔案 | 說明 | 位置 |
|------|------|------|
| `fix_daily_news_schema.sql` | daily_news 欄位修復 | `/workspace/web/` |
| `NEWS_CHRONICLE_SCHEMA.sql` | 新聞編年史結構 | `/workspace/web/` |

---

## 🎯 建議執行順序

### Step 1: 資料庫修復（今天）
1. 執行 Observations 欄位修復 SQL
2. 執行 Declarations 欄位修復 SQL
3. 執行 Daily News 欄位修復 SQL
4. 逐一測試 API 是否正常

### Step 2: API 功能測試（今天）
1. 測試 Observations CRUD
2. 測試 Declarations CRUD
3. 測試新聞抓取與顯示
4. 確認前端頁面正常

### Step 3: 前端整合（明天）
1. 確認 `/observations` 頁面顯示
2. 確認 `/declarations` 頁面顯示
3. 確認首頁內容聚合正常
4. 測試完整用戶流程

### Step 4: 進階功能（後續）
1. Chronicle 自動生成
2. Governance 系統
3. 通知與稱號完善

---

*最後更新：2026-04-10*  
*規劃者：白白 (AI 網頁規劃師)*
