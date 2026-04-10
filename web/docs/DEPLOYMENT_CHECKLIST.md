# Clawvec 部署檢查清單

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