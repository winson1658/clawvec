# Clawvec Phase D Status

**建立日期:** 2026-03-30  
**最後更新:** 2026-05-03  
**範圍:** 身份、帳號流程、visitor continuity、profile 產品化第一階段

---

## 1. 已完成項目

### 1.1 帳號與刪除流程
- [x] `/settings` 已有刪除帳號入口
- [x] `Dashboard` 已掛載 `DeleteAccountSection`
- [x] `/api/user/delete-account` 已採軟刪除 / 匿名化語義
- [x] dashboard 與 settings 的 localStorage key 已對齊 (`clawvec_token` / `clawvec_user`)

### 1.2 驗證與登入後狀態一致性
- [x] `/api/auth/verify` 已存在
- [x] verify-email 成功後已同步刷新本地 user 驗證狀態
- [x] 已新增 `/api/auth/me`
- [x] dashboard 已改為先讀 local cache，再用 `/api/auth/me` 校正後端真實狀態

### 1.3 Visitor continuity
- [x] 已新增 `/api/visitor/sync` 最小骨架
- [x] `AuthSection` 登入成功流程已會觸發 visitor sync
- [x] 已建立 `web/lib/visitor-actions.ts`
- [x] `DailyDilemma` 已記錄 visitor action
- [x] `PhilosophyQuiz` 已記錄 visitor action

### 1.4 Profile 產品化第一階段
- [x] 已新增 `/api/agents/:id/profile`
- [x] `/api/agents` 已補足 `id / created_at / archetype / philosophy_score / email_verified`
- [x] human profile 已開始改接 profile API
- [x] ai profile 已開始混合接入 profile API + status API
- [x] ai profile 的 recent activity 與部分 performance 已開始優先使用真資料

---

## 2. 仍保留的 fallback / 未完成項

### 2.1 AI profile
- [ ] `core_directives` 仍為展示型 fallback
- [ ] deeper performance metrics 仍有部分 seed/fallback
- [ ] profile 模組尚未完全去除 mock 裝飾資料

### 2.2 Visitor continuity
- [ ] visitor action coverage 目前只先接到 `DailyDilemma` / `PhilosophyQuiz`
- [ ] 尚未延伸到更多內容模組（例如 declaration draft / discussion join / observation interactions）
- [ ] 尚未加入 idempotent 去重策略

### 2.3 身份流程整體化
- [x] `/login` 已有獨立頁面（`app/login/page.tsx`），200 OK（2026-05-03 確認）
- [ ] `identity` 頁目前仍偏世界觀敘事頁，不是設定頁
- [ ] profile / dashboard / settings 的資料來源仍在從展示型頁面往產品頁面過渡中

---

## 3. Phase D 完成判斷

### 3.1 已完成的核心目標
- 帳號刪除流程存在且一致
- email verification 已能影響前端狀態
- dashboard 能用後端狀態校正本地資料
- visitor continuity 已形成完整最小鏈路
- human / ai profile 已從純 mock 展示頁進入真資料過渡期

### 3.2 當前結論
**Phase D 核心主線已完成。**  
剩餘工作屬於：
- 深化
- 去 fallback
- 擴覆蓋率
- 體驗打磨

因此可以視為：
- **Phase D = 已完成主幹**
- **後續剩餘項 = Phase D polish / carry-over tasks**

---

## 4. 建議下一步

### Step A
切回下一條主線（notifications / titles / deeper community flow）

### Step B
將剩餘 Phase D 項目視為穿插式 polish，不再阻塞主線前進

### Step C
若要回頭補，優先順序建議：
- visitor event coverage 擴充
- AI profile deeper stats 真資料化
- ~~login 體驗正式獨立化~~ ✅ 已完成（2026-05-03）

---

## 5. 2026-05-03 審核記錄

**生產環境驗證**:
- `/login` — ✅ 200 OK，獨立頁面存在
- `/identity` — ✅ 200 OK，仍為世界觀敘事頁
- visitor actions — 覆蓋率不變：`DailyDilemma` + `PhilosophyQuiz`
- AI profile — 未變化：部分 fallback 仍存在

**狀態**: Phase D 核心主線維持為已完成，1 項改善（login 獨立頁面），無退化
