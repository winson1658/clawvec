# Clawvec 自動部署計畫

## 📋 部署前準備

### ✅ 已完成
- [x] 專案檔案已解壓縮到 `/home/winson/.openclaw/workspace/web/`
- [x] 部署腳本已確認 (`deploy.sh`, `vercel.json`)
- [x] 依賴清單已確認 (`package.json`)

### ⏳ 需要你提供

#### 1. Vercel 存取權限
為了自動部署，我需要以下**其中一種**方式：

**選項 A：Vercel Token**（推薦）
- 到 https://vercel.com/account/tokens
- 建立新的 Token
- 給我 Token 值（部署完可刪除）

**選項 B：Vercel CLI 登入**
- 你在終端機執行 `vercel login`
- 授權後我就能使用 CLI 部署

**選項 C：你手動部署**
- 我準備好所有檔案和命令
- 你執行 `npm run deploy` 即可

#### 2. 環境變數確認
部署前請確認這些已在 Vercel Dashboard 設置：

| 變數名 | 值 | 狀態 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://ngxmztmrwroebywqdtjc.supabase.co | ⏳ 待確認 |
| `SUPABASE_SERVICE_ROLE_KEY` | [你的 service_role key] | ⏳ 待確認 |
| `NEXT_PUBLIC_API_BASE_URL` | https://clawvec.com | ⏳ 待確認 |

#### 3. 資料庫修復狀態
- ⏳ SQL 修復是否已執行？（影響 API 功能）
- ⏳ 測試帳號是否已清理？

---

## 🚀 部署流程

### Phase 1: 前置準備（我先做）
1. 檢查專案結構完整性
2. 驗證 package.json 和依賴
3. 準備環境變數檔案

### Phase 2: Build 測試（我先做）
1. 安裝 npm 依賴
2. 執行 `npm run build`
3. 檢查是否有 TypeScript 錯誤
4. 報告 Build 結果

### Phase 3: 部署（需要你的授權）
1. 部署到 Vercel Production
2. 監控部署進度
3. 驗證部署結果

### Phase 4: 部署後驗證（我先做）
1. 測試 https://clawvec.com 可訪問
2. 測試各個 API 端點
3. 報告部署狀態

---

## ⚠️ 重要提醒

### 部署時機
建議在以下情況後部署：
- ✅ 資料庫修復 SQL 已執行
- ✅ 主要功能測試通過
- ✅ 環境變數已設置

### 風險控制
- Build 失敗 → 不會部署
- 部署失敗 → 可立即回滾
- 有問題 → 可回復到上一版本

---

## 📁 部署檔案位置

```
/home/winson/.openclaw/workspace/
├── web/                          # 前端專案
│   ├── app/api/                  # API 路由
│   ├── package.json              # 依賴設定
│   ├── vercel.json               # Vercel 設定
│   ├── deploy.sh                 # 部署腳本
│   └── DEPLOY.md                 # 部署文件
├── CLAWVEC_DATABASE_FIX.sql      # 資料庫修復
├── .env.supabase                 # Supabase 憑證（安全存儲）
└── DEPLOYMENT_PLAN.md            # 本檔案
```

---

## 🎯 下一步行動

請選擇你要我怎麼做：

### 選項 A：全自動部署（推薦）
1. 給我 Vercel Token
2. 確認環境變數已設置
3. 我執行完整部署流程
4. 報告部署結果

### 選項 B：半自動部署
1. 我準備好所有命令和檔案
2. 你執行部署命令
3. 有問題我遠程協助

### 選項 C：先測試後部署
1. 我先執行 Build 測試
2. 報告結果給你
3. 你決定是否部署

---

*準備就緒，等待你的指示！* 🚀
