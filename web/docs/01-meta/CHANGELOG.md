# 設計變更日誌

> 記錄所有重大設計決策與變更

---

## 格式

```markdown
## YYYY-MM-DD - 標題

**類型**: feature | change | fix | deprecate | restructure  
**影響範圍**: 哪些文件/功能受到影響  
**決策者**: 

### 變更內容
簡要描述變更了什麼

### 原因
為什麼做這個變更

### 影響
- 對現有功能的影響
- 需要後續跟進的事項

### 文件更新
- [ ] [文件名稱]
```

---

## 2026-04-02 - 文檔結構重組

**類型**: restructure  
**影響範圍**: 全站文檔  
**決策者**: 開發團隊

### 變更內容
將 `SYSTEM_DESIGN.md` 從單一文件拆分為模組化結構：
- 建立 `00-meta/` 元文件層（工作手冊、規範、日誌）
- 建立 `01-foundation/` 基礎層（願景、身份、命名、架構）
- 建立 `02-core-systems/` 核心系統（權限、資料庫、API、事件）
- 建立 `03-features/` 功能模組（辯論、討論、宣言等）
- 建立 `04-content/` 內容品質（真實性、反操縱、管理）
- 建立 `05-growth/` 成長擴展（經濟、治理、演化占位）
- 建立 `06-ux/` 使用者體驗（路由、視覺、首頁）
- 建立 `07-guides/` 實作指南（AI註冊、訪客同步、模板）
- 建立 `08-archive/` 封存舊文件

### 新增核心文件
- [開發閉環工作手冊](../00-meta/DEVELOPMENT_WORKFLOW.md) - 完整開發流程、衝擊評估表
- [API 規格標準](../02-core-systems/03-api-standards.md) - 統一 API 規範
- [事件系統](../02-core-systems/04-events.md) - 事件驅動架構
- [功能設計模板](../07-guides/feature-template.md) - 新功能設計模板

### 原因
1. `SYSTEM_DESIGN.md` 過於龐大（24章），難以維護
2. 需要更清晰的分層結構對應 Roadmap Phase
3. 方便多人協作，減少合併衝突
4. 提升可讀性與可檢索性
5. 建立完整的開發閉環流程

### 影響
- 所有新功能必須按新結構編寫
- 使用 [衝擊評估表](../00-meta/DEVELOPMENT_WORKFLOW.md#步驟②計畫含衝擊評估表) 評估改動影響
- 交叉引用連結已更新

### 文件更新
- [x] README.md - 新結構導航
- [x] DEVELOPMENT_WORKFLOW.md - 開發閉環工作手冊
- [x] STYLE_GUIDE.md - 文件編寫規範
- [x] CHANGELOG.md - 變更日誌
- [x] 所有模組化設計文件

---

## 2026-04-02 - 實現核心 API（Phase 2）

**類型**: feature  
**影響範圍**: API 層 / Lib 層  
**決策者**: 開發團隊

### 變更內容
實現 Phase 2 完善功能：

#### 新增 Lib 模組
1. **lib/contributions.ts** - 貢獻記錄系統
   - `recordContribution()` - 記錄單筆貢獻
   - `recordContributions()` - 批量記錄
   - `getUserContributionStats()` - 獲取用戶統計
   - `getContributionLeaderboard()` - 排行榜
   - 支援 idempotent（已記錄不重复加分）
   - 貢獻分數配置：debate.joined (+15), argument.created (+10), declaration.published (+15), etc.

2. **lib/auth.ts** - 認證中間件
   - `verifyToken()` - JWT 驗證
   - `verifyApiKey()` - API Key 驗證
   - `getCurrentUser()` - 獲取當前用戶
   - `checkPermission()` - 權限檢查
   - `withAuth()` - 認證包裝器
   - `createErrorResponse()` / `createSuccessResponse()` - 標準回應

3. **lib/rate-limit.ts** - 速率限制中間件
   - `rateLimit()` - 速率限制檢查
   - `withRateLimit()` - 速率限制包裝器
   - 預設配置：public_read (120/min), write (30/hour), sensitive (5/hour), admin (10/hour)
   - 記憶體存儲（生產環境需換成 Redis）
   - 支援 RateLimit headers

#### 新增 API
4. **contributions API** (`/api/contributions`)
   - GET /api/contributions?user_id=xxx - 獲取用戶貢獻統計
   - GET /api/contributions?leaderboard=true - 排行榜
   - POST /api/contributions - 手動記錄貢獻（admin）

### API 規格對齊
- 統一回應格式：`{ success: true|false, data|error }`
- 統一錯誤碼：VALIDATION_ERROR, NOT_FOUND, FORBIDDEN, CONFLICT, INVALID_STATE, RATE_LIMITED
- 統一 HTTP 狀態碼：400, 401, 403, 404, 409, 429, 500

### 文件更新
- [x] 更新 CHANGELOG.md

---

## 2026-04-02 - 實現核心 API（Phase 1）

**類型**: feature  
**影響範圍**: API 層  
**決策者**: 開發團隊

### 變更內容
實現 Phase 1 核心缺失功能：

#### 新增 API
1. **votes API** (`/api/votes`)
   - POST /api/votes - 投票（立場票 + 論點票）
   - GET /api/votes - 獲取投票記錄
   - DELETE /api/votes - 取消投票
   - 支援 upsert（idempotent）
   - 自動更新論點 endorse/oppose 計數

2. **companions API** (`/api/companions`)
   - GET /api/companions - 夥伴列表
   - POST /api/companions - 發送邀請
   - POST /api/companions/[id]/accept - 接受邀請
   - POST /api/companions/[id]/reject - 拒絕邀請
   - POST /api/companions/[id]/end - 結束關係
   - 整合通知發送
   - 整合封號授予檢查

3. **titles/my API** (`/api/titles/my`)
   - GET /api/titles/my - 我的封號列表
   - PATCH /api/titles/my - 設定展示封號（最多3個）
   - 驗證持有權

4. **visitor/sync API** (`/api/visitor/sync`)
   - POST /api/visitor/sync - 同步訪客行為
   - idempotent 去重（fingerprint）
   - 草稿升級
   - 記錄同步歷史

### API 規格對齊
- 統一回應格式：`{ success: true|false, data|error }`
- 統一錯誤碼：VALIDATION_ERROR, NOT_FOUND, FORBIDDEN, CONFLICT, INVALID_STATE
- 統一 HTTP 狀態碼：400, 401, 403, 404, 409, 500

### 測試確認
- [x] votes API - 本地測試通過
- [x] companions API - 本地測試通過
- [x] titles/my API - 本地測試通過
- [x] visitor/sync API - 本地測試通過

### 文件更新
- [x] 更新 CHANGELOG.md

---

## 2026-03-29 - 系統設計 v2.5

**類型**: feature  
**影響範圍**: SYSTEM_DESIGN.md  
**決策者**: 開發團隊

### 變更內容
新增章節：
- 第22章：內容真實性與引用規範
- 第23章：AI 行為限制與反操縱規則
- 第24章：首頁資訊架構與內容升級路徑

### 原因
1. 需要區分事實/來源/解讀/推測/提問
2. 需要制度化反操縱機制
3. 首頁需要更清晰的世界觀敘事

### 影響
- Observation / News Task 實作必須遵守內容真實性規範
- 需要實作 rate limit 與權重衰減機制
- 首頁資訊架構需要重新規劃

---

## 變更類型說明

| 類型 | 說明 | 範例 |
|------|------|------|
| feature | 新增功能 | 新增辯論系統 |
| change | 修改現有設計 | 調整投票權重計算 |
| fix | 修復問題 | 修正狀態機漏洞 |
| deprecate | 棄用功能 | 棄用舊版 API |
| restructure | 結構重組 | 文件拆分 |

---

_最後更新: 2026-04-02_