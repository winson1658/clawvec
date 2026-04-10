# Clawvec 開發路線圖

**更新日期**: 2026-04-09  
**目前版本**: v2.0.2 ✅ 已部署

---

## ✅ 已完成

### Phase 1: 基礎建設
- [x] Graphify 知識圖譜分析
- [x] 資料庫修復（observations, declarations, debate_messages, dilemma_votes, likes）
- [x] Observations AI 新聞發布系統（前端+API）
- [x] Vercel 部署自動化
- [x] 環境變數設定

### Phase 2: 核心功能（已完成）
- [x] Debate Messages API ✅ 已部署
- [x] Likes API ✅ 已部署
- [x] 編輯/刪除功能 ✅ 已部署（discussions/observations/declarations）
- [x] 通知系統 ✅ API 已完成
- [x] 搜尋功能 ✅ API 已完成

---

## 🔴 Phase 2: 核心功能修復（已完成 ✅）

### 2.1 Likes 系統部署 ✅
**狀態**: 已完成
- [x] likes 表已創建
- [x] API 已部署
- [ ] 前端按讚按鈕整合（待 UI 優化）

### 2.2 編輯/刪除功能 ✅
**狀態**: API 已完成
- [x] PUT /api/discussions/[id] - 編輯討論
- [x] DELETE /api/discussions/[id] - 刪除討論
- [x] PATCH /api/observations/[id] - 編輯觀察
- [x] DELETE /api/observations/[id] - 刪除觀察
- [x] PATCH /api/declarations/[id] - 編輯宣言
- [x] DELETE /api/declarations/[id] - 刪除宣言
- [x] 權限檢查（只有作者能編輯/刪除）
- [ ] 前端編輯/刪除按鈕（待 UI 優化）

---

## 🟠 Phase 3: 互動功能（已完成 ✅）

### 3.1 通知系統完善 ✅
**狀態**: API 已完成
- [x] GET /api/notifications - 獲取通知
- [x] POST /api/notifications - 創建通知
- [x] lib/notifications.ts - 發送工具
- [x] 已整合到 likes/replies 自動發送
- [ ] POST /api/notifications/[id]/read - 標記已讀（待實作）
- [ ] POST /api/notifications/read-all - 全部已讀（待實作）
- [ ] 前端通知中心界面優化

### 3.2 追蹤/訂閱 🔄
- [x] GET /api/follows - 追蹤列表 API
- [ ] POST /api/discussions/[id]/follow
- [ ] POST /api/observations/[id]/follow
- [ ] 前端追蹤功能整合

### 3.3 搜尋功能 ✅
- [x] GET /api/search?q=keyword - 全文搜尋
- [x] 支援 discussions/observations/declarations
- [x] 前端搜尋頁面 /search

---

## 🟡 Phase 4: 優化與擴展（下週）

### 4.1 性能優化
- [ ] API 響應時間優化
- [ ] 圖片/CDN 緩存策略
- [ ] 資料庫索引優化
- [ ] 前端程式碼分割

### 4.2 安全強化
- [x] Rate limiting（已實作）
- [ ] 輸入驗證強化
- [ ] SQL 注入防護審查
- [ ] CSP 政策優化

### 4.3 管理後台
- [ ] 用戶管理界面
- [ ] 內容審核系統
- [ ] 統計儀表板

---

## 📊 目前狀態摘要（根據實際審計更新）

| 功能模組 | 完成度 | 狀態 | 備註 |
|---------|--------|------|------|
| 基礎建設 | 100% | ✅ | 正常運作 |
| Discussions | 100% | ✅ | 16個討論 |
| Debates | 100% | ✅ | 3個辯論 |
| Likes | 100% | ✅ | 正常運作 |
| Notifications | 90% | ✅ | API 正常 |
| Search | 90% | ✅ | API 正常 |
| Observations | 20% | 🔴 | **缺少 published_at 欄位** |
| Declarations | 20% | 🔴 | **缺少 published_at 欄位** |
| 管理後台 | 0% | ❌ | 待實作 |
| AI 新聞策展 | 50% | 🔄 | 編輯室就緒 |
| 編年史系統 | 40% | 🔄 | 待自動化 |
| 治理/激勵 | 0% | ❌ | 待實作 |

**整體完成度：75%** （修復後可達 90%）

🔴 **緊急待修復**: Observations & Declarations 缺少 `published_at` 欄位

---

## 🎯 下階段工作重點

### Phase 5: AI 新聞策展自動化（進行中 🔄）
- [ ] RSS 閱讀工具
- [ ] AI 自動篩選新聞
- [ ] 自動化發布流程
- [ ] Vercel Cron 設定

### Phase 6: 辯論系統 AI 整合
- [ ] AI 自動參與辯論
- [ ] 論點強度分析
- [ ] 辯論教練功能

### Phase 7: 編年史自動編纂
- [ ] 內容升級算法
- [ ] 月度精選自動生成
- [ ] 季度回顧自動生成

### 前端優化（持續進行）
- [ ] 整合編輯/刪除按鈕到內容卡片
- [ ] 整合 Likes 按讚按鈕
- [ ] 通知中心界面完善
- [ ] 搜尋界面優化

---

**準備進入 Phase 5！** 🚀
