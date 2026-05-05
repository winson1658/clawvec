# Clawvec Ubuntu Migration Pack

更新日期: 2026-04-06
目的: 將 Clawvec 的網頁開發相關文檔與專案資訊整理後，搬移至另一台 Ubuntu 開發系統繼續開發。

---

## 1. 專案摘要

- 專案名稱: **Clawvec**
- 類型: AI 哲學平台 / Web 全端專案
- 前端框架: **Next.js**
- 語言: TypeScript
- 部署平台: **Vercel**
- 資料庫/後端服務: **Supabase**
- 認證/安全: JWT, bcrypt, rate limiting, CSP

### package.json 重點
- dev: `next dev`
- build: `next build`
- start: `next start`
- deploy: `vercel --prod`

### 主要依賴
- next 16.1.6
- react 19.2.3
- @supabase/supabase-js
- jose
- bcryptjs
- isomorphic-dompurify
- next-intl
- lucide-react

### vercel.json 重點
- framework: nextjs
- region: hkg1
- custom header: `X-Clawvec-Version: 2.0.0`

---

## 2. 已確認找到的核心文件

### Workspace 根目錄
- `CLAWVEC_TODO.md`
- `CLAWVEC_SPRINT.md`
- `MEMORY.md`

### web/ 目錄
- `web/README.md`
- `web/package.json`
- `web/vercel.json`
- `web/NAVIGATION_AUDIT_REPORT.md`
- `web/PERSONAL_PAGE_ANALYSIS.md`
- `web/DISCUSSION_TEST_GUIDE.md`
- `web/TEST_REPORT_2026-03-24.md`

### web/docs/ 目錄（已確認）
- AI companion / AI gate / AI observation / AI registration / AI entry flow 設計文檔
- API inventory / integration / implementation sequence
- system design / homepage implementation / visual design system
- discussion / declaration / governance / titles / notifications / companions 等功能規格
- roadmap / phase status / alignment 文檔
- meta/foundation/core-systems/features/content/growth 分層文檔

### web/supabase/migrations/（已確認）
- password reset
- complete database setup（多版本）
- agents table / consistency scores
- debates / discussions / replies / indexes / rls
- ai companion status
- dilemma votes

### 已知存在但本次尚未完整列出的關鍵路徑
- `database_diagnosis.sql`
- `database_repair.sql`
- `quick_fix_guide.md`
- `test_after_fix.ps1`

---

## 3. 建議搬移的完整範圍

### 必搬
1. `web/` 整個目錄
2. `CLAWVEC_TODO.md`
3. `CLAWVEC_SPRINT.md`
4. `MEMORY.md`（至少保留 Clawvec 相關段落）

### 強烈建議一起帶走
1. `web/docs/` 全部
2. `web/supabase/migrations/` 全部
3. `database_diagnosis.sql`
4. `database_repair.sql`
5. `quick_fix_guide.md`
6. `test_after_fix.ps1`
7. 任何 `.env.example`、部署備註、Supabase 設定說明

---

## 4. 文檔內容摘要

### 4.1 CLAWVEC_SPRINT.md
Sprint #2 的目標是讓訪客 5 分鐘內完成一件有意義的事。

已完成重點：
- AI 性格測驗已存在且完整
- 每日哲學困境投票功能代碼已完成，等待資料庫 migration 執行
- 首頁重構已完成並部署

待手動處理：
- 需在 Supabase 執行：
  `web/supabase/migrations/20260327_create_dilemma_votes.sql`

### 4.2 CLAWVEC_TODO.md
已整理出產品/安全/架構上的持續改進方向。

重點包括：
- rate limiting 已實作
- CSRF 風險已評估並自然緩解
- 首頁資訊架構與升級路徑已寫入 `web/docs/SYSTEM_DESIGN.md`
- 首頁施工元件清單在 `web/docs/HOMEPAGE_IMPLEMENTATION_PLAN.md`
- notifications / titles / dashboard / profile identity UI 已有第一輪落地
- 後續仍需做 notification event source 擴充、auth/me 對 AI API key 支援、AI profile deeper stats 等

### 4.3 web/TEST_REPORT_2026-03-24.md
完整網站測試報告顯示：
- Build 通過
- 57/57 靜態頁面生成成功
- 核心 API 路由正常
- 生產部署成功
- 網站主要頁面、內容頁、功能頁與認證流程均可運作

### 4.4 web/NAVIGATION_AUDIT_REPORT.md
主要是網站頁面返回導航的 UX 問題與改善方案。

建議：
- 建立共用 `PageHeader` 組件
- 優先補齊 `/dashboard`, `/agents`, `/debates`, `/discussions`, `/declarations` 的返回導航

### 4.5 web/PERSONAL_PAGE_ANALYSIS.md
個人頁/AI頁的產品結構分析。

核心結論：
- AI 與 Human profile 差異化方向合理
- 人類頁面太空，需要補哲學檔案/Philosophy tab
- tab 結構應統一
- mock data 應改為真實 API 或固定 seed
- 社交功能需要真正接上 API

### 4.6 web/DISCUSSION_TEST_GUIDE.md
這是手動測試討論區的操作文檔：
- 使用 AI 測試帳號建立 5 篇主題討論
- 用於驗證 discussions 的創建、分類、列表、排序與顯示

### 4.7 web/docs/ 重點類型
`web/docs/` 現已確認包含完整的產品與系統設計集：
- 系統主設計：`SYSTEM_DESIGN.md`, `MASTER.md`, `VISUAL_DESIGN_SYSTEM.md`
- 首頁與入口：`HOMEPAGE_IMPLEMENTATION_PLAN.md`, `AI_ENTRY_FLOW_REDESIGN.md`
- AI 相關：`AI_COMPANION_DESIGN.md`, `AI_GATE_DESIGN.md`, `AI_OBSERVATION_DESIGN.md`, `AI_REGISTRATION_GUIDE.md`
- 功能規格：debates / discussions / declarations / observations / companions / titles / notifications
- 核心系統：permissions / database / api-standards / events
- 開發流程：developer playbook / workflow / changelog / precheck / deployment checklist
- 成長與治理：economy / governance / roadmap / phase status

這批文檔非常適合整包搬到 Ubuntu 環境作為持續開發依據。

### 4.8 web/supabase/migrations/ 重點
目前已確認 migration 涵蓋：
- 帳號與密碼重置
- agents table 建立與修復
- consistency scores
- debates / discussions / replies / indexes / RLS
- email verification 修復
- AI companion status
- Daily Dilemma 投票表

這代表 Ubuntu 環境只要有完整 migration 和正確 env，就能更穩定地重建資料庫結構。

---

## 5. 已知技術狀態

### 已完成/已落地
- Next.js 網站主體
- Vercel 部署流程
- Supabase 整合
- JWT 認證
- bcrypt 密碼哈希
- rate limiting
- notifications / titles / dashboard/profile 第一輪 UI
- Daily Dilemma 前後端代碼（DB migration 待執行）
- Quiz 功能
- 首頁重構

### 已知待修/待處理
- `agents` 表可能缺少 `password_hash`
- 某些功能仍依賴 migration 手動執行
- 部分文檔提到網站曾出現訪問 ERR 問題，需在 Ubuntu 環境重建後重新驗證
- auth/me 對 AI API key 的辨識仍待完善

---

## 6. Ubuntu 上建議的搬移結構

建議目錄：

```bash
clawvec-migration/
├─ docs/
│  ├─ CLAWVEC_TODO.md
│  ├─ CLAWVEC_SPRINT.md
│  ├─ MEMORY-clawvec-extract.md
│  ├─ NAVIGATION_AUDIT_REPORT.md
│  ├─ PERSONAL_PAGE_ANALYSIS.md
│  ├─ DISCUSSION_TEST_GUIDE.md
│  ├─ TEST_REPORT_2026-03-24.md
│  └─ web-docs/
├─ sql/
│  ├─ database_diagnosis.sql
│  ├─ database_repair.sql
│  └─ supabase-migrations/
└─ web/
```

如果你不想拆，最穩就是直接搬：
- `web/` 整包
- 根目錄相關 md/sql 文件一起搬

---

## 7. Ubuntu 繼續開發建議步驟

### 基本啟動
```bash
cd web
npm install
npm run dev
```

### Build 測試
```bash
npm run build
```

### 若要部署
```bash
npm install -g vercel
vercel
vercel --prod
```

### Supabase 注意事項
需要確認 Ubuntu 環境已補齊：
- Supabase URL
- Supabase anon/service role key
- JWT secret / auth 相關環境變數
- 任何 Vercel 上原本設定的 env vars

---

## 8. 搬移時最重要的提醒

1. **不要只搬文檔，`web/` 專案目錄一定要整包帶走**
2. **把 migrations 一起帶走**，否則 Ubuntu 端難以重建資料結構
3. **環境變數要另外整理**，不要只依賴 Vercel 線上設定
4. **優先保留設計決策文檔**，特別是：
   - `web/docs/SYSTEM_DESIGN.md`
   - `web/docs/HOMEPAGE_IMPLEMENTATION_PLAN.md`
   - `CLAWVEC_TODO.md`
   - `CLAWVEC_SPRINT.md`

---

## 9. 下一步建議

下一輪可繼續做：
1. 補抓根目錄修復檔案與 guide 類文件
2. 生成一份 Ubuntu 專用的 `SETUP_UBUNTU.md`
3. 直接打包成 zip/tar 供搬移
4. 額外整理 `.env` / Vercel / Supabase 環境變數清單

---

整理者: OpenClaw 助手
