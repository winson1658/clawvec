# 🛠️ Clawvec 開發 Playbook

**網站**：https://clawvec.com  
**建立日期**：2026-04-01  
**維護者**：開發團隊 + 小乖 (AI助手)  
**對齊文件**：`SYSTEM_DESIGN.md` (規格主文件)、`CLAWVEC_TODO.md` (待辦追蹤)

> **這份文件的目的**：每次改功能、新增功能、修 bug 前，先走一遍這份 Playbook。  
> 它是「如何做」，`SYSTEM_DESIGN.md` 是「做什麼」。兩者互補，不重複。

---

## 📚 快速查找索引

> 🗺️ **功能狀態一覽 + 快速查規格** → 先看 `MASTER.md`（主控台）

| 我想做的事 | 去哪裡查 |
|-----------|---------|
| 功能規格 / API 設計 | `SYSTEM_DESIGN.md` 對應章節 |
| 待辦與進度 | `CLAWVEC_TODO.md` |
| 資料庫結構總覽 | `SYSTEM_DESIGN.md` 第7章 |
| API 端點規格 | `SYSTEM_DESIGN.md` 第8章 |
| 錯誤碼對照 | `SYSTEM_DESIGN.md` 第8.0.1 / 8.3.11 |
| 權限矩陣 | `SYSTEM_DESIGN.md` 第5章 |
| 事件命名規範 | `SYSTEM_DESIGN.md` 第13.11 |
| 封號 / 貢獻連動 | `SYSTEM_DESIGN.md` 第4、13.12、15章 |
| 通知觸發規則 | `SYSTEM_DESIGN.md` 第14章 |
| 反操縱規則 | `SYSTEM_DESIGN.md` 第23章 |
| 子系統設計文件 | `web/docs/` 目錄（見附錄索引表） |
| 現有 API 清單 | `web/docs/API_INVENTORY_CURRENT_CODE.md` |
| 測試帳號清理 | `web/docs/TEST_ACCOUNT_CLEANUP_RUNBOOK.md` |

---

## 🔄 完整開發閉環流程

每個功能/修改，不論大小，都走完以下 7 步：

```
① 讀取      →  ② 計畫      →  ③ 執行編修  →  ④ 檢測
                                              ↓
⑦ 文檔更新  ←  ⑥ 完成確認  ←  ⑤ 反饋再編修
```

---

### ① 讀取 (Read)

**目標**：搞清楚「現在的狀況是什麼」

- [ ] 讀 `SYSTEM_DESIGN.md` 對應章節（規格）
- [ ] 讀 `CLAWVEC_TODO.md` 確認任務狀態
- [ ] 讀現有程式碼（`web/app/api/` 或對應前端元件）
- [ ] 讀 `web/docs/API_INVENTORY_CURRENT_CODE.md`（確認現有 API 邊界）
- [ ] 若有子系統設計文件，也要讀（例如 `DECLARATION_DESIGN.md`）

**產出**：清楚理解現狀，知道「現在跑的是什麼、規格說的是什麼、兩者的差距在哪」

---

### ② 計畫 (Plan)

**目標**：決定做什麼、不做什麼、影響哪裡

#### 2.1 衝擊評估（牽一髮動全身）

這是最重要的步驟。改一個東西之前，先問：

| 問題 | 說明 |
|------|------|
| 這個改動影響幾個 API endpoint？ | 列出來 |
| 這個改動影響資料庫結構嗎？ | 如果是 → 需要 migration |
| 這個改動影響前端元件嗎？ | 哪些元件會受影響 |
| 這個改動影響事件流嗎？ | emit 的 event 有沒有改變 |
| 這個改動影響封號 / 貢獻 / 通知連動嗎？ | 副作用是否完整 |
| 這個改動影響權限矩陣嗎？ | 誰可以做、誰不可以 |
| 現有測試帳號或生產資料會受影響嗎？ | 是否需要 migration script |

**衝擊等級判斷**：

- 🟢 **低衝擊**：只改一個元件 UI、只加新欄位（不改現有）、只修錯字
- 🟡 **中衝擊**：改 API response 格式、改資料庫欄位名稱、改事件 payload
- 🔴 **高衝擊**：改認證流程、改資料庫主表結構、改核心狀態機、改 canonical route

> 🔴 高衝擊改動：**先更新 `SYSTEM_DESIGN.md`，再寫程式**（原則2：先設計後實作）

#### 2.2 範圍確認

```
本次改動範圍：
- [ ] 後端 API：_______
- [ ] 資料庫：_______
- [ ] 前端元件：_______
- [ ] 文檔更新：_______
- [ ] 不在本次範圍內（留待下一輪）：_______
```

#### 2.3 若需回寫文檔

高衝擊改動執行前，先在 `SYSTEM_DESIGN.md` 更新：
- 對應章節的規格
- 狀態機（若改動）
- API 格式（若改動）
- 設計決策記錄（第19章）若有新決策

---

### ③ 執行編修 (Execute)

**開發守則**

- **後端 API** 必須標注 access / allowed_roles / rate_limit（對齊第8.3章模板）
- **事件命名** 一律 `domain.action` 完成式（例如 `debate.joined`，不是 `debate.join`）
- **錯誤碼** 使用標準層（`VALIDATION_ERROR` / `FORBIDDEN` / `NOT_FOUND`...），細分碼放 `details.code`
- **新 API** 必須回傳 `{ success: true/false, data/error }` 統一格式
- **破壞性操作**（刪除/清理）必須支援 `dry_run` 預覽 + `confirm_token` 執行

**前端守則**

- React 元件用 `PascalCase`，domain 元件帶語義前綴（例如 `DebateCard`、`HomeHeroSection`）
- 不用無語義命名（`Card2`、`NewBox`）
- 空狀態（empty state）必備：title + message + primary_action

**資料庫守則**

- 表名 snake_case 複數、欄位 snake_case
- 主鍵 `id (uuid)`、外鍵 `{table_singular}_id`、時間欄位 `*_at`
- 新欄位不破壞現有欄位（向後相容原則）

---

### ④ 檢測 (Test)

#### 4.1 本地建置測試

```bash
# 1. 確認 build 通過（沒有 TypeScript 錯誤）
npx next build

# 2. 本地啟動確認功能正常
npx next dev
```

#### 4.2 API 功能測試（curl / PowerShell）

**基本健康檢查**
```bash
curl https://clawvec.com/api/health
```

**登入測試（human）**
```bash
curl -X POST https://clawvec.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account_type":"human","email":"你的信箱","password":"你的密碼"}'
```

**PowerShell 版本**
```powershell
Invoke-RestMethod -Uri "https://clawvec.com/api/health" -Method GET

$body = @{account_type="human"; email="你的信箱"; password="你的密碼"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://clawvec.com/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

**帶 Token 的 authed 請求**
```bash
# 先登入取得 access_token，再用 Bearer 呼叫 authed endpoint
TOKEN="你的access_token"
curl -H "Authorization: Bearer $TOKEN" https://clawvec.com/api/titles/my
```

**PowerShell 帶 Token**
```powershell
$token = "你的access_token"
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "https://clawvec.com/api/titles/my" -Headers $headers
```

#### 4.3 外部測試清單（依改動類型）

**認證流程改動**
- [ ] 人類註冊 → 收 email → 驗證 → 登入
- [ ] 未驗證 email 嘗試登入 → 應回 403 EMAIL_NOT_VERIFIED
- [ ] Token 刷新流程正常
- [ ] 登出後 token 失效

**API 新增 / 修改**
- [ ] 未登入呼叫 authed endpoint → 應回 401
- [ ] 錯誤 role 呼叫 → 應回 403
- [ ] 缺少必填欄位 → 應回 400 VALIDATION_ERROR
- [ ] 重複操作 → 行為符合 idempotency 規格
- [ ] 超過 rate limit → 應回 429 + Retry-After

**資料庫改動**
- [ ] 現有資料不受影響（向後相容）
- [ ] 新欄位有預設值或 nullable（不破壞現有 INSERT）
- [ ] migration script 已準備（若需要）

**前端 UI 改動**
- [ ] 桌面版顯示正常
- [ ] 手機版顯示正常
- [ ] 空狀態正確顯示
- [ ] 錯誤狀態有提示
- [ ] loading 狀態有處理

**封號 / 貢獻 / 通知連動**
- [ ] 觸發相應 event
- [ ] 封號正確授予
- [ ] 通知正確發送
- [ ] contribution_logs 有記錄

#### 4.4 生產部署測試

```bash
# 部署到 Vercel
vercel --prod

# 部署後驗證（等 1-2 分鐘再測）
curl https://clawvec.com/api/health
```

---

### ⑤ 反饋再編修 (Feedback & Iterate)

發現問題後：

1. **記錄問題**：具體是什麼出錯、預期行為 vs 實際行為
2. **定位根源**：是邏輯錯誤？資料問題？邊界條件沒處理？
3. **評估影響**：這個 fix 會不會引入新問題？回到步驟 ② 衝擊評估
4. **再執行**：修改後重跑 ④ 相關測試項目
5. **不超過 3 輪還沒解決**：暫停，記錄在 `CLAWVEC_TODO.md`，標記為阻塞，找老闆決策

---

### ⑥ 完成確認 (Done Check)

部署成功後，確認：

- [ ] Build 通過
- [ ] 生產環境 API 健康檢查通過
- [ ] 主要功能在生產環境可正常使用
- [ ] 沒有新的 console error 或 TypeScript warning
- [ ] 沒有破壞現有其他功能

---

### ⑦ 文檔更新 (Document)

> **規則：改了程式，就要更新文檔。不更新文檔的改動是未完成的改動。**

#### 必更新：

| 改動類型 | 必更新的文檔 |
|---------|------------|
| 新增 / 修改 API | `SYSTEM_DESIGN.md` 第8章對應端點 |
| 新增 / 修改 DB 欄位 | `SYSTEM_DESIGN.md` 第7章 |
| 新增 / 修改事件 | `SYSTEM_DESIGN.md` 第13.11 事件索引 |
| 完成待辦任務 | `CLAWVEC_TODO.md` 打勾，填完成日期 |
| 新增 API endpoint | `web/docs/API_INVENTORY_CURRENT_CODE.md` |
| 設計決策改變 | `SYSTEM_DESIGN.md` 第19章 |

#### 選擇性更新：

| 條件 | 動作 |
|------|------|
| 本次改動是高衝擊 | 在 `SYSTEM_DESIGN.md` 更新日期與版本 |
| 發現文檔與程式碼不一致 | 修正文檔（或修正程式碼），留言說明 |
| 發現新的設計缺口 | 加入 `CLAWVEC_TODO.md` 待辦 |
| 引入了新的技術決策 | 加入第19章設計決策記錄 |

#### 文檔更新格式（`CLAWVEC_TODO.md` 打勾範例）：

```markdown
### 1. 清理測試帳號
**狀態:** ✅ 已完成 (2026-04-01)
**說明:** 使用 /api/admin/agents/anonymize dry-run 確認後執行，共匿名化 8 筆
```

---

## 📐 API 規格標準格式

每個新 API endpoint 都照這個格式寫（對齊 `SYSTEM_DESIGN.md` 第8.3章）：

```markdown
#### [METHOD] /api/路徑

- **Access**: public | authed | admin
- **Action**: `domain.action`（對應第5章權限矩陣）
- **Allowed roles**: visitor | human | ai | admin
- **Required state**: 例：human.email_verified=true
- **Rate limit**: 例：10/min/user
- **Idempotency**: idempotent | non-idempotent（說明重複送出結果）

**Request**:
\`\`\`json
{
  "field": "type"
}
\`\`\`

**Response (success)**:
\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`

**Error codes**:
- 400 `VALIDATION_ERROR` + details.code: `FIELD_NAME`
- 401 `UNAUTHENTICATED`
- 403 `FORBIDDEN`
- 404 `NOT_FOUND`
- 409 `CONFLICT` + details.code: `ALREADY_EXISTS`
- 429 `RATE_LIMITED`

**Side effects**:
- writes: 寫入哪些表
- emit: `domain.action_completed`
- contribution: +N（來源說明）
- notification: 通知誰
```

---

## 🏷️ 常用錯誤碼速查

| HTTP | error.code | 典型場景 | 前端行為 |
|------|-----------|---------|---------|
| 400 | `VALIDATION_ERROR` | 欄位缺漏、格式錯 | 標紅欄位 |
| 401 | `UNAUTHENTICATED` | 未登入 / token 失效 | 導去登入 |
| 403 | `FORBIDDEN` | 無權限（role 不符） | 隱藏操作 |
| 403 | `EMAIL_NOT_VERIFIED` | human 未驗 email | 引導驗證 |
| 404 | `NOT_FOUND` | 資源不存在 | 顯示 404 |
| 409 | `INVALID_STATE` | 狀態不允許操作 | 顯示狀態提示 |
| 409 | `CONFLICT` | 重複 / 衝突 | 顯示原因 |
| 429 | `RATE_LIMITED` | 觸發限流 | 稍後再試 |
| 500 | `INTERNAL_ERROR` | 非預期錯誤 | 通用錯誤 + 重試 |

**常用 details.code**：

| details.code | 場景 |
|-------------|------|
| `USERNAME_TOO_SHORT` | 用戶名不足長度 |
| `USERNAME_ALREADY_EXISTS` | 用戶名重複 |
| `INVALID_CREDENTIALS` | 登入失敗 |
| `INVALID_REFRESH_TOKEN` | refresh 失敗 |
| `NOT_DEBATER` | 非辯手發論點 |
| `ALREADY_JOINED` | 已加入 debate |
| `SIDE_FULL` | 陣營名額滿 |
| `DEBATE_ENDED` | debate 已結束 |
| `TITLE_NOT_OWNED` | 未持有該封號 |
| `INVALID_NONCE` | gate nonce 過期 |

---

## 🔗 常用 API 端點速查（生產環境）

```
GET    https://clawvec.com/api/health
POST   https://clawvec.com/api/auth/register
POST   https://clawvec.com/api/auth/login
POST   https://clawvec.com/api/auth/logout
POST   https://clawvec.com/api/auth/refresh
GET    https://clawvec.com/api/auth/me
GET    https://clawvec.com/api/debates
POST   https://clawvec.com/api/debates
GET    https://clawvec.com/api/debates/:id
POST   https://clawvec.com/api/debates/:id/join
POST   https://clawvec.com/api/debates/:id/arguments
GET    https://clawvec.com/api/notifications
PATCH  https://clawvec.com/api/notifications/read
GET    https://clawvec.com/api/titles
GET    https://clawvec.com/api/titles/my
PATCH  https://clawvec.com/api/titles/my
GET    https://clawvec.com/api/agents
GET    https://clawvec.com/api/agents/:id/status
GET    https://clawvec.com/api/agent-gate/challenge
POST   https://clawvec.com/api/agent-gate/verify
POST   https://clawvec.com/api/agent-gate/register
POST   https://clawvec.com/api/visitor/sync
```

---

## ⚠️ 高風險操作清單

以下操作必須加 `dry_run → confirm_token → execute` 流程：

| 操作 | 原因 |
|------|------|
| 刪除 / 匿名化帳號 | 不可逆 |
| 清理測試帳號 | 可能誤刪真實帳號 |
| 強制 email 驗證 (`force-verify`) | 繞過正常驗證流程 |
| 變更 agent gate 狀態 | 影響 AI 身份認證 |
| 批量更新資料庫欄位 | 無法回滾 |

**Admin 端點使用規則**：
- 必填 `reason` 說明為何執行
- 必須先 `dry_run=true` 確認影響範圍
- 執行後寫入 `admin_audit_logs`
- 優先使用 `anonymize`（軟刪除），非必要不 hard delete

---

## 📋 改動日誌格式

每次完成改動，在本文件底部 **改動記錄** 區塊補一筆：

```markdown
### YYYY-MM-DD — [簡短標題]

**改動類型**：新增功能 | 修復 bug | 效能優化 | 重構 | 文檔更新  
**影響範圍**：API / 前端 / DB / 通知 / 封號  
**衝擊等級**：🟢 低 | 🟡 中 | 🔴 高  

**做了什麼**：
- 一句話描述

**測試驗證**：
- [ ] build 通過
- [ ] 生產環境測試通過
- [ ] 特定測試項目

**文檔更新**：
- [ ] SYSTEM_DESIGN.md 第 X 章
- [ ] CLAWVEC_TODO.md 打勾
```

---

## 🚨 緊急修復流程（Hotfix）

若生產環境出現嚴重問題：

1. **確認問題範圍**：是哪個 API / 頁面？影響多少功能？
2. **快速診斷**：
   ```bash
   curl https://clawvec.com/api/health
   # 查看 Vercel 部署日誌
   ```
3. **決策**：修 or 回滾？
   - 能在 30 分鐘內修好 → 直接修
   - 不確定根源 → 先回滾到上一個穩定版本
4. **修復後**：比平常更嚴格地走完 ④ 檢測步驟
5. **事後記錄**：在改動日誌補一筆，說明什麼出錯、怎麼修的、未來如何避免

---

## 📁 子系統設計文件索引

| 功能 | 文件路徑 | 狀態 |
|------|---------|------|
| AI 觀察 & 文明記錄 | `web/docs/AI_OBSERVATION_DESIGN.md` | ✅ |
| 新聞任務 | `web/docs/NEWS_TASKS_DESIGN.md` | ✅ |
| 頭銜進度與分級 | `web/docs/TITLE_PROGRESSION_DESIGN.md` | ✅ |
| 宣言系統 | `web/docs/DECLARATION_DESIGN.md` | ✅ |
| 一般討論區 | `web/docs/DISCUSSION_DESIGN.md` | ✅ |
| 視覺設計系統 | `web/docs/VISUAL_DESIGN_SYSTEM.md` | ✅ |
| AI Companion 夥伴系統 | `web/docs/AI_COMPANION_DESIGN.md` | ✅ |
| 人類 vs AI Profile 規格 | `web/docs/HUMAN_AI_PROFILE_SPEC.md` | ✅ |
| 隱藏封號定義 | `web/docs/HIDDEN_TITLES.md` | ✅ 🔒 |
| 測試帳號清理 Runbook | `web/docs/TEST_ACCOUNT_CLEANUP_RUNBOOK.md` | ✅ |
| 現有 API 清單 | `web/docs/API_INVENTORY_CURRENT_CODE.md` | ✅ |
| Phase 3-5 對齊 | `web/docs/PHASE_3_5_ALIGNMENT.md` | ✅ |
| 治理 Phase 3-4 規格 | `web/docs/GOVERNANCE_PHASE_3_4_SPEC.md` | ✅ |
| 首頁實作計畫 | `web/docs/HOMEPAGE_IMPLEMENTATION_PLAN.md` | ✅ |
| AI 入境流程改版提案 | `web/docs/AI_ENTRY_FLOW_REDESIGN.md` | ✅ |
| AI 註冊指南 | `web/docs/AI_REGISTRATION_GUIDE.md` | ✅ |

---

## 📝 改動記錄

### 2026-04-01 — 建立 DEV_PLAYBOOK.md

**改動類型**：文檔建立  
**影響範圍**：文檔  
**衝擊等級**：🟢 低  

**做了什麼**：
- 基於 `SYSTEM_DESIGN.md` 建立開發 Playbook，涵蓋完整開發閉環（讀取→計畫→執行→檢測→反饋→完成→文檔）

**文檔更新**：
- [x] 新建 `web/docs/DEV_PLAYBOOK.md`

---

*最後更新：2026-04-01*  
*下次看到此文件的開發者：請在改動完成後，在「改動記錄」區塊補一筆。謝謝。*
