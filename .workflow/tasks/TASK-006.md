## 任務單 #006
**功能名稱**：Explore 模塊初始化
**任務描述**：
建立 features/explore/ 模塊基礎結構：
1. README.md — 模塊文檔（職責、接口、依賴）
2. index.ts — 對外導出（唯一出口）
3. types/explore.types.ts — 模塊類型定義
4. components/ExploreTabs.tsx — 頂部 Tab 切換（Observations/News/Debates/Discussions）
5. components/ContentList.tsx — 內容卡片列表（佔位）
6. components/FilterBar.tsx — 篩選器（佔位）
7. hooks/useObservations.ts — 獲取觀察列表 hook（佔位）
8. hooks/useNews.ts — 獲取新聞列表 hook（佔位）
9. hooks/useDebates.ts — 獲取辯論列表 hook（佔位）
10. services/observations.service.ts — 觀察服務（佔位）
11. services/news.service.ts — 新聞服務（佔位）
12. services/debates.service.ts — 辯論服務（佔位）

**影響文件清單**（必須明確列出）：
- 新建：features/explore/README.md
- 新建：features/explore/index.ts
- 新建：features/explore/types/explore.types.ts
- 新建：features/explore/components/ExploreTabs.tsx
- 新建：features/explore/components/ContentList.tsx
- 新建：features/explore/components/FilterBar.tsx
- 新建：features/explore/hooks/useObservations.ts
- 新建：features/explore/hooks/useNews.ts
- 新建：features/explore/hooks/useDebates.ts
- 新建：features/explore/services/observations.service.ts
- 新建：features/explore/services/news.service.ts
- 新建：features/explore/services/debates.service.ts
- 修改：src/app/explore/page.tsx（引入 ExploreTabs）

**不得觸碰的文件**：
- features/ 下的其他模塊（chronicle/, agents/, sanctuary/, enter/, search/, chat/）
- ai/ 目錄
- store/ 目錄（除非需要 UI 狀態）
- components/ui/ 下的基礎組件

**輸入**：
- 當前 Tab 狀態（Observations / News / Debates / Discussions）
- 篩選條件（分類、來源、狀態）

**輸出**：
- 渲染 Tab 切換界面
- 渲染內容列表（佔位數據）
- 渲染篩選器（佔位 UI）

**邊界條件**：
- [ ] 無數據時顯示空狀態
- [ ] Tab 切換時保留篩選狀態
- [ ] 移動端 Tab 可橫向滾動
- [ ] 加載狀態顯示骨架屏

**使用的現有資源**：
- src/components/ui/Tab.tsx（Tab 組件）
- src/components/ui/Filter.tsx（Filter 組件）
- src/components/ui/Card.tsx（Card 組件）
- src/styles/tokens.css（CSS 變數）
- src/styles/globals.css（glass 工具類）

**完成標準**：
- TypeScript 無類型錯誤
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
- 模塊自包含，無外部依賴（除共享 UI 組件）
