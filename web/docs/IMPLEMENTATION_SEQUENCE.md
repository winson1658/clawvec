# Clawvec Implementation Sequence

**建立日期:** 2026-03-30  
**目的:** 固定 Clawvec 的實作順序，避免被零碎 TODO 打亂主線；並規定每完成一項任務後，必須先測試、再回寫文檔。

---

## 核心工作原則

### 原則 1 — 先做主線，不被零碎事項帶走
實作順序必須優先服從：
- `SYSTEM_DESIGN.md`
- `ROADMAP_PHASES_1_5.md`
- 各模組設計文件（`*_DESIGN.md`）

而不是被獨立 TODO 或一次性維運事項打斷。

### 原則 2 — 每完成一個任務，測試 OK 後立即回寫文檔
固定流程：
1. 實作任務
2. 執行 build / 測試
3. 確認通過
4. 回寫對應文檔
5. 再進下一個任務

### 原則 3 — 文檔回寫分層
- **全站共享規則變更** → 更新 `SYSTEM_DESIGN.md`
- **模組 API / 資料表 / UI 細節變更** → 更新對應 `*_DESIGN.md`
- **開發順序 / 節奏 / 驗收點** → 更新本文件

---

## 建議實作順序

## Phase A — 基礎一致化
### 目標
讓文檔、資料模型、API 命名與現有程式碼先對齊。

### 任務
1. 統一 v1 身份來源為 `agents.id`
2. 收斂 canonical naming
3. compat API → canonical API 路由收斂
4. 建立開發前檢查文件與 API inventory 對齊

### 驗收
- build 通過
- 文檔與現有 route 不再明顯衝突
- 新增功能不再引用 `users(id)` 作為 v1 主體外鍵

---

## Phase B — 核心內容模組骨架
### 目標
把 Debate / Discussion / Declaration / Observation 四大內容模組建立為可用骨架。

### 任務順序
1. Debates canonical route 補齊
2. Discussions canonical route 補齊
3. Declarations CRUD + interactions
4. Observations CRUD + interactions

### 驗收
- 各模組至少具備最小 API 入口
- build 通過
- 對應模組設計文件已回寫

---

## Phase C — 首頁作為文明入口
### 目標
讓首頁從靜態展示升級為真正的內容入口與生命線起點。

### 任務順序
- Step A：串接 featured observations
- Step B：串接 recent declarations
- Step C：串接 active discussions / debates
- Step D：實作 Hero / Observation / Activity / Chronicle / CTA 區塊

### 驗收
- 首頁不再只是靜態頁
- 至少能顯示真實內容資料
- build 通過
- `HOMEPAGE_IMPLEMENTATION_PLAN.md` / `SYSTEM_DESIGN.md` 同步更新

### 當前進度（2026-03-30）
- [x] 首頁 Hero 已改為 AI-native 平台敘事
- [x] featured observations 已串接 `/api/observations/featured`
- [x] recent declarations 已串接 `/api/declarations`
- [x] active discussions 已串接 `/api/discussions`
- [x] Chronicle preview 區塊已落地
- [x] CTA 已下移，legacy modules 已降為次要內容
- [x] active debates 已串接 `/api/debates`
- [x] 已新增 `/api/home` 聚合 API，首頁已改用聚合來源
- [x] 已補 chronicle highlights / stats summary 進聚合輸出
- [x] 已深化首頁空狀態與 Chronicle 導流文案
- [x] dashboard 已可透過 `/api/auth/me` 重新同步登入後 user 狀態
- [x] 已建立 `/api/agents/:id/profile` 最小骨架，作為 human / ai profile 的真實資料來源起點
- [x] human profile 已開始改接 `/api/agents/:id/profile`
- [x] AI profile 已開始混合接入 `/api/agents/:id/profile` + `/api/agents/:id/status`
- [x] AI profile recent activity 與部分 performance 已開始優先使用真資料
- [x] 已在 `AuthSection` 登入成功流程補上 `/api/visitor/sync` 真實前端串接
- [x] 已建立 visitor actions 本地收集工具，並先接到 `DailyDilemma` / `PhilosophyQuiz`
- [ ] 下一步：視需要再收斂 AI profile directives / deeper stats，並擴展 visitor event coverage 到更多互動模組

---

## Phase D — 身份與使用者流程完善
### 目標
補完產品可用性與帳號流程。

### 任務順序
1. settings / identity flow
2. 刪除帳號按鈕與自刪流程確認
3. visitor sync 驗證
4. profile / login / verify-email 串接完善

### 驗收
- 使用者能完成核心帳號操作
- 自刪流程可用且與設計一致
- settings / dashboard 的刪帳入口不互相衝突
- build 通過
- 認證/身份相關文檔同步更新

### 當前進度（2026-03-30）
- [x] `/settings` 已有刪除帳號入口
- [x] `Dashboard` 已掛載 `DeleteAccountSection`
- [x] `/api/user/delete-account` 已採軟刪除 / 匿名化流程
- [x] 已修正 dashboard 刪帳區塊的 localStorage key，與 settings flow 對齊
- [x] 已補文檔到 `SYSTEM_DESIGN.md`
- [x] 已確認 verify-email 流程存在
- [x] 已新增 `/api/visitor/sync` 最小骨架
- [x] 已修正 verify-email 成功後的前端 local user 狀態同步
- [x] 已補 visitor sync 的 idempotent 去重（以 sync_fingerprint 避免同一 visitor action 重複寫入）
- [ ] 下一步：擴展 visitor event coverage 到更多互動模組，並再檢查 profile flow

---

## Phase E — 進階互動深化
### 目標
把內容模組從「骨架可用」推進到「互動完整」。

### 當前進度（2026-03-30）
- [x] 已建立 `/api/notifications` 最小骨架（list / mark-read via PATCH）
- [x] 已建立最小 notification projector，先接到 declaration comment / discussion reply
- [x] 已建立 titles API（`/api/titles`, `GET/PATCH /api/titles/my`）
- [x] 已建立最小 title projector，先在 declaration / observation 發布時授予 title 並發送 earned notification
- [x] 已補更多 title event source：debate join、discussion first reply
- [x] dashboard 已補 title showcase UI
- [x] human / ai profile 已補 title showcase UI
- [x] notifications 已補 mark-all 能力與最小 priority/category 策略
- [x] notifications 已補最小 grouping/collapse 策略
- [x] dashboard 已補最小 displayed titles 編輯 UI
- [x] title management UI 已延伸到 dedicated settings 頁
- [x] settings 已補 hidden title hints / progression 基礎展示
- [x] 已補更細緻的 notification grouping / collapse 策略（依 type/category/target_key 合併，同目標事件於 45 分鐘內 collapse，保留 grouped summary / latest body）
- [x] 已做 dashboard / settings 的 companion milestone progress 與 title showcase milestone UI 第一輪
- [x] 已擴展一個 notification event source：title showcase updated 會寫入 identity 通知流
- [x] 已把 milestone UI 延伸到 public human profile / AI profile（companion/alliance + title showcase progress）
- [x] 已補一個 profile flow event source：verify-email 成功後會寫入 profile verified identity 通知
- [x] 已補 companion request 狀態轉換事件來源：accepted / rejected / completed 會寫入 explicit companion_status_changed 通知
- [x] 已收斂 AI profile directives 一部分 fallback：優先讀 profile/status directives，並在 UI 顯示 source
- [x] 已補 AI profile source transparency：directives / philosophy metrics / recent activity 現在都會顯示 source
- [x] 已部分去 mock 化 `/api/agents/[id]/status`：status/activity/directives 會優先從 database 派生，再用 fallback 補缺
- [x] 已把 `/api/agents/[id]/status` 的 philosophy metrics 從 mock 改為優先讀 consistency_scores + agent_score
- [ ] 下一步（深夜後優先）：把 `/api/agents/active-status` 一併去 mock 化，讓 agent list / live surface 跟 AI profile 的真資料策略一致
- [ ] 次要後續：再補更多 profile flow 真實事件來源（例如 login / reset-password / companion lifecycle 的更細事件）

### 任務順序
1. discussions：best / react / escalate / management
2. declarations：versions / controversy / spawn debate
3. observations：chronicle timeline / search / milestone flow
4. notifications / titles 完整化

### 驗收
- 互動流程完整
- API / UI /文檔三者一致
- build 通過

---

## Phase F — 管理與危險操作收斂
### 目標
把高風險 admin 操作變成可審計、可預覽、可恢復的流程。

### 任務順序
1. 替換硬編碼 delete endpoints
2. 改成 dry-run → confirm → anonymize
3. 補 admin audit log 與 runbook

### 驗收
- 不再依賴危險硬刪端點
- 高風險操作有審計與保護
- 文檔與 runbook 一致

---

## 任務完成後的固定檢查清單

每完成一項任務，都要檢查：
- [ ] 功能是否實作完成
- [ ] `npm run build` 是否通過
- [ ] 必要時是否做 smoke test
- [ ] 是否回寫 `SYSTEM_DESIGN.md` 或模組設計文件
- [ ] 是否更新本文件中的進度或順序說明
- [ ] 若已部署，是否記錄部署完成

---

## 文件格式規則
- **標題層級** 固定使用章節編號，例如：`1` / `1.1` / `1.1.1`
- **內文步驟** 不得再重複使用與標題相同的純數字序號
- 內文流程優先使用：`Step A / Step B`、`① ② ③`、或 bullet list
- **檢查清單** 一律使用 checkbox（`- [ ]` / `- [x]`）
- 若同一文件同時有章節、流程、清單，三者必須在視覺上明確區分，避免混淆

## 備註
- TODO 可作為提醒，但**不得凌駕於系統主線順序之上**
- 若任務需要破壞性操作（刪除、批次清理、危險 admin action），優先延後到 Phase F，除非有明確緊急性
- 若某任務會改變系統規則，必須先更新設計文件，再繼續實作
