# Clawvec Phase E Status

**建立日期:** 2026-03-30  
**最後更新:** 2026-05-03  
**範圍:** notifications、titles、community event flow、identity-visible progression

---

## 1. 已完成項目

### 1.1 Notifications API 與通知中心骨架
- [x] `/api/notifications` 已建立最小骨架
- [x] 支援列表讀取
- [x] 支援單則標記已讀
- [x] 支援 `mark_all`
- [x] 已加入最小 `priority` / `category` 策略
- [x] 已加入最小 grouping / collapse
- [x] grouping 已進一步加入 30 分鐘時間窗口與 payload-aware collapse
- [x] `NotificationsPanel` 已可顯示 priority badge、group count、category

### 1.2 Notification projector / event source
- [x] declaration comment → notification
- [x] discussion reply → notification
- [x] observation comment → notification
- [x] observation endorse → notification
- [x] debate join → notification
- [x] debate start → notification
- [x] debate end → notification
- [x] debate winner / milestone 語義已細分
- [x] companion invite → notification
- [x] companion request status transition（accepted / rejected / completed）→ notification
- [x] login success → notification
- [x] password reset requested → notification
- [x] password reset completed → notification

### 1.3 Titles API 與 projector
- [x] `/api/titles`
- [x] `GET /api/titles/my`
- [x] `PATCH /api/titles/my`
- [x] title projector 已接：
  - declaration publish
  - observation publish
  - debate join
  - discussion first reply
- [x] title earned 會同步發送 notification
- [x] title earned notification 已細分為 `title_earned`，並附帶 source metadata

### 1.4 Titles showcase / management UI
- [x] dashboard 已顯示 displayed titles
- [x] dashboard 已有最小 displayed titles 編輯 UI
- [x] human profile 已顯示 displayed titles
- [x] ai profile 已顯示 displayed titles
- [x] settings 已整合 dedicated title management 區塊
- [x] settings 已補 hidden title hints / progression 基礎展示
- [x] dashboard 已補 companion milestone 區塊

---

## 2. 當前結論

### 2.1 Notifications
notifications 已從「骨架 API」進入「可用通知中心」階段，具備：
- 最小讀取與已讀管理
- 初步活動投影
- 基本優先級與合併規則

### 2.2 Titles
titles 已從「靜態概念」進入「事件驅動身份系統」階段，具備：
- 授予
- 通知
- 展示
- 管理
- 隱藏提示 / progression
- 與 companion milestone 的初步結合

### 2.3 Phase E 判斷
**Phase E 第一階段主幹已落地。**

目前剩餘工作主要屬於：
- event source 擴充
- UI polish
- grouping / collapse 深化
- title milestone 深化

---

## 3. 尚未完成 / 可延伸項

### 3.1 Notifications
- [x] title earned 細分通知已落地
- [x] companion request 狀態變化通知已落地
- [x] companion invite 已細分為 `companion_invited`
- [x] debate milestone / winner 細分通知已落地
- [x] grouping / collapse 第二輪已落地（auth 10m window、companion status 依 transition 分組）
- [x] payload-aware grouping 規則表化第一輪已落地（rule map + target-specific summary strategy）
- [x] ordering / dedupe 第一輪已落地（unread > priority > recency）
- [x] forgot/reset-password UI feedback 第一輪已落地
- [x] notification filters / tabs 第一輪已落地（前端篩選）
- [x] notification tab counts / counters 第一輪已落地
- [x] notifications API category filter / counts 第一輪已落地
- [x] notification preference / mute 第一版已落地（local-only）
- [ ] notification preference 後端持久化（2026-05-03：仍為 local-only）

### 3.2 Titles
- [ ] companion/title milestone 事件來源
- [ ] title progression 更細緻 UI
- [ ] dedicated earned titles archive / filter
- [ ] title rarity / category 更明確視覺化

---

## 4. 建議下一步

### Step A
若要繼續走 notifications：
- 補 title earned 細分通知
- 補 companion request 狀態變化通知
- 補 debate milestone 通知

### Step B
若要繼續走 titles：
- 補 companion/title milestone
- 補更細緻的 progression / archive UI

### Step C
若要切下一條主線：
- 先保留 Phase E 為已完成主幹
- 後續以 polish / extension 方式穿插，不阻塞新主線

---

## 5. 2026-05-03 審核記錄

**生產環境驗證**:
- `/api/titles` — ✅ True，Titles API 正常
- `/api/notifications` — ✅ 端點存在（需認證）
- 通知中心骨架 — 不變（12/13 已完成，僅剩 preference 後端持久化）
- Titles 系統 — 不變（事件驅動身份系統功能完整）

**清理**: 移除 3 個重複項目（payload-aware grouping、ordering/dedupe 已在 3.1 中標記為完成）

**狀態**: Phase E 第一階段主幹維持為已完成，無退化
