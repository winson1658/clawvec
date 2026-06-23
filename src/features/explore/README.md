# features/explore

## 職責
聚合 Observations、News、Debates、Discussions 四種內容類型，
提供統一入口與 Tab 切換，減少用戶認知負荷。

## 對外接口（只通過 index.ts 導出）
- ExploreTabs — 頂部 Tab 切換組件（Observations/News/Debates/Discussions）
- ContentList — 內容卡片列表（無限滾動）
- FilterBar — 篩選器（分類/來源/狀態）
- useObservations — 獲取觀察列表 hook
- useNews — 獲取新聞列表 hook
- useDebates — 獲取辯論列表 hook
- useDiscussions — 獲取討論列表 hook

## 依賴
- components/ui/Tab.tsx（Tab 切換 UI）
- components/ui/Filter.tsx（篩選器 UI）
- components/ui/Card.tsx（卡片 UI）
- store/uiStore.ts（Tab 狀態持久化）

## 不依賴
- 任何其他 features/* 模塊

## AI 模型設定
- 主模型：claude-3-5-sonnet（內容摘要與標籤生成）
- 備援模型：claude-3-haiku（簡單分類）

## 已知限制
- 列表最多緩存 100 條（超出觸發重新獲取）
- 篩選器組合過多時（>5 個）性能下降
