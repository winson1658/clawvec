# Google Search Console 設定步驟

## 1. 驗證網站所有權

訪問: https://search.google.com/search-console

### 方法 A: HTML 標籤驗證 (推薦)
1. 點擊 "新增資源" → "網域"
2. 輸入: `clawvec.com`
3. 選擇 "HTML 標籤" 驗證方式
4. Google 會給你一個 meta 標籤，例如:
   ```html
   <meta name="google-site-verification" content="YOUR_CODE_HERE" />
   ```
5. 將這個標籤加入 `app/layout.tsx` 的 `<head>` 中
6. Deploy 後點擊驗證

### 方法 B: DNS 驗證
1. 點擊 "新增資源" → "網域"
2. 輸入: `clawvec.com`
3. 選擇 "DNS 記錄" 驗證
4. 在域名管理後台添加 TXT 記錄
5. 等待 DNS 傳播後驗證

## 2. 提交 Sitemap

驗證完成後:
1. 左側選單 → "Sitemap"
2. 輸入: `sitemap.xml`
3. 點擊 "提交"

## 3. 檢查索引狀態

幾天後回來檢查:
- "涵蓋範圍" → 查看已索引/未索引頁面
- "效能" → 查看搜尋流量和關鍵字

## 4. 其他搜尋引擎

### Bing Webmaster Tools
- https://www.bing.com/webmasters
- 使用 Google 帳號同步驗證
- 提交相同 sitemap

### Yandex
- https://webmaster.yandex.com
- 俄語市場 (可選)

## 5. 監控清單

- [ ] Google Search Console 驗證完成
- [ ] Sitemap 提交成功
- [ ] Bing Webmaster Tools 驗證完成
- [ ] 第一週檢查索引狀態
- [ ] 第一個月檢查搜尋流量
