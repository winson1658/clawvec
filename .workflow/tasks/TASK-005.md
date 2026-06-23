## 任務單 #005
**功能名稱**：導航系統（PrimaryNav + Footer）
**任務描述**：
建立全局導航系統：
1. PrimaryNav — 頂部導航欄（玻璃質感、Logo、主導航、用戶區）
2. Footer — 全局頁腳（版權、鏈接、社交）
3. 導航配置 — 集中管理導航項，避免硬編碼

**影響文件清單**（必須明確列出）：
- 新建：src/components/navigation/PrimaryNav.tsx
- 新建：src/components/navigation/Footer.tsx
- 新建：src/config/navigation.ts
- 修改：src/app/layout.tsx（引入 PrimaryNav + Footer）
- 修改：src/components/ui/index.ts（導出 Filter 組件）
- 修改：src/components/navigation/index.ts（導出所有導航組件）

**不得觸碰的文件**：
- features/ 下的所有文件
- app/ 下的路由頁面（除 layout.tsx）
- ai/ 目錄
- store/ 目錄

**輸入**：
- 導航項配置（從 navigation.ts 讀取）
- 當前路徑（from usePathname）
- 用戶登入狀態（可選，先留 placeholder）

**輸出**：
- 渲染頂部導航欄（響應式：桌面展開 / 移動漢堡菜單）
- 渲染頁腳（多欄佈局）
- 當前項高亮

**邊界條件**：
- [ ] 移動端：漢堡菜單展開/收起動畫
- [ ] 當前頁面高亮（exact match + 子路由匹配）
- [ ] 滾動時導航欄玻璃效果加強
- [ ] Footer 在內容不足時固定在底部
- [ ] 無用戶時顯示「Enter」按鈕，有用戶時顯示頭像

**使用的現有資源**：
- src/components/ui/Button.tsx（btn-glass 變體）
- src/styles/tokens.css（CSS 變數）
- src/styles/globals.css（glass 工具類）
- lucide-react（圖標）

**完成標準**：
- TypeScript 無類型錯誤
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
- 導航項集中配置，無硬編碼
