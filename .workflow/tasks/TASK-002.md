# TASK-002

## 任務單 #002
**功能名稱**：建立所有功能頁框架（仿 Claude 左側導航）
**任務描述**：
根據 ARCHITECTURE.md 模塊清單，建立所有功能頁的框架結構。
每個頁面包含：layout.tsx（側邊導航）、page.tsx（頁面內容）、loading.tsx、error.tsx。

**影響文件清單**（必須明確列出）：
- 新建：src/app/explore/page.tsx
- 新建：src/app/explore/layout.tsx
- 新建：src/app/chronicle/page.tsx
- 新建：src/app/chronicle/layout.tsx
- 新建：src/app/agents/page.tsx
- 新建：src/app/agents/layout.tsx
- 新建：src/app/sanctuary/page.tsx
- 新建：src/app/sanctuary/layout.tsx
- 新建：src/app/enter/page.tsx
- 新建：src/app/enter/layout.tsx
- 新建：src/app/search/page.tsx
- 新建：src/app/search/layout.tsx
- 修改：src/components/navigation/Sidebar.tsx（更新導航項目）
- 修改：src/components/navigation/TopNav.tsx（更新頂部導航）

**不得觸碰的文件**：
- src/app/page.tsx（首頁已完成）
- src/app/layout.tsx（根佈局）
- src/app/globals.css（全局樣式）
- features/ 目錄（尚未建立模塊）
- supabase/migrations/

**輸入**：
- ARCHITECTURE.md 模塊清單
- 現有 Sidebar/TopNav 組件

**輸出**：
- 6 個功能頁框架（Explore, Chronicle, Agents, Sanctuary, Enter, Search）
- 每頁有 layout + page + loading + error
- 側邊導航更新

**邊界條件**：
- [ ] 每個頁面有獨立 layout（含側邊導航）
- [ ] 頁面內容顯示模塊名稱和描述
- [ ] 側邊導航高亮當前頁面
- [ ] 頂部導航顯示當前頁面名稱
- [ ] 所有頁面響應式設計
- [ ] 404 頁面處理

**使用的現有資源**：
- src/components/navigation/Sidebar.tsx
- src/components/navigation/TopNav.tsx
- src/styles/tokens.css

**完成標準**：
- TypeScript 無類型錯誤
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
- 瀏覽器驗證所有頁面可訪問

---

## AI 功能附加資訊
**使用的 Prompt**：
- 無

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
- [x] 需求確認：建立 6 個功能頁框架
- [x] 技術設計：Server Components + layout 模式
- [x] 驗收標準：7 個邊界條件

### Claude Code Developer（2026-06-21）
- [x] 建立 (features)/layout.tsx（通用佈局）
- [x] 建立 explore/page.tsx（內容探索）
- [x] 建立 chronicle/page.tsx（編年史）
- [x] 建立 agents/page.tsx（智能體）
- [x] 建立 sanctuary/page.tsx（文明敘事）
- [x] 建立 enter/page.tsx（身份閘門）
- [x] 建立 search/page.tsx（搜索）
- [x] 建立 (features)/loading.tsx + error.tsx
- [x] 更新 Sidebar（添加 Enter 導航）

### Tester Agent（2026-06-21）
- [x] TypeScript 檢查：tsc --noEmit 通過
- [x] 構建檢查：next build 成功（7 個頁面）
- [x] 瀏覽器驗證：所有頁面可訪問

### Codex Review（2026-06-21）
- [x] 快速審查：無嚴重問題（框架階段）

### Deploy Agent（2026-06-21）
- [x] Vercel 部署成功
- [x] Alias 設定：clawvec.com
