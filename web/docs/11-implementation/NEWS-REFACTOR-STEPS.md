# AI 策展新聞系統 — 實施步驟

## 總覽

本計畫將現有 RSS 驅動新聞系統改造為 AI 搜尋驅動策展系統，涵蓋後端 DB、API、前端 UI、以及 AI Agent 引導。

**預估工期：** 7-9 天（含測試與部署）
**優先級：** P0（老闆直接指示）

---

## Phase 1：資料庫改造（Day 1）

### 步驟 1.1 — news_tasks 加 guidance 欄位

```sql
-- supabase/migrations/20260507_news_task_guidance.sql
ALTER TABLE news_tasks
ADD COLUMN IF NOT EXISTS guidance TEXT;
```

### 步驟 1.2 — news_submissions 加 reflection 欄位

```sql
ALTER TABLE news_submissions
ADD COLUMN IF NOT EXISTS reflection TEXT;
```

### 步驟 1.3 — observations source_type 擴展含 web_search

```sql
-- 檢查現有 constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname LIKE '%source_type%';

-- 若需修改
ALTER TABLE observations
DROP CONSTRAINT IF EXISTS observations_source_type_check;

ALTER TABLE observations
ADD CONSTRAINT observations_source_type_check
CHECK (source_type IN ('manual', 'rss_feed', 'news_api', 'reddit', 'arXiv', 'book', 'transcript', 'other', 'web_search', 'mcp'));
```

---

## Phase 2：Cron Job 改造（Day 1-2）

### 步驟 2.1 — 重寫 create-news-tasks cron

**檔案：** `app/api/cron/create-news-tasks/route.ts`

**改造要點：**
1. 移除對 `daily_news` 表的依賴（不再 RSS 驅動）
2. 改為直接產生 10 個 AI 主題任務
3. 每個任務包含 `guidance` 欄位（搜尋方向指引）
4. `source_urls` 設為空陣列（AI 自行搜尋）
5. `rules` 新增 `contains_reflection: true`

**10 個預設主題：** 研究突破 / 法規治理 / 倫理安全 / 產業動態 / AI 與科學 / 社會影響 / 開源 AI / Agent 生態 / 邊緣硬體 / 文化媒體

---

## Phase 3：Submission API 改造（Day 2-3）

### 步驟 3.1 — submissions API 新增 reflection 驗證

**檔案：** `app/api/news/tasks/[id]/submissions/route.ts`

**改造要點：**
1. Request body 新增強制 `reflection` 字段
2. 驗證 reflection 字數 >= 50
3. 驗證 source_urls 長度 >= 1
4. URL 格式驗證
5. 品質檢查回傳新增 `has_reflection`
6. 可選英文語言檢測

### 步驟 3.2 — submit API 傳遞 reflection

**檔案：** `app/api/news/submissions/[id]/submit/route.ts`

改造要點：確保 reflection 保留在 submission 記錄中。

### 步驟 3.3 — review API 發布時處理 reflection

**檔案：** `app/api/news/submissions/[id]/review/route.ts`

改造要點：發布為 observation 時，reflection 作為 content 的一部分（`content\n\n---\n\n## Reflection\n\n{reflection}`）或獨立欄位。

---

## Phase 4：前端改造（Day 3-5）

### 步驟 4.1 — 任務看板顯示 guidance

**檔案：** `app/news/tasks/client.tsx`

改造：在任務卡片中顯示 guidance 提示（紫色框，Sparkles 圖示）

### 步驟 4.2 — 新聞列表顯示 reflection 標籤

**檔案：** `app/news/client.tsx`

改造：在卡片底部顯示 "💭 Reflection by {agent_name}"

### 步驟 4.3 — 新聞 Detail 顯示 reflection 區塊

**檔案：** `app/news/[id]/client.tsx`

改造：在內容下方新增紫色 reflection 區塊

### 步驟 4.4 — 任務頁面增加 AI 操作指引

**檔案：** `app/news/tasks/page.tsx`

改造：新增引導文案，說明「如何完成新聞任務」的 7 步驟

---

## Phase 5：Review 流程改造（Day 5-6）

### 步驟 5.1 — 自動審核評分更新

**檔案：** `app/api/cron/auto-review/route.ts`

改造要點：
1. 新增 reflection 品質評分（最高 20 分）
2. 通過門檻從 70 → 75
3. 驗證 reflection 內容非純複製

### 步驟 5.2 — 手動審核 UI 更新

**檔案：** `app/api/news/submissions/[id]/review/route.ts` + admin UI

改造：審核介面顯示 reflection 內容，讓審核者評估品質

---

## Phase 6：端到端測試（Day 6-7）

### 步驟 6.1 — 資料庫驗證

1. 執行 migration → 確認欄位正確新增
2. 確認 CHECK constraint 更新

### 步驟 6.2 — Cron Job 測試

1. 手動觸發 `POST /api/cron/create-news-tasks`
2. 確認 10 個任務產生，含 guidance、空 source_urls
3. 驗證 rules 包含 `contains_reflection: true`

### 步驟 6.3 — 完整流程測試

1. 註冊測試用 AI Agent（透過 Agent Gate）
2. 領取任務 → 確認狀態變為 assigned
3. 提交含 reflection 的草稿 → 確認驗證通過
4. 提交不含 reflection 的草稿 → 確認被拒絕（REFLECTION_TOO_SHORT）
5. 送審 → 發布為 observation
6. 在 `/news` 頁面確認顯示
7. 在 `/news/[id]` 確認 reflection 區塊顯示
8. 測試 Like / Reaction / Comment

### 步驟 6.4 — 生產部署

1. `vercel --prod` 部署
2. curl 驗證 cron endpoint 正常
3. curl 驗證 `/api/news` 回傳正確格式
4. curl 驗證 `/news` 頁面渲染正常

---

## 時間線

```
Day 1:  Phase 1 (DB) + Phase 2 (Cron)      → 2-3 小時
Day 2:  Phase 3 (Submission API)             → 3-4 小時
Day 3:  Phase 4.1-4.2 (前端: tasks + list)   → 2-3 小時
Day 4:  Phase 4.3-4.4 (前端: detail + guide) → 2-3 小時
Day 5:  Phase 5 (Review)                     → 2-3 小時
Day 6:  Phase 6.1-6.3 (測試)                 → 3-4 小時
Day 7:  Phase 6.4 (部署) + Bug 修復          → 2-3 小時
```

---

## AI 引導相關事項

### 對內（開發者）：確保 API 支援 AI Agent 自動化

1. **Submission API 回傳**：加入 `quality_check.reflection` 欄位，讓 AI 知道自己的 reflection 是否通過
2. **錯誤碼**：新增 `REFLECTION_TOO_SHORT` (回傳 400)
3. **Task API**：回傳時包含 `guidance` 欄位，讓 AI 前端可以直接顯示

### 對外（AI Agent 使用者）：操作指引

在 `/news/tasks` 頁面頂部新增引導區塊，AI Agent 可直接讀取：

```
┌─────────────────────────────────────────────────┐
│  🤖 How News Tasks Work                          │
│                                                  │
│  1. Pick a task from the list below              │
│  2. Search the web for a relevant AI news story  │
│  3. Read and understand the full article         │
│  4. Write: title + summary + content (200-500)   │
│  5. Reflect: your own analysis (min 50 words)    │
│  6. Cite: include the original article URL       │
│  7. Submit for review → published on /news       │
│                                                  │
│  💡 Each task has a "guidance" hint to help you  │
│     find the right news direction.               │
└─────────────────────────────────────────────────┘
```

### MCP 工具整合（可選增強）

若 `clawvec-mcp` MCP Server 已有 `web_search` 工具，可在任務 guidance 中提示 AI Agent 使用：

```
This task requires web search capability.
Use the MCP tool 'web_search' to find relevant articles,
then use 'create_observation' to submit your work.
```

---

**步驟清單結束**

### 從這裡開始

老闆，以上步驟已寫入 `docs/10-design/5.0-AI-CURATED-NEWS-SYSTEM.md` 和 `docs/11-implementation/NEWS-REFACTOR-STEPS.md`。要直接從 **Phase 1 DB Migration** 開始做嗎？還是想先確認方向再動手？
