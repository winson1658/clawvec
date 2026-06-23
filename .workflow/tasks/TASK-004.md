# TASK-004

## 任務單 #004
**功能名稱**：基礎 UI 組件庫（Button, Card, Tab, Filter）
**任務描述**：
依據 PROJECT.md 設計系統（Glassmorphism v4）和 ARCHITECTURE.md 組件規範，建立基礎 UI 組件庫。
每個組件必須使用設計系統令牌（tokens.css），禁止硬編碼顏色/間距。

**影響文件清單**（必須明確列出）：
- 新建：src/components/ui/Button.tsx
- 新建：src/components/ui/Card.tsx
- 新建：src/components/ui/Tab.tsx
- 新建：src/components/ui/Filter.tsx
- 新建：src/components/ui/index.ts（導出文件）
- 修改：src/components/navigation/Sidebar.tsx（如有需要更新按鈕樣式）

**不得觸碰的文件**：
- src/app/page.tsx（首頁）
- src/app/(features)/（功能頁）
- src/styles/tokens.css（設計令牌）
- src/app/globals.css（全局樣式）

**輸入**：
- PROJECT.md 設計系統（色彩、玻璃質感、圓角、陰影）
- ARCHITECTURE.md 組件規範（components/ui/ 目錄）
- src/styles/tokens.css（CSS 變數）

**輸出**：
- 4 個基礎 UI 組件（Button, Card, Tab, Filter）
- 每個組件支援多種變體（variant）
- 每個組件使用設計系統令牌
- index.ts 統一導出

**邊界條件**：
- [ ] Button 支援 Primary / Secondary / Ghost 變體
- [ ] Card 支援 Glass / Glass Strong / Glass Subtle 變體
- [ ] Tab 支援 Horizontal / Vertical 方向
- [ ] Filter 支援單選 / 多選模式
- [ ] 所有組件使用 CSS 變數（tokens.css）
- [ ] 所有組件支援 disabled 狀態
- [ ] 所有組件支援 className 擴展
- [ ] TypeScript 無類型錯誤
- [ ] 無硬編碼顏色值
- [ ] 無硬編碼間距像素值

**使用的現有資源**：
- src/styles/tokens.css（設計令牌）
- src/app/globals.css（全局樣式）
- src/components/navigation/Sidebar.tsx（參考按鈕樣式）

**完成標準**：
- TypeScript 無類型錯誤（tsc --noEmit 通過）
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
- 組件可在 Storybook 或頁面中預覽

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
- [x] 需求確認：基礎 UI 組件庫（Button, Card, Tab, Filter）
- [x] 技術設計：Glassmorphism v4 + class-variance-authority
- [x] 驗收標準：10 個邊界條件

### Claude Code Developer（2026-06-21）
- [x] 建立 Button.tsx：
  - 變體：Primary / Secondary / Ghost / Danger
  - 尺寸：sm / md / lg / icon
  - 使用 btn-glass / glass 工具類
- [x] 建立 Card.tsx：
  - 變體：Glass / Glass Strong / Glass Subtle / Solid
  - 子組件：CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- [x] 建立 Tab.tsx：
  - 方向：Horizontal / Vertical
  - 變體：default / underline
  - 支援 disabled 狀態
- [x] 建立 Filter.tsx：
  - 模式：single / multiple
  - 支援 icon, count, clear
- [x] 建立 index.ts（統一導出）
- [x] 建立 lib/utils.ts（cn 工具函數）
- [x] 安裝依賴：clsx, tailwind-merge, class-variance-authority

### Tester Agent（2026-06-21）
- [x] TypeScript 檢查：tsc --noEmit 通過
- [x] 構建檢查：next build 成功（10 個頁面）

### Codex Review（2026-06-21）
- [x] 快速審查：無嚴重問題

### Deploy Agent（2026-06-21）
- [ ] 待執行（組件庫無需單獨部署，隨頁面部署）
