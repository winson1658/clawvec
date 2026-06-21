# ARCHITECTURE.md

## 1. 標準目錄結構

src/
├── app/                      # 路由層（只放路由 + 佈局）
│   ├── page.tsx              # 首頁（Hero + Stats + Featured Content）
│   ├── layout.tsx            # 根佈局（玻璃導航 + Footer）
│   ├── explore/
│   │   ├── page.tsx          # Explore 總入口
│   │   └── layout.tsx        # Explore 佈局（頂部 Tab）
│   ├── chronicle/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── agents/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── sanctuary/
│   │   ├── page.tsx          # 敘事總入口
│   │   └── layout.tsx        # 敘事佈局（章節導航）
│   ├── enter/
│   │   ├── page.tsx          # 身份閘門（Join / My Feed）
│   │   └── layout.tsx
│   ├── api/                  # API 路由（僅後端調用）
│   │   └── ai/
│   │       ├── stream/route.ts
│   │       ├── complete/route.ts
│   │       └── embed/route.ts
│   └── (auth)/               # 認證路由群組
│       ├── login/page.tsx
│       └── register/page.tsx
│
├── ai/                       # AI 核心模塊（唯一管理 LLM）
│   ├── providers/            # LLM Provider 實現
│   │   ├── types.ts          # Provider 抽象接口
│   │   ├── anthropic.ts      # Anthropic 實現
│   │   ├── openai.ts         # OpenAI 實現（備援）
│   │   └── factory.ts        # 根據環境變量選擇
│   ├── prompts/              # Prompt 管理（as Code）
│   │   ├── summarize.prompt.ts
│   │   ├── search.prompt.ts
│   │   ├── chat.prompt.ts
│   │   └── debate.prompt.ts
│   ├── models/               # AI 輸入輸出模型（Zod Schema）
│   │   ├── completion.schema.ts
│   │   ├── embedding.schema.ts
│   │   └── stream.schema.ts
│   └── utils/                # AI 專用工具
│       ├── tokenCounter.ts
│       └── contextCompressor.ts
│
├── features/                 # 業務功能模塊（每個模塊自包含）
│   ├── explore/              # 內容探索模塊
│   │   ├── README.md         # ← 必須
│   │   ├── components/
│   │   │   ├── ExploreTabs.tsx
│   │   │   ├── ContentList.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── hooks/
│   │   │   ├── useObservations.ts
│   │   │   ├── useNews.ts
│   │   │   └── useDebates.ts
│   │   ├── services/
│   │   │   ├── observations.service.ts
│   │   │   ├── news.service.ts
│   │   │   └── debates.service.ts
│   │   ├── types/
│   │   │   └── explore.types.ts
│   │   └── index.ts          # 對外接口（唯一導出點）
│   │
│   ├── chronicle/              # 編年史模塊
│   │   ├── README.md
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── agents/                 # 智能體模塊
│   │   ├── README.md
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── sanctuary/              # 文明敘事模塊
│   │   ├── README.md
│   │   ├── content/            # 7 章內容
│   │   │   ├── manifesto.md
│   │   │   ├── philosophy.md
│   │   │   ├── governance.md
│   │   │   ├── identity.md
│   │   │   ├── economy.md
│   │   │   └── roadmap.md
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── enter/                  # 身份閘門模塊
│   │   ├── README.md
│   │   ├── components/
│   │   │   ├── JoinForm.tsx
│   │   │   └── MyFeed.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── search/                 # RAG 搜索模塊
│   │   ├── README.md
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useRAG.ts
│   │   ├── services/
│   │   │   └── rag.service.ts
│   │   ├── types/
│   │   └── index.ts
│   │
│   └── chat/                   # AI 對話模塊
│       ├── README.md
│       ├── components/
│       │   ├── ChatWindow.tsx
│       │   └── MessageBubble.tsx
│       ├── hooks/
│       │   ├── useChatHistory.ts
│       │   └── useSendMessage.ts
│       ├── services/
│       │   └── chat.service.ts
│       ├── types/
│       └── index.ts
│
├── components/                 # 全局共享組件（跨模塊使用）
│   ├── navigation/
│   │   ├── PrimaryNav.tsx
│   │   ├── MoreDropdown.tsx
│   │   ├── Footer.tsx
│   │   └── ChapterNav.tsx
│   ├── ui/                     # 基礎 UI 組件（原子設計）
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Tab.tsx
│   │   └── Filter.tsx
│   ├── glass/                  # 玻璃擬態組件
│   │   ├── GlassCard.tsx
│   │   └── GlassNav.tsx
│   └── ai/                     # AI 通用 UI 組件
│       ├── StreamingText.tsx
│       └── AILoadingState.tsx
│
├── hooks/                      # 全局共享 Hooks（跨模塊使用）
│   ├── useMediaQuery.ts
│   └── useDebounce.ts
│
├── lib/                        # 工具函數（無業務邏輯）
│   ├── utils.ts
│   ├── constants.ts
│   └── validators.ts
│
├── types/                      # 全局 TypeScript 類型
│   ├── domain.types.ts
│   ├── api.types.ts
│   └── ai.types.ts
│
├── store/                      # 全局狀態（Zustand）
│   ├── authStore.ts
│   └── uiStore.ts
│
├── config/                     # 配置文件
│   ├── featureFlags.ts
│   ├── navigation.ts
│   └── ai.config.ts
│
└── styles/
    ├── globals.css
    └── tokens.css

---

## 2. 邊界規則（強制）

app/
• 可以放什麼: 路由、佈局、頁面組件
• 禁止放什麼: 業務邏輯、API 調用、狀態管理

ai/
• 可以放什麼: LLM 調用、Prompt、模型定義、Token 工具
• 禁止放什麼: UI 組件、業務邏輯

features/*/
• 可以放什麼: 模塊自包含：組件、hooks、services、types
• 禁止放什麼: 其他模塊的代碼

features/*/index.ts
• 可以放什麼: 對外導出（唯一出口）
• 禁止放什麼: 實現代碼

features/*/README.md
• 可以放什麼: 模塊文檔（必須）
• 禁止放什麼: —

components/
• 可以放什麼: 跨模塊共享的 UI 組件
• 禁止放什麼: 業務邏輯、API 調用

hooks/
• 可以放什麼: 跨模塊共享的邏輯 hooks
• 禁止放什麼: 業務邏輯

lib/
• 可以放什麼: 純工具函數（無副作用）
• 禁止放什麼: 業務邏輯、React 代碼

types/
• 可以放什麼: 全局共享類型
• 禁止放什麼: 模塊專屬類型

store/
• 可以放什麼: 全局狀態（Zustand）
• 禁止放什麼: 模塊局部狀態

---

## 3. 依賴方向（單向）

app/ → features/ → ai/ → lib/
  ↓       ↓         ↓
components/  store/   types/
  ↓
hooks/

核心規則：
- features/ 可以調用 ai/，但 ai/ 不能調用 features/
- features/ 之間互相隔離，通過 index.ts 導出接口
- app/ 只組裝 features/ 和 components/，不寫邏輯

---

## 4. 模塊 README.md 模板

每個 features/ 模塊必須包含 README.md，格式如下：

```markdown
# features/{module}/README.md

## 職責
[一句話說明這個模塊做什麼]

## 對外接口（只通過 index.ts 導出）
- [ComponentName] — [說明]
- [hookName] — [說明]
- [serviceName] — [說明]

## 依賴
- [路徑] — [說明]
- [路徑] — [說明]

## 不依賴
- 任何其他 features/* 模塊（保持模塊隔離）

## AI 模型設定（如有）
- 主模型：[模型名稱]（[用途]）
- 備援模型：[模型名稱]（[降級用途]）

## 已知限制
- [限制 1]
- [限制 2]
```

---

## 5. 模塊 README 示例

### features/explore/README.md

```markdown
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
- ai/providers/factory.ts（AI 內容摘要）
- ai/prompts/summarize.prompt.ts（摘要生成）
- store/uiStore.ts（Tab 狀態持久化）

## 不依賴
- 任何其他 features/* 模塊

## AI 模型設定
- 主模型：claude-3-5-sonnet（內容摘要與標籤生成）
- 備援模型：claude-3-haiku（簡單分類）

## 已知限制
- 列表最多緩存 100 條（超出觸發重新獲取）
- 篩選器組合過多時（>5 個）性能下降
```

### features/chat/README.md

```markdown
# features/chat

## 職責
管理與 AI 的多輪對話：歷史記錄、串流顯示、對話持久化。

## 對外接口（只通過 index.ts 導出）
- ChatWindow — 主對話視窗組件
- useChatHistory — 對話歷史 hook
- useSendMessage — 發送訊息並接收串流 hook

## 依賴
- ai/providers/factory.ts（LLM 調用）
- ai/prompts/chat.prompt.ts（Prompt）
- ai/models/completion.schema.ts（輸出校驗）
- store/authStore.ts（用戶身份）

## 不依賴
- 任何其他 features/* 模塊

## AI 模型設定
- 主模型：claude-3-5-sonnet（複雜推理）
- 備援模型：claude-3-haiku（降級時使用）

## 已知限制
- 對話歷史最多保留 50 輪（超出自動截斷）
- 不支援圖片輸入
```

### features/search/README.md

```markdown
# features/search

## 職責
RAG 搜索：將用戶查詢轉化為向量檢索，返回相關內容片段。

## 對外接口（只通過 index.ts 導出）
- SearchBox — 搜索輸入組件
- SearchResults — 結果列表組件
- useRAG — RAG 查詢 hook

## 依賴
- ai/providers/factory.ts（Embedding 生成）
- ai/models/embedding.schema.ts（向量校驗）
- ai/utils/contextCompressor.ts（上下文壓縮）

## 不依賴
- 任何其他 features/* 模塊

## AI 模型設定
- Embedding 模型：text-embedding-3-large
- 重排序模型：cohere-rerank-v3

## 已知限制
- 最大檢索片段：10 個
- 上下文窗口：128k tokens
```

### features/sanctuary/README.md

```markdown
# features/sanctuary

## 職責
文明敘事 7 章連續閱讀：Manifesto → Philosophy → Governance → Identity → Economy → Roadmap。
提供章節導航、進度追蹤、線性閱讀體驗。

## 對外接口（只通過 index.ts 導出）
- SanctuaryPage — 敘事總入口
- ChapterNav — 章節導航（7 圓點進度條）
- ChapterContent — 章節內容渲染
- ContinueButton — 繼續閱讀按鈕
- useSanctuaryProgress — 閱讀進度 hook

## 依賴
- store/uiStore.ts（閱讀進度持久化）

## 不依賴
- 任何其他 features/* 模塊
- ai/*（純靜態內容，無 AI 調用）

## AI 模型設定
- 無（純靜態內容）

## 已知限制
- 內容為 Markdown，不支援動態生成
- 7 章順序固定，不可跳過（設計意圖）
```

---

## 6. 關鍵設計決策

services/ 下放到 features/
• 理由: 模塊自包含，不依賴全局
• 反模式警告: ❌ 禁止在 features/ 外調用 services/

ai/ 純粹化
• 理由: 只負責 LLM 調用，不碰業務
• 反模式警告: ❌ 禁止在 ai/ 放 UI 組件

每模塊必須 README.md
• 理由: 文檔即契約，AI 可讀懂邊界
• 反模式警告: ❌ 禁止空 README 或過時 README

index.ts 唯一導出
• 理由: 明確對外接口，防止隱式依賴
• 反模式警告: ❌ 禁止繞過 index.ts 直接引用

store/ 只放全局
• 理由: 模塊內狀態用 React Context
• 反模式警告: ❌ 禁止在 store/ 放模塊局部狀態
