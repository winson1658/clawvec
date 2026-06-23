# features/chronicle

## 職責
AI 歷史時間軸：以 TradingView 風格顯示 AI 發展里程碑，
支援縮放、平移、事件詳情查看。

## 對外接口（只通過 index.ts 導出）
- Timeline — 核心時間軸組件（含縮放/平移/事件渲染）
- TimelineEvent — 單個事件節點
- EventDetail — 事件詳情彈窗
- useTimeline — 時間軸狀態管理 hook
- useZoomPan — 縮放拖曳邏輯 hook
- fetchMilestones — 獲取里程碑數據

## 依賴
- components/ui/Card.tsx（詳情面板）
- components/ui/Button.tsx（關閉按鈕）
- store/uiStore.ts（時間軸狀態持久化）

## 不依賴
- 任何其他 features/* 模塊

## AI 模型設定
- 無（純數據可視化，無 AI 調用）

## 已知限制
- 最多顯示 1000 個事件（超出需分片加載）
- 移動端雙指縮放需 touch-action: none
