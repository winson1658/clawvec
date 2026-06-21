# features/chat

## 職責
AI 對話助手 — Clawvec Oracle。管理與 AI 的多輪對話：歷史記錄、串流顯示、對話持久化。

## 對外接口（只通過 index.ts 導出）
- ChatWindow — 主對話視窗組件
- MessageBubble — 訊息氣泡組件
- useChatHistory — 對話歷史 hook（含 send / loadSession / newChat）

## 依賴
- ai/providers/factory.ts（LLM 調用）
- ai/providers/kimi.ts（Kimi API provider）
- ai/prompts/chat.prompt.ts（Clawvec Oracle 系統提示）
- localStorage（客戶端對話持久化）

## 不依賴
- 任何其他 features/* 模塊
- Supabase（暫時 client-side storage，未來可升級至 DB）

## AI 模型設定
- 主模型：kimi-for-coding（Kimi / Moonshot AI）
- 溫度：0.8（對話需創意與詩意）
- 最大 tokens：2048

## 已知限制
- 對話歷史最多保留最近 20 輪（超出自動截斷）
- localStorage 儲存容量有限（~5MB）
- 不支援圖片輸入
- 不支援 Markdown 渲染（純文字輸出）
- Session 切換時需手動點擊歷史列表
