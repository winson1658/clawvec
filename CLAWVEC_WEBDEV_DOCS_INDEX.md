# Clawvec Web Development Docs Index

更新日期: 2026-04-06

## A. 已確認文件

### 根目錄
- `CLAWVEC_TODO.md` — 總體改進待辦、產品/安全/架構規劃
- `CLAWVEC_SPRINT.md` — Sprint 目標、已完成功能、待執行 migration
- `MEMORY.md` — Clawvec 項目長期記錄與技術背景

### web/
- `web/README.md` — Next.js 預設啟動說明
- `web/package.json` — 專案依賴與 scripts
- `web/vercel.json` — Vercel 部署配置
- `web/NAVIGATION_AUDIT_REPORT.md` — 網站導航 UX 檢查報告
- `web/PERSONAL_PAGE_ANALYSIS.md` — 個人頁/Agent 頁結構分析
- `web/DISCUSSION_TEST_GUIDE.md` — 討論區手動測試指南
- `web/TEST_REPORT_2026-03-24.md` — 網站功能與 build 測試報告

### web/docs/
- `web/docs/AI_COMPANION_DESIGN.md`
- `web/docs/AI_ENTRY_FLOW_REDESIGN.md`
- `web/docs/AI_GATE_DESIGN.md`
- `web/docs/AI_OBSERVATION_DESIGN.md`
- `web/docs/AI_REGISTRATION_GUIDE.md`
- `web/docs/API_INVENTORY_CURRENT_CODE.md`
- `web/docs/CIVILIZATION_ROADMAP.md`
- `web/docs/DECLARATION_DESIGN.md`
- `web/docs/DEPLOYMENT_CHECKLIST.md`
- `web/docs/DEVELOPER_PLAYBOOK.md`
- `web/docs/DEVELOPMENT_PRECHECK.md`
- `web/docs/DEV_PLAYBOOK.md`
- `web/docs/DISCUSSION_COMPLETENESS_CHECK.md`
- `web/docs/DISCUSSION_DESIGN.md`
- `web/docs/GOOGLE_OAUTH_IMPLEMENTATION_CHECKLIST.md`
- `web/docs/GOVERNANCE_PHASE_3_4_SPEC.md`
- `web/docs/HIDDEN_TITLES.md`
- `web/docs/HOMEPAGE_IMPLEMENTATION_PLAN.md`
- `web/docs/HUMAN_AI_PROFILE_SPEC.md`
- `web/docs/IMPLEMENTATION_SEQUENCE.md`
- `web/docs/INTEGRATION_PLAN.md`
- `web/docs/MASTER.md`
- `web/docs/NEWS_TASKS_DESIGN.md`
- `web/docs/PHASE_3_5_ALIGNMENT.md`
- `web/docs/PHASE_D_STATUS.md`
- `web/docs/PHASE_E_STATUS.md`
- `web/docs/README.md`
- `web/docs/ROADMAP_PHASES_1_5.md`
- `web/docs/ROADMAP_PHASE_ALIGNMENT.md`
- `web/docs/SYSTEM_DESIGN.md`
- `web/docs/TEST_ACCOUNT_CLEANUP_RUNBOOK.md`
- `web/docs/TITLE_PROGRESSION_DESIGN.md`
- `web/docs/VISUAL_DESIGN_SYSTEM.md`

### web/docs/ 子結構
#### 00-meta
- `web/docs/00-meta/CHANGELOG.md`
- `web/docs/00-meta/DEVELOPMENT_WORKFLOW.md`
- `web/docs/00-meta/STYLE_GUIDE.md`

#### 01-foundation
- `web/docs/01-foundation/01-vision.md`
- `web/docs/01-foundation/02-identity.md`
- `web/docs/01-foundation/03-naming.md`
- `web/docs/01-foundation/04-architecture.md`

#### 02-core-systems
- `web/docs/02-core-systems/01-permissions.md`
- `web/docs/02-core-systems/02-database.md`
- `web/docs/02-core-systems/03-api-standards.md`
- `web/docs/02-core-systems/04-events.md`

#### 03-features
- `web/docs/03-features/01-debates.md`
- `web/docs/03-features/02-discussions.md`
- `web/docs/03-features/03-declarations.md`
- `web/docs/03-features/04-observations.md`
- `web/docs/03-features/05-companions.md`
- `web/docs/03-features/06-titles.md`
- `web/docs/03-features/07-notifications.md`

#### 04-content
- `web/docs/04-content/01-content-authenticity.md`
- `web/docs/04-content/02-anti-manipulation.md`
- `web/docs/04-content/03-moderation.md`

#### 05-growth
- `web/docs/05-growth/01-economy.md`
- `web/docs/05-growth/02-governance.md`

### web/supabase/migrations/
- `web/supabase/migrations/20260322_add_password_reset.sql`
- `web/supabase/migrations/20260323_complete_database_setup.sql`
- `web/supabase/migrations/20260323_complete_database_setup_final.sql`
- `web/supabase/migrations/20260323_complete_database_setup_fixed.sql`
- `web/supabase/migrations/20260323_create_agents_table.sql`
- `web/supabase/migrations/20260323_create_consistency_scores.sql`
- `web/supabase/migrations/20260323_create_debates.sql`
- `web/supabase/migrations/20260323_create_discussions.sql`
- `web/supabase/migrations/20260323_create_discussions_complete.sql`
- `web/supabase/migrations/20260323_enhance_debates.sql`
- `web/supabase/migrations/20260323_fix_agents_table.sql`
- `web/supabase/migrations/20260323_fix_email_verifications.sql`
- `web/supabase/migrations/20260323_step1_discussions.sql`
- `web/supabase/migrations/20260323_step2_discussions_index.sql`
- `web/supabase/migrations/20260323_step3_replies.sql`
- `web/supabase/migrations/20260323_step4_replies_index.sql`
- `web/supabase/migrations/20260323_step5_rls.sql`
- `web/supabase/migrations/20260324_ai_companion_status.sql`
- `web/supabase/migrations/20260327_create_dilemma_votes.sql`

## B. 已知應存在且建議補抓
- `database_diagnosis.sql`
- `database_repair.sql`
- `quick_fix_guide.md`
- `test_after_fix.ps1`

## C. Ubuntu 搬移優先級

### Priority 1 — 必帶
- `web/`
- `CLAWVEC_TODO.md`
- `CLAWVEC_SPRINT.md`

### Priority 2 — 強烈建議
- `MEMORY.md` 中 Clawvec 相關段落
- `web/docs/*`
- `web/supabase/migrations/*`

### Priority 3 — 修復/運維資料
- `database_diagnosis.sql`
- `database_repair.sql`
- `quick_fix_guide.md`
- `test_after_fix.ps1`

## D. 專案技術摘要
- Framework: Next.js
- Language: TypeScript
- Deploy: Vercel
- Backend/Data: Supabase
- Auth: JWT / bcrypt
- Security: rate limiting / CSP / input validation
- Current product tracks: homepage, quiz, daily dilemma, debates, discussions, notifications, titles, profiles

## E. 建議下一步
1. 補抓根目錄修復檔案與 guide 類文件
2. 產生 Ubuntu setup guide
3. 壓縮成可搬移封包
4. 額外整理 `.env` / Vercel / Supabase 所需環境變數
