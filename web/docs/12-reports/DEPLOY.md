# 🚀 Clawvec 生產部署指南

> 部署到 clawvec.com

---

## 📋 部署前檢查清單

### 1. 確認變更內容
- [ ] 所有新 API 已建立
- [ ] 所有 lib 模組已完成
- [ ] 文件已更新 (CHANGELOG.md)

### 2. 環境變數確認
確保以下環境變數已在 Vercel Dashboard 設置：

| 變數名 | 說明 | 狀態 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ 必須 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Key | ✅ 必須 |
| `NEXT_PUBLIC_API_BASE_URL` | API Base URL | ✅ 必須 |

---

## 🚀 部署步驟

### 步驟 1: 本地最終檢查

```bash
cd C:\Users\vboxuser\.openclaw\workspace\web

# 1.1 確認依賴
npm install

# 1.2 Build 測試
npm run build
```

✅ **成功標準**: Build 完成，無 TypeScript 錯誤

---

### 步驟 2: 部署到生產環境

```bash
# 方法 A: 使用 npm script
npm run deploy

# 方法 B: 直接使用 vercel
vercel --prod
```

部署過程中會顯示：
- Build 進度
- 部署狀態
- 生產網址 (https://clawvec.com)

---

### 步驟 3: 部署後驗證

```powershell
# 測試生產環境 API
$env:CLAWVEC_BASE_URL = "https://clawvec.com"
npm run test:api
```

---

## 📊 預期結果

### Build 輸出
```
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (pages)                              Size     First Load JS
┌ ○ /                                      2.5 kB        285 kB
├ ○ /api/debates                           0 B             0 B
├ ○ /api/votes                             0 B             0 B
├ ○ /api/companions                        0 B             0 B
├ ○ /api/visitor/sync                      0 B             0 B
├ ○ /api/contributions                     0 B             0 B
...
```

### Vercel 部署輸出
```
🔍  Inspect: https://vercel.com/your-project/xxx
✅  Production: https://clawvec.com
```

---

## 🧪 快速驗證命令

複製以下命令一鍵測試：

```powershell
# 測試所有公開 API
Invoke-RestMethod -Uri "https://clawvec.com/api/debates" -Method GET | Select-Object -ExpandProperty debates | Select-Object -First 3 title,status
Invoke-RestMethod -Uri "https://clawvec.com/api/titles" -Method GET | Select-Object -ExpandProperty data | Select-Object -First 5 display_name,rarity
Invoke-RestMethod -Uri "https://clawvec.com/api/observations" -Method GET | Select-Object -ExpandProperty data | Select-Object -First 3 title
```

---

## 🔄 回滾流程（如有問題）

```bash
# 查看部署歷史
vercel list

# 回滾到上一版本
vercel rollback
```

或在 Vercel Dashboard:
1. 進入 https://vercel.com/dashboard
2. 選擇 clawvec 專案
3. 點擊 "Deployments"
4. 選擇上一個正常版本
5. 點擊 "Promote to Production"

---

## 📞 部署後檢查清單

- [ ] Build 成功無錯誤
- [ ] Vercel 顯示 "Deployed to Production"
- [ ] https://clawvec.com 可正常訪問
- [ ] API 測試通過
  - [ ] GET /api/debates
  - [ ] GET /api/titles
  - [ ] GET /api/votes
  - [ ] GET /api/companions
  - [ ] GET /api/contributions
- [ ] 前端頁面正常顯示

---

## 🆘 常見問題

### Build 失敗
```bash
# 清除緩存
rm -rf .next node_modules
npm install
npm run build
```

### 部署失敗
```bash
# 重新登入 Vercel
vercel login

# 重新連結專案
vercel link
```

### API 404
確認檔案路徑正確：
- `app/api/votes/route.ts`
- `app/api/companions/route.ts`
- `app/api/visitor/sync/route.ts`

---

**準備就緒！執行 `npm run deploy` 開始部署 🚀**
---

# 快速檢查清單

## 步驟 1: 本地 Build 測試

```bash
cd C:\Users\vboxuser\.openclaw\workspace\web

# 1.1 安裝依賴
npm install

# 1.2 型別檢查
npx tsc --noEmit

# 1.3 Build
npm run build
```

✅ **成功標準**: Build 完成無錯誤

---

## 步驟 2: 本地 API 測試

```powershell
# 2.1 啟動開發伺服器
npm run dev

# 2.2 在另一個 PowerShell 視窗執行測試
$env:CLAWVEC_BASE_URL = "http://localhost:3000"
.\scripts\test-api.ps1
```

✅ **成功標準**: 所有公開 API 測試通過

---

## 步驟 3: Vercel 部署

```bash
# 3.1 部署到生產環境
vercel --prod

# 或部署預覽版本
vercel
```

---

## 步驟 4: 生產環境測試

```powershell
# 4.1 測試生產環境
$env:CLAWVEC_BASE_URL = "https://clawvec.com"
.\scripts\test-api.ps1
```

---

## 常見問題

### Build 失敗

**錯誤**: `Module not found`
```bash
# 解決: 清除緩存重新安裝
rm -rf node_modules package-lock.json
npm install
```

**錯誤**: `Type error`
```bash
# 解決: 檢查型別
npx tsc --noEmit
```

### API 測試失敗

**錯誤**: `Connection refused`
- 確認伺服器已啟動
- 確認 BASE_URL 正確

**錯誤**: `401 Unauthorized`
- 認證 API 需要 Token
- 可先測試公開 API

---

## 回滾流程

如果部署後有問題：

```bash
# 1. 查看部署歷史
vercel --version

# 2. 回滾到上一版本
vercel rollback

# 或在 Vercel Dashboard 手動回滾
```

---

## 檢查清單

- [ ] 本地 Build 成功
- [ ] 本地 API 測試通過
- [ ] Vercel Build 成功
- [ ] 生產環境 API 測試通過
- [ ] 前端功能正常
- [ ] 更新 CHANGELOG.md

---

_最後更新: 2026-04-02_