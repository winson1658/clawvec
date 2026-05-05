# Clawvec Ubuntu Setup Guide

更新日期: 2026-04-06
目的: 將 Clawvec 專案搬到 Ubuntu 後，快速恢復開發環境。

---

## 1. 建議先搬哪些東西

至少搬這些：
- `web/`
- `CLAWVEC_TODO.md`
- `CLAWVEC_SPRINT.md`
- `CLAWVEC_WEBDEV_DOCS_INDEX.md`
- `UBUNTU_MIGRATION_PACK.md`
- `web/docs/`
- `web/supabase/migrations/`

如需歷史修復資料，也一起搬：
- `archive/_trash/database_diagnosis.sql`
- `archive/_trash/database_repair.sql`
- `archive/_trash/quick_fix_guide.md`

---

## 2. Ubuntu 基本環境

建議安裝：
- Node.js 20+（或與目前專案相容的版本）
- npm
- git
- vercel CLI（若要部署）

### 安裝 Node.js（建議用 nvm）
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v
npm -v
```

---

## 3. 專案放置方式

假設你把專案放到：
```bash
~/projects/clawvec
```

進入專案：
```bash
cd ~/projects/clawvec/web
```

---

## 4. 安裝依賴

```bash
npm install
```

如果遇到 lockfile 或 node 版本不一致，先確認 Node 版本，再重裝。

---

## 5. 環境變數

這一步最重要。

你需要補齊至少這類設定：
- Supabase URL
- Supabase anon key
- Supabase service role key（若 server API 需要）
- JWT secret / auth 相關 key
- 任何 Vercel 生產環境已有的 env vars
- 任何 AI gate / email verification / OAuth 相關設定

建議在 Ubuntu 建立：
```bash
cp .env.example .env.local
```

如果沒有 `.env.example`，就手動建立 `.env.local`。

可先整理成這種格式：
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
```

---

## 6. 本地開發啟動

```bash
npm run dev
```

開瀏覽器：
- http://localhost:3000

---

## 7. Build 測試

正式開發前先確認 build：

```bash
npm run build
```

如果 build 過了，代表 Ubuntu 端基本環境沒太大問題。

---

## 8. Supabase / Migration

你已經有完整 migration 清單，位於：
- `web/supabase/migrations/`

重要 migration 包括：
- password reset
- complete database setup
- create/fix agents table
- debates/discussions/replies
- email verification fix
- ai companion status
- dilemma votes

### 特別注意
Sprint 文檔指出這個還需要確認執行：
```bash
web/supabase/migrations/20260327_create_dilemma_votes.sql
```

如果 Ubuntu 環境是新資料庫，請按正確順序套 migration。
如果是接現有 Supabase，先檢查哪些已執行，不要重複破壞。

---

## 9. 文件閱讀順序建議

搬過去後，建議先看：
1. `UBUNTU_MIGRATION_PACK.md`
2. `CLAWVEC_WEBDEV_DOCS_INDEX.md`
3. `web/docs/MASTER.md`
4. `web/docs/SYSTEM_DESIGN.md`
5. `web/docs/HOMEPAGE_IMPLEMENTATION_PLAN.md`
6. `CLAWVEC_TODO.md`
7. `CLAWVEC_SPRINT.md`

這樣最快恢復上下文。

---

## 10. 部署到 Vercel

先安裝 CLI：
```bash
npm install -g vercel
```

登入：
```bash
vercel login
```

部署預覽：
```bash
vercel
```

部署正式版：
```bash
vercel --prod
```

---

## 11. 已知風險

- `agents` 表歷史上曾有 `password_hash` 欄位問題
- 部分修復 SQL 在 `archive/_trash/`，代表是歷史修復資料，要先審查再用
- 若 Ubuntu 上的 `.env` 不完整，API 與登入流程很容易壞
- 若直接接同一個 Supabase 生產資料庫，操作 migration 前要先備份

---

## 12. 建議收尾動作

Ubuntu 上建議再補做：
- 建立 `.env.example`
- 建立 migration 執行紀錄
- 確認 `npm run build` 可重複成功
- 確認 `vercel` deployment 可重現

---

整理者: OpenClaw 助手
