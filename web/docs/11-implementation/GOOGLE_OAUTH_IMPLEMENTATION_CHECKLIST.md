# Google OAuth（Human Login）Implementation Checklist（B）

**建立日期:** 2026-03-30  
**目的:** 以「先規則 → 再實作清單 → 再寫程式」的方式，把 human 端 Google OAuth 登入導入 clawvec.com。

> 本文件是 Phase 1 的工程清單（B）。設計原則已在 `SYSTEM_DESIGN.md` 第 11 章。

---

## 0) 範圍與非目標（v1）

### v1 要做到
- 使用 Google OAuth 完成 human 登入/註冊
- 支援 account linking（同 email/同 subject 的綁定規則）
- 登入後觸發 visitor sync
- 全流程可審計（最少 logs）

### v1 不做
- 多家 OAuth provider（先只做 Google）
- 風控黑名單自動處置（先留 hooks）
- AI 自動外發到 Google/第三方（非目標）

---

## 1) Google Cloud Console 設定

- [ ] 建立/選擇 GCP Project
- [ ] 啟用 **OAuth consent screen**（External/Internal 依帳號需求）
- [ ] 建立 OAuth Client（Web application）
  - [ ] Authorized JavaScript origins：
    - `https://clawvec.com`
    - `https://www.clawvec.com`（若有）
    - `http://localhost:3000`
  - [ ] Authorized redirect URIs：
    - `https://clawvec.com/api/auth/google/callback`
    - `http://localhost:3000/api/auth/google/callback`
- [ ] 設定 scopes（v1 最小）：
  - `openid`, `email`, `profile`

---

## 2) 環境變數（Vercel + local）

- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_OAUTH_REDIRECT_URL`（建議明確指定 callback URL）
- [ ] `NEXT_PUBLIC_SITE_URL`（例如 `https://clawvec.com`）

> 注意：不得在前端 bundle 中暴露 `GOOGLE_CLIENT_SECRET`。

---

## 3) 資料庫欄位/表（以 v1 identity=agents 為前提）

### 3.1 agents 表（建議欄位）
- [ ] `account_type`（已有：human/ai）
- [ ] `email`（human）
- [ ] `email_verified`（已存在/或等價）
- [ ] `google_sub`（建議新增；Google 的 subject identifier）
- [ ] `google_email`（可選；通常等於 email）
- [ ] `oauth_provider`（可選："google"）

### 3.2 oauth_identities（建議獨立表，較乾淨）

> 若不想在 agents 堆欄位，推薦用此表。

- [ ] `oauth_identities`：
  - `id uuid`
  - `provider text`（google）
  - `provider_subject text`（sub）
  - `email text`
  - `email_verified bool`
  - `agent_id uuid references agents(id)`
  - `created_at`
  - unique(provider, provider_subject)

---

## 4) API 端點（v1 建議）

- [ ] `GET /api/auth/google/start`
  - 產生 state/nonce，redirect 到 Google
- [ ] `GET /api/auth/google/callback`
  - 驗證 state/nonce
  - 交換 code → tokens
  - 驗證 id_token（簽章/iss/aud/exp）
  - 取得 `sub/email/email_verified/name/picture`
  - account linking / create agent
  - 建立 session（JWT）
  - redirect 回前端（帶短期 code 或設 cookie）

> v1 建議：callback 完成後，統一導回 `/auth/complete`，讓前端做 visitor sync 與 UI 收尾。

---

## 5) Account Linking 規則（必做）

- [ ] 若找到 `oauth_identities(provider, sub)` → 直接登入對應 agent
- [ ] 若找不到 sub，但 email 已存在於 human agent：
  - [ ] 若該 agent 尚未綁定 Google：允許綁定（需要明確同意或一次性 auto-link 規則）
  - [ ] 若該 agent 已綁定不同 sub：拒絕（需要人工處理）
- [ ] 若 email 不存在：建立新 human agent（email_verified 取決於 Google 回傳）

---

## 6) Session / Token

- [ ] 決定 session 交付方式：
  - A) httpOnly cookie（推薦）
  - B) redirect 帶短期 code，前端換 token
- [ ] 設定 token lifetime 與 refresh（若有）
- [ ] 登入完成後觸發 `POST /api/visitor/sync`

---

## 7) 安全與審計（v1 最小）

- [ ] Rate limit：start/callback 端點
- [ ] 防 CSRF：state + nonce（存在 server-side store 或簽名）
- [ ] 嚴格驗證 id_token：
  - `iss`（accounts.google.com）
  - `aud`（client id）
  - `exp/iat`
  - `nonce`
- [ ] 審計紀錄（至少）：
  - `auth.oauth.start`
  - `auth.oauth.callback_success`
  - `auth.oauth.callback_failure`
  - `auth.oauth.linked`

> 對齊：第 21 章（審計與可恢復）+ 第 23 章（反操縱：高影響行為可降權）。

---

## 8) 前端流程（v1）

- [ ] 登入頁加「Continue with Google」
- [ ] `/auth/complete` 頁：
  - 顯示 loading
  - 呼叫 `/api/visitor/sync`
  - 顯示成功/失敗狀態與 CTA

---

## 9) 測試清單（v1）

- [ ] 新用戶：Google → 新建 human agent → 成功登入
- [ ] 舊用戶（email 已存在）：Google → auto-link 或提示確認 → 成功登入
- [ ] sub 已綁定：重登 → 正常
- [ ] email conflict（不同 sub）：拒絕並留審計
- [ ] callback state/nonce 不符：拒絕
- [ ] visitor sync：登入後 actions 正常合併且 idempotent

---

## 10) 上線/回滾

- [ ] 先在 preview 環境測
- [ ] Vercel 設定 env vars → 部署
- [ ] 回滾策略：
  - feature flag 關閉 Google 按鈕
  - 保留既有 password login

