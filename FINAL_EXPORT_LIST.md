# Clawvec Final Export List

更新日期: 2026-04-06
目的: 將 Clawvec 網頁開發相關內容完整搬移到 Ubuntu 系統。

---

## 1. 必打包內容

### 專案本體
- `web/`

### 專案進度與規劃
- `CLAWVEC_TODO.md`
- `CLAWVEC_SPRINT.md`
- `MEMORY.md`（如需保留 Clawvec 相關歷史脈絡）

### 搬移說明文件
- `UBUNTU_MIGRATION_PACK.md`
- `CLAWVEC_WEBDEV_DOCS_INDEX.md`
- `SETUP_UBUNTU.md`
- `TRANSFER_CHECKLIST.md`

### 歷史修復資料
- `archive/_trash/database_diagnosis.sql`
- `archive/_trash/database_repair.sql`
- `archive/_trash/quick_fix_guide.md`

---

## 2. `web/` 內重點子目錄

### 文件與設計
- `web/docs/`

### 資料庫與 migration
- `web/supabase/migrations/`

### 建置與部署配置
- `web/package.json`
- `web/vercel.json`
- `web/README.md`

### 其他已確認的分析/測試文件
- `web/NAVIGATION_AUDIT_REPORT.md`
- `web/PERSONAL_PAGE_ANALYSIS.md`
- `web/DISCUSSION_TEST_GUIDE.md`
- `web/TEST_REPORT_2026-03-24.md`

---

## 3. Ubuntu 搬移後優先檢查

1. Node.js / npm 是否已安裝
2. `.env.local` 是否已補齊
3. `npm install` 是否成功
4. `npm run build` 是否成功
5. `npm run dev` 是否成功
6. Supabase 連線是否正常
7. 是否需要執行 `20260327_create_dilemma_votes.sql`
8. `agents` 表是否仍有 `password_hash` 結構問題

---

## 4. 建議 PowerShell 壓縮方式

如果你要直接在 Windows 打包成 zip，可用：

```powershell
cd C:\Users\vboxuser\.openclaw\workspace
Compress-Archive -Path web,CLAWVEC_TODO.md,CLAWVEC_SPRINT.md,UBUNTU_MIGRATION_PACK.md,CLAWVEC_WEBDEV_DOCS_INDEX.md,SETUP_UBUNTU.md,TRANSFER_CHECKLIST.md,archive\_trash\database_diagnosis.sql,archive\_trash\database_repair.sql,archive\_trash\quick_fix_guide.md -DestinationPath clawvec-ubuntu-migration.zip -Force
```

如果也想把 `MEMORY.md` 一起包進去，可用：

```powershell
cd C:\Users\vboxuser\.openclaw\workspace
Compress-Archive -Path web,CLAWVEC_TODO.md,CLAWVEC_SPRINT.md,MEMORY.md,UBUNTU_MIGRATION_PACK.md,CLAWVEC_WEBDEV_DOCS_INDEX.md,SETUP_UBUNTU.md,TRANSFER_CHECKLIST.md,archive\_trash\database_diagnosis.sql,archive\_trash\database_repair.sql,archive\_trash\quick_fix_guide.md -DestinationPath clawvec-ubuntu-migration-with-memory.zip -Force
```

---

## 5. 備註

- `MEMORY.md` 可能包含較廣的個人/歷史上下文，若只為開發搬移，可視情況不打包。
- `archive/_trash/` 內檔案屬歷史修復資料，使用前先審查。
- `test_after_fix.ps1` 目前未找到，不在最終打包清單內。
- 真正關鍵的是 `web/`、`web/docs/`、`web/supabase/migrations/` 和環境變數。

---

整理者: OpenClaw 助手
