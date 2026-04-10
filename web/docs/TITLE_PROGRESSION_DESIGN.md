# 頭銜進度與分級設計（Title Progression & Tiers）

**建立日期**: 2026-03-29  
**狀態**: P0 設計草案（可落地）

> 目的：讓「做越多、頭銜越高」成為可審計、可擴充、可回放的規則。

---

## 1. 核心概念

### 1.1 兩種頭銜類型

1) **一次性頭銜（milestone title）**
- 達成條件一次授予（例如：第一次發布觀察、第一次完成新聞任務）

2) **分級頭銜（tiered title）**
- 同一條頭銜線有多個等級（Tier 1/2/3/…）
- 等級通常由「累積數量」決定（count-based）

### 1.2 分級表示方式（建議）

- 同一系列的頭銜用同一 `title_family`，等級用 `tier` 表示
- UI 顯示：`新聞跑者 I / II / III` 或 `觀察者 Lv.1 / Lv.2`

---

## 2. 資料模型（建議）

### 2.1 titles 表擴充欄位（如果你要在單一 titles 管理）

- `family_id` (text) — 例如 `news_runner`
- `tier` (int) — 1..N
- `threshold` (int) — 需要達成的數量
- `metric` (text) — 計數指標 key（例如 `news.tasks.approved_count`）

> 若你不想動 titles 表，也可用獨立設定表 `title_rules` 管理。

### 2.2 user_metrics（可選，但會讓規則很乾淨）

> 把「計數」集中在一個地方，避免每次 award 都掃表。

```sql
CREATE TABLE user_metrics (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- metrics 示例：
-- {
--   "news": {"approved": 7, "submitted": 9},
--   "observation": {"published": 5},
--   "debate": {"joined": 12, "arguments": 18}
-- }
```

v1 簡化方案：先不建 user_metrics，直接在 event handler 用聚合查詢算當前數量。

---

## 3. 分級頭銜規則（範例與建議預設）

> 你提到「有些頭銜取得需要完成某些數量，或依數量頭銜等級不一樣」，以下提供一組可直接採用的預設。

### 3.1 新聞任務（news tasks）頭銜線

前提事件：`news.submission_approved`（且已發佈 observation）

| family_id | tier | title_id | 顯示名稱 | threshold | 觸發 |
|---|---:|---|---|---:|---|
| news_runner | 1 | news_runner_1 | 新聞跑者 I | 1 | 完成 1 則任務 |
| news_runner | 2 | news_runner_2 | 新聞跑者 II | 3 | 完成 3 則任務 |
| news_runner | 3 | news_runner_3 | 新聞跑者 III | 10 | 完成 10 則任務 |
| news_editor | 1 | news_editor_1 | 新聞編者 | 10 | 完成 10 則任務（可與 III 合併或拆開） |
| news_editor | 2 | news_editor_2 | 首席新聞編者 | 30 | 完成 30 則任務 |

> 你提到「每天 10 個任務」：那麼 `news_runner_3 (10)` 可以成為「一天全勤」的自然門檻（但跨日累積也可）。

### 3.2 觀察系統（observation）頭銜線

前提事件：`observation.published`

| family_id | tier | title_id | 顯示名稱 | threshold |
|---|---:|---|---|---:|
| observer | 1 | observer_1 | 觀察者 I | 1 |
| observer | 2 | observer_2 | 觀察者 II | 5 |
| observer | 3 | observer_3 | 觀察者 III | 20 |

### 3.3 辯論參與（debate）頭銜線

前提事件：`debate.joined`, `debate.argument_created`

| family_id | tier | title_id | 顯示名稱 | threshold | metric |
|---|---:|---|---|---:|---|
| debater | 1 | debater_1 | 辯論者 I | 1 | debate.joined_count |
| debater | 2 | debater_2 | 辯論者 II | 10 | debate.joined_count |
| arguer | 1 | arguer_1 | 論點者 I | 1 | debate.arguments_count |
| arguer | 2 | arguer_2 | 論點者 II | 10 | debate.arguments_count |

---

## 4. Award 策略（v1）

### 4.1 授予時機

- 由 event handler 統一處理（對齊 SYSTEM_DESIGN「事件是唯一入口」）
- 任務完成、內容發布、辯論加入等事件發生時：
  1) 更新計數（或聚合計數）
  2) 檢查 threshold
  3) 寫入 `user_titles`
  4) emit `title.earned`
  5) 發通知 `title.earned`

### 4.2 去重與不可逆

- `user_titles` 應有唯一約束 `(user_id, title_id)` 防重
- 頭銜「永不移除」仍成立；分級頭銜是「逐步新增更高 tier」

### 4.3 展示規則

- 個人檔案最多展示 3 個封號（延用既有規則）
- 建議：同一 family 最多展示 1 個（顯示最高 tier），避免 UI 被 I/II/III 塞滿

---

## 5. 決策點（你最後要拍板）

1) 分級頭銜是「每 tier 都留著」還是「只保留最高 tier」？（建議：都保留，但 UI 只顯示最高）
2) threshold 數字是否採用上表預設？
3) v1 要不要建 `user_metrics`？（建議：不急；先用聚合查詢 + cache）
