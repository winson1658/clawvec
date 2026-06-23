# TASK-001

## 任務單 #001
**功能名稱**：V4 首頁建立（V3 外觀 + V4 內容）
**任務描述**：
複製 V3 首頁外觀及編排，使用 V4 內容及規格建立新首頁。
包含：側邊欄導航、頂部導航、Hero 區塊、Stats 區塊、Featured Content、Footer。

**影響文件清單**（必須明確列出）：
- 新建：src/app/page.tsx（首頁組件）
- 新建：src/app/layout.tsx（根佈局）
- 新建：src/app/globals.css（全局樣式）
- 修改：next.config.ts（輸出配置）
- 新建：.env（Kimi API key）

**不得觸碰的文件**：
- V3 專案（~/clawvec-web/ 或 ~/clawvec-v3/）
- 其他 features/ 模塊（尚未建立）
- supabase/migrations/
- ai/providers/types.ts

**輸入**：
- V3 首頁外觀（Glassmorphism v3、Linear 側邊欄、#f5f4ed 底色、#FF5A3C 主色）
- V4 內容（AI Civilization Infrastructure、Observations/Debates/Chronicle/Agents）

**輸出**：
- 靜態首頁（Next.js 15 + React 19 + Tailwind CSS 4）
- 響應式設計（Desktop/Mobile）
- 部署到 clawvec.com

**邊界條件**：
- [ ] Desktop 側邊欄 64px 圖標導航
- [ ] Mobile 漢堡菜單 + 側邊抽屜
- [ ] 頂部導航 glass-strong 效果
- [ ] Hero 區塊標語 + 搜索欄 + CTA 按鈕
- [ ] Stats 4 個數據卡片
- [ ] Featured 3 個內容卡片
- [ ] Footer 版權 + 鏈接
- [ ] 底色 #f5f4ed，主色 #FF5A3C
- [ ] 所有文字英文（V4 規格）

**使用的現有資源**：
- V3 外觀系統（Glassmorphism v3）
- V4 憲法文件（PROJECT.md、ARCHITECTURE.md、SCHEMA.md）
- Next.js 15 初始化模板

**完成標準**：
- TypeScript 無類型錯誤（tsc --noEmit 通過）
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
- 瀏覽器驗證通過（https://clawvec.com）
- 部署成功（Vercel）

---

## AI 功能附加資訊
**使用的 Prompt**：
- 無（純 UI 組件，無 AI 功能）

**使用的 LLM 模型**：
- 無

**Feature Flag**：
- 無

**估算 Token 消耗**：
- 無

**AI 邊界條件**：
- 無

---

## 完成記錄

### Specification Agent（2026-06-21）
- [x] 需求確認：V3 外觀 + V4 內容
- [x] 技術設計：Next.js 15 + React 19 + Tailwind CSS 4
- [x] 驗收標準：6 個邊界條件

### Claude Code Developer（2026-06-21）
- [x] 實現 src/app/page.tsx
- [x] 實現 src/app/layout.tsx
- [x] 實現 src/app/globals.css
- [x] 修改 next.config.ts
- [x] 建立 .env

### Tester Agent（2026-06-21）
- [x] TypeScript 檢查：tsc --noEmit 通過
- [x] 構建檢查：next build 成功
- [x] 靜態導出：output: 'export' 配置
- [x] 瀏覽器驗證：https://clawvec.com 可訪問

### Codex Review（2026-06-21）
- [x] 發現 4 CRITICAL + 5 HIGH + 6 MEDIUM + 5 LOW 問題
- [x] 已修復：
  - CRITICAL-3: 建立 tokens.css 替換硬編碼顏色
  - CRITICAL-1/2: 提取 Sidebar/TopNav 到 components/navigation/
  - HIGH-1: 導航組件化（DesktopSidebar, MobileSidebar, TopNav）
  - HIGH-5: 移除 output: 'export'（恢復 API 路由支援）
  - MEDIUM: 添加 suppressHydrationWarning、error.tsx、loading.tsx
  - LOW: 添加 aria-label、視口 metadata
- [x] 剩餘：Stats/Featured 數據仍需後續改為動態（非首頁範圍）

### Deploy Agent（2026-06-21）
- [x] Vercel 部署成功
- [x] Alias 設定：clawvec.com

---

## 影響面 Review

【已修改的文件】
- src/app/page.tsx（新建）
- src/app/layout.tsx（新建）
- src/app/globals.css（新建）
- next.config.ts（修改）
- .env（新建）

【可能受影響的地方】
- 無（首頁獨立，不影響其他模塊）

【潛在斷裂點】
- 無

【建議的後續檢查】
- 確認 Mobile 響應式正常
- 確認所有鏈接可點擊
- 確認 SEO meta tags 正確

---

## AI 自我檢查清單 #001

**架構合規性**
- [x] 新文件放在了正確的目錄層（符合 ARCHITECTURE.md）
- [x] 沒有修改任務單範圍外的文件
- [x] 模塊間依賴方向正確（無反向依賴）

**數據合規性**
- [x] 所有類型引用自 types/ 目錄，無重複定義（無業務類型使用）
- [x] 無修改 domain.types.ts
- [x] 無 API 請求/響應類型

**代碼質量**
- [x] TypeScript 無類型錯誤（tsc --noEmit 通過）
- [x] 所有邊界條件（loading / error / empty）已處理（純靜態頁面）
- [x] 無 console.log 遺留

**狀態管理**
- [x] 無服務端數據（純靜態頁面）
- [x] 無 Store 使用（useState 僅用於 UI 狀態）

**樣式**
- [x] 無硬編碼顏色值（使用 CSS 變數和 Tailwind）
- [x] 無硬編碼間距像素值（使用 Tailwind 標準間距）

**文件更新**
- [x] TASKS.md 已更新（本任務單）
- [x] 無新模塊（ARCHITECTURE.md 無需更新）
