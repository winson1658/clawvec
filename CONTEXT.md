# CONTEXT.md
## AI 工具快速導覽（開始任何工作前必讀）

### 這個項目是什麼
Clawvec 是一個 AI 與人類共用的文明記錄基礎設施。
核心用戶：發表 AI 觀察的創作者、參與哲學辯論的思考者、追蹤 AI 歷史的紀錄者
核心價值：讓智能行為可被理解、被記憶、被信任

### 技術棧（禁止自行更改）
| 層次 | 選型 | 注意事項 |
|------|------|---------|
| 框架 | Next.js 15 + React 19 | 使用 Server Components |
| 樣式 | Tailwind CSS 4 + tokens.css | 禁止硬編碼顏色，使用 CSS 變數 |
| 設計系統 | Glassmorphism v4 | 溫暖羊皮紙 #f5f4ed + 玻璃質感 + 環境光暈 |
| 狀態 | Zustand + TanStack Query v5 | 服務端數據只用 TanStack Query |
| AI | Anthropic Claude + OpenAI 備援 | 通過 ai/providers/factory.ts |
| DB | Supabase（PostgreSQL + pgvector）| Schema 在 supabase/migrations/ |
| 部署 | Vercel | Edge Runtime 用於 AI 路由 |

### 設計系統快速參考
| 元素 | 規範 | 說明 |
|------|------|------|
| **底色** | `#f5f4ed` | 溫暖羊皮紙，禁止純白 |
| **主色** | `#FF5A3C` | 珊瑚紅，CTA / 連結 / 強調 |
| **文字主色** | `#141413` | 溫暖黑，對比度 12:1 |
| **文字次要** | `#5e5d59` | 次要文字，對比度 7:1 |
| **玻璃層** | `white/30` + `blur(12px)` | 標準卡片、面板 |
| **玻璃強層** | `white/50` + `blur(16px)` | 導航、Modal |
| **環境光暈** | `rgba(255,90,60,0.08)` | 1-2 個，透明度 5-8% |
| **圓角** | 12px（按鈕）/ 16px（卡片） | 統一圓角系統 |
| **動效** | 150ms / 200ms / 300ms | fast / normal / slow |

**CSS 工具類：** `.glass` / `.glass-strong` / `.glass-subtle` / `.btn-glass` / `.input-glass` / `.card-glass` / `.ambient-orb`

**設計規則：**
- ✅ 新 UI 組件必須使用 Glassmorphism v4
- ✅ 玻璃層上文字對比度 ≥ 4.5:1
- ✅ 背景保持 #f5f4ed 讓玻璃效果顯現
- ❌ 禁止純白背景（#ffffff）
- ❌ 禁止純黑文字（#000000）
- ❌ 禁止玻璃層超過 3 層

### 最常需要修改的文件
- **新功能** → `src/features/[name]/`（先創建文件夾和 README.md）
- **API 調用** → `src/features/[name]/services/[name].service.ts`
- **AI 功能** → `src/ai/prompts/` 或 `src/ai/providers/`
- **數據類型** → `src/types/domain.types.ts` 或 `src/types/ai.types.ts`
- **全局狀態** → `src/store/[name]Store.ts`
- **路由** → `src/app/[path]/page.tsx`（只放組件組裝）

### 當前模塊清單
| 模塊 | 路徑 | 狀態 | 備注 |
|------|------|------|------|
|| **首頁** | app/page.tsx | ✅ 已完成 | Hero + Stats + Featured（V3 設計融入）|
|| explore | features/explore | ✅ 已完成 | Tab + Filter + ContentList |
|| chronicle | features/chronicle | ✅ 已完成 | TradingView 風格時間軸 |
|| agents | features/agents | 🚧 已初始化 | 模塊結構已建立（types + README + index.ts），頁面已改寫 |
|| sanctuary | features/sanctuary | ✅ 已完成 | 文明敘事 7 章（sanctuary + manifesto + philosophy + governance + economy + for-agents）|
|| enter | features/enter | 🚧 已初始化 | 模塊結構已建立（types + hooks + services + index），頁面改寫為「This is not a login. This is an entry.」|
|| search | features/search | 🚧 已初始化 | 模塊結構已建立（types + services + index），頁面改寫 |
||| **chat** | features/chat | ✅ 已完成 | Chat 頁面 + AI 串流（DeepSeek primary），Oracle 文明宣言語氣 |
||| **dilemma** | features/dilemma | 🚧 已初始化 | 模塊結構已建立（types + hooks + services + components + README + index），頁面已改寫，含人類 vs AI 投票對比 |
||| **quiz** | features/quiz | 🚧 已初始化 | 模塊結構已建立（types + hooks + services + README + index），頁面已改寫，7 題哲學原型測試（Guardian/Architect/Oracle/Synapse）|
||| **news** | features/news | 🚧 已初始化 | 模塊結構已建立（types + hooks + services + README + index），頁面已改寫，AI 新聞策展（published/submitted/draft 篩選）|
||| **admin** | features/admin | 🚧 已初始化 | 模塊結構已建立（types + hooks + services + README + index），後台登入 + Dashboard（Overview/Audit Log/IP Whitelist），獨立於前台 auth |
||| **agents** | features/agents | 🚧 已填充 | 6 個 mock 代理（Aether/Fortress/Scaffold/Bridge/Vigil/Prism），代理目錄 + 搜索 + 原型篩選，詳情頁（記憶圖譜 + 導師關係）|

### AI 功能現況
| 功能 | Flag 名稱 | 狀態 | 使用模型 |
|------|-----------|------|---------|
| 對話助手 | FF_CHAT_ENABLED | ✅ 已完成 | deepseek-chat |
| 文章摘要 | FF_SUMMARIZE_ENABLED | 開發中 | deepseek-chat |
| 智能搜索 | FF_SEARCH_ENABLED | 關閉中 | - |

### 快速規則（必須遵守）
1. 組件中不能直接 `fetch()` 或 `axios` → 用 `features/*/services/` 層
2. 不能直接 `import Anthropic` → 用 `ai/providers/factory.ts`
3. 不能在業務代碼中寫 Prompt 字符串 → 用 `ai/prompts/`
4. 不能修改任務單以外的文件
5. 新功能前先查 TASKS.md 確認有對應任務
6. 多 Agent 協作流程見 `AI_WORKFLOW.md` — 嚴格遵循 Specification → Claude → Tester → Codex → Deploy 流程

### 當前已知技術債
- features/enter 的 Token 刷新機制需要重構
- chatStore 在大量歷史時性能下降，需要虛擬化
- ai/providers/anthropic.ts 的重試邏輯需要抽象

### 禁止觸碰的文件（需要特別授權）
- supabase/migrations/*.sql（改動需要數據庫遷移）
- ai/providers/types.ts（改動影響所有 Provider）
- types/ai.types.ts（改動影響所有 AI 功能）
- tailwind.config.ts（改動影響全局樣式）
