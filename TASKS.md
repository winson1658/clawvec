# TASKS.md

## 進行中
| #ID | 功能 | 開始時間 | 備注 |
|-----|------|---------|------|

## 待辦
| #ID | 功能 | 依賴 | 優先級 |
|-----|------|------|--------|
| （無待辦任務）|

## 已完成
| #ID | 功能 | 完成時間 | 關聯文件 |
|-----|------|---------|---------|
| #001-#035 | 舊版 Clawvec v1.0 所有任務 | 2026-06-22 | 全部已隱藏至 features/[_archived]/ |
| #036 | 六憲法 v2.0 重構 | 2026-06-23 | PROJECT/ARCHITECTURE/SCHEMA/TASKS/AI_WORKFLOW/CONTEXT |
| #037 | 隱藏所有舊版分頁 | 2026-06-23 | src/app/_archived/ |
| #038 | PageNav 雙頁切換 | 2026-06-23 | src/components/PageNav.tsx |
| #039 | particles + fragments 資料表 | 2026-06-23 | supabase/migrations/0021-0023 |
| #040 | Page 1 Canvas + 粒子渲染 | 2026-06-23 | features/universe/engine/renderer.ts |
| #041 | N 體物理引擎 | 2026-06-23 | features/universe/engine/nbody.ts, particle.ts |
| #042 | 拖曳投放控制 | 2026-06-23 | features/universe/hooks/useUniverse.ts |
| #043 | Page 2 Canvas 碎片漂流 | 2026-06-23 | features/fragments/engine/drift.ts, renderer.ts |
| #044 | 五選一提交表單 | 2026-06-23 | features/fragments/components/SubmitFragment.tsx |
| #045 | 相似碎片連線 | 2026-06-23 | features/fragments/engine/drift.ts (findConnections) |
| #046 | Embedding API + DB 橋接 | 2026-06-23 | app/api/fragments/route.ts, particles/route.ts |

---

## 對話開頭模板（每次新對話必用）

```
CONTEXT.md：
你好，我們繼續開發 AI Universe。
當前項目狀態：
- CONTEXT.md：[貼上全文]
- 當前任務：[任務單內容]

請先確認你理解項目背景，然後開始執行任務 #[編號]。
不需要重複讀取 PROJECT.md 和 ARCHITECTURE.md，CONTEXT.md 已包含核心摘要
```

---

## 標準任務單格式

每一個功能開發，必須先填寫完整任務單，再交給 AI 執行。

```markdown
## 任務單 #[編號]
**功能名稱**：
**任務描述**：

**影響文件清單**（必須明確列出）：
- 新建：
- 修改：
- 刪除：

**不得觸碰的文件**：

**輸入**：

**輸出**：

**邊界條件**：
- [ ]

**使用的現有資源**：

**完成標準**：
- TypeScript 無類型錯誤
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
```

---

## AI 自我檢查清單（每次完成任務必用）

### 任務完成自查清單 #[任務編號]

**架構合規性**
- [ ] 新文件放在了正確的目錄層（符合 ARCHITECTURE.md）
- [ ] 沒有修改任務單範圍外的文件
- [ ] 模塊間依賴方向正確（無反向依賴）

**數據合規性**
- [ ] 所有類型引用自 types/ 目錄，無重複定義
- [ ] 如有修改 domain.types.ts，已確認影響面

**代碼質量**
- [ ] TypeScript 無類型錯誤（tsc --noEmit 通過）
- [ ] 所有邊界條件（loading / error / empty）已處理
- [ ] 無 console.log 遺留（只保留 console.error）

**狀態管理**
- [ ] 服務端數據用 TanStack Query，未重複存入 Zustand
- [ ] Store 中無 API 調用邏輯

**樣式**
- [ ] Page 1 使用 #0a0a14 深空底色
- [ ] Page 2 同樣使用 #0a0a14 底色
- [ ] 無硬編碼顏色值

**文件更新**
- [ ] TASKS.md 已更新（任務移入已完成）
- [ ] 如有新模塊，ARCHITECTURE.md 已登記
