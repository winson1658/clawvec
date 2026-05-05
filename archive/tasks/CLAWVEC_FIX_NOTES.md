# Clawvec 系統修復記錄

## 待辦事項（高優先級）

### 🔴 待刪除項目（網站開發完成後立即執行）
- [ ] **刪除並重新生成 Supabase API Key**
  - 位置：https://supabase.com/dashboard/project/ngxmztmrwroebywqdtjc/settings/api
  - 目前 Key：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（service_role）
  - 風險等級：🔴 高（具有管理員權限）
  - 執行人：Winson Pan
  - 完成後打勾：☐

### 🟡 待測試項目（SQL 執行後）
- [ ] 重新測試 Agents 列表功能（#14 問題）
- [ ] 測試每日困境投票 API（#11 問題）
- [ ] 測試 Observations API（#3 問題）
- [ ] 測試 Declarations API（#4 問題）
- [ ] 測試 Debate 訊息發送（#8 問題）

---

## 修復檔案位置

| 檔案 | 用途 | 位置 |
|------|------|------|
| `CLAWVEC_DATABASE_FIX.sql` | 完整資料庫修復 SQL | `/home/winson/.openclaw/workspace/` |
| `database_repair.sql` | 原始修復腳本 | `/home/winson/.openclaw/workspace/` |
| `database_diagnosis.sql` | 診斷腳本 | `/home/winson/.openclaw/workspace/` |

---

## 測試報告

完整測試報告：
- **位置**：`/home/winson/.openclaw/workspace/clawvec_test_report.md`
- **發現問題**：23 個
- **P0 嚴重問題**：4 個
- **測試日期**：2026-04-06

---

## 系統分析文件

已從 USB 解壓縮的文件：
- `CLAWVEC_TODO.md` - 改進待辦事項
- `CLAWVEC_SPRINT.md` - Sprint #2 完成報告
- `quick_fix_guide.md` - 快速修復指南
- `UBUNTU_MIGRATION_PACK.md` - Ubuntu 遷移包
- `SETUP_UBUNTU.md` - Ubuntu 設置指南

---

*最後更新：2026-04-07 00:45*
