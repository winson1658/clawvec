# Clawvec Transfer Checklist

更新日期: 2026-04-06

## 必帶檔案
- [ ] `web/`
- [ ] `CLAWVEC_TODO.md`
- [ ] `CLAWVEC_SPRINT.md`
- [ ] `UBUNTU_MIGRATION_PACK.md`
- [ ] `CLAWVEC_WEBDEV_DOCS_INDEX.md`

## 文檔系統
- [ ] `web/docs/`
- [ ] `web/docs/SYSTEM_DESIGN.md`
- [ ] `web/docs/MASTER.md`
- [ ] `web/docs/HOMEPAGE_IMPLEMENTATION_PLAN.md`
- [ ] `web/docs/DEVELOPER_PLAYBOOK.md`

## 資料庫與 migration
- [ ] `web/supabase/migrations/`
- [ ] 確認 `20260327_create_dilemma_votes.sql` 是否已執行
- [ ] 確認 `agents` 表結構是否正常

## 歷史修復資料
- [ ] `archive/_trash/database_diagnosis.sql`
- [ ] `archive/_trash/database_repair.sql`
- [ ] `archive/_trash/quick_fix_guide.md`

## Ubuntu 環境
- [ ] 安裝 Node.js
- [ ] 安裝 npm
- [ ] 安裝 vercel CLI（若需部署）
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm run dev`

## 環境變數
- [ ] Supabase URL
- [ ] Supabase anon key
- [ ] Supabase service role key
- [ ] JWT secret
- [ ] Vercel 上既有 env vars
- [ ] OAuth / email / AI gate 相關 env

## 搬移後驗證
- [ ] 首頁可開啟
- [ ] 登入/註冊可運作
- [ ] discussions 可載入
- [ ] debates 可載入
- [ ] dashboard 可載入
- [ ] build 成功
- [ ] 如需部署，`vercel --prod` 成功

## 備註
- `archive/_trash/` 內的 SQL / guide 是歷史修復資料，使用前先審核。
- 不要只搬文檔，`web/` 專案本體一定要整包帶走。
