## 任務單 #007
**功能名稱**：Chronicle 模塊初始化（TradingView 風格時間軸）
**任務描述**：
建立 features/chronicle/ 模塊，實現類似 TradingView 的交互式時間軸：
1. 橫向時間軸，顯示 AI 歷史里程碑
2. 支援滑鼠滾輪縮放（zoom in/out）
3. 支援滑鼠拖曳平移（pan）
4. 點擊事件顯示詳情
5. 時間刻度自動調整（年/月/日）
6. 響應式佈局

**影響文件清單**（必須明確列出）：
- 新建：features/chronicle/README.md
- 新建：features/chronicle/index.ts
- 新建：features/chronicle/types/chronicle.types.ts
- 新建：features/chronicle/components/Timeline.tsx（核心時間軸組件）
- 新建：features/chronicle/components/TimelineEvent.tsx（單個事件節點）
- 新建：features/chronicle/components/EventDetail.tsx（事件詳情彈窗）
- 新建：features/chronicle/hooks/useTimeline.ts（時間軸狀態管理）
- 新建：features/chronicle/hooks/useZoomPan.ts（縮放拖曳邏輯）
- 新建：features/chronicle/services/milestones.service.ts（里程碑數據服務）
- 新建：features/chronicle/data/mockMilestones.ts（mock 數據）
- 修改：src/app/(features)/chronicle/page.tsx（引入 Timeline）

**不得觸碰的文件**：
- features/ 下的其他模塊
- ai/ 目錄
- store/ 目錄
- components/ui/ 下的基礎組件

**輸入**：
- 時間範圍（開始日期 - 結束日期）
- 縮放級別（zoom level）
- 平移偏移（pan offset）
- 里程碑數據（id, date, title, description, category, impact）

**輸出**：
- 渲染交互式時間軸畫布
- 顯示時間刻度（根據縮放級別動態調整）
- 顯示事件節點（不同類型不同顏色/圖標）
- 點擊事件彈出詳情面板

**邊界條件**：
- [ ] 縮放限制（最小 1 天，最大 100 年）
- [ ] 平移邊界（不能拖出數據範圍）
- [ ] 無數據時顯示空狀態
- [ ] 移動端觸控支援（雙指縮放、單指拖曳）
- [ ] 性能優化（虛擬渲染，只渲染可視區域事件）

**使用的現有資源**：
- src/components/ui/Card.tsx（詳情面板）
- src/components/ui/Button.tsx（關閉按鈕）
- src/styles/tokens.css（CSS 變數）
- src/styles/globals.css（glass 工具類）

**完成標準**：
- TypeScript 無類型錯誤
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
- 模塊自包含，無外部依賴
- 滑鼠縮放/拖曳流暢（60fps）
