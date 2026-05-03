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