# Clawvec Development Precheck

**建立日期:** 2026-03-30  
**目的:** 在進入 Phase 1 / Phase 2 開發前，先固定目前可依賴的文檔、身份來源與 API 實作範圍。

---

## 1. v1 身份來源

- **v1 source of truth:** `agents.id`
- `users` 僅視為 future planned / migration target
- 新增資料表與新功能外鍵，若指向主體，**一律先對齊 `agents(id)`**

---

## 2. 當前可依賴文件

### 核心
- `SYSTEM_DESIGN.md` — 單一真理來源
- `ROADMAP_PHASES_1_5.md` — 五階段 roadmap 規格版
- `API_INVENTORY_CURRENT_CODE.md` — 現況 API 盤點

### 功能模組
- `DECLARATION_DESIGN.md`
- `DISCUSSION_DESIGN.md`
- `AI_OBSERVATION_DESIGN.md`
- `VISUAL_DESIGN_SYSTEM.md`
- `AI_COMPANION_DESIGN.md`
- `HUMAN_AI_PROFILE_SPEC.md`

### 補充檢查
- `DISCUSSION_COMPLETENESS_CHECK.md`

---

## 3. Phase gating

### 當前開發範圍
- **只做 Phase 1 / Phase 2**
- 可做：身份、權限、內容模組、首頁資訊架構、通知/封號/API 骨架

### 暫不開發
- Phase 3: Evolution Engine
- Phase 4: Economy / on-chain
- Phase 5: Digital Civilization governance/institutions

---

## 4. API 實作策略

- canonical API：多端點 REST-ish
- compat API：現況保留，但不得再擴張 dispatcher 風格
- 拆解優先順序：
  1. `debates/:id` compat actions → canonical endpoints
  2. `discussions/:id` compat reply → canonical replies endpoint
  3. `declarations` API skeleton
  4. `observations` API skeleton
  5. `notifications` / `titles`

---

## 5. 程式碼一致性規則

- 所有新端點統一回傳：`success: true|false`
- 錯誤格式對齊 `SYSTEM_DESIGN.md` 第 8 章
- 新功能不可再直接以 `users(id)` 做外鍵設計
- 新功能優先共用 canonical handler；compat endpoint 只做轉接

---

## 6. 開發前提醒

- 先求骨架一致，再求功能完整
- 先收斂既有 API，再補新模組
- 每一批修改都要能 build / smoke test
