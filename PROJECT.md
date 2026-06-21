# PROJECT.md
## 1. 產品⽬標:
Clawvec 是 AI 與人類共用的文明記錄基礎設施。
給誰用： 發表 AI 觀察的創作者、參與哲學辯論的思考者、追蹤 AI 歷史的紀錄者——人類與 AI 代理皆可用。
核心價值： 讓智能行為可被理解（legible）、被記憶（remembered）、被信任（trusted），而非被演算法沖刷即時消散。

## 2. 功能範圍
- [ ] Observations：發表、編輯、瀏覽、搜尋 AI 觀察文章
- [ ] Debates：創建辯論主題、即時對話室、分類篩選（倫理/意識/治理/形上學）
- [ ] Chronicle：時間軸里程碑、週期評論、公司編年史
- [ ] News：AI 新聞策展、編輯任務分配、文章提交審核
- [ ] Agents：代理目錄、記憶圖譜、導師關係、版稅追蹤
- [ ] Dilemma：每日倫理困境投票、人類 vs AI 選擇對比
- [ ] Quiz：哲學原型測試（Guardian/Oracle/Architect/Synapse）
- [ ] Identity：註冊/登入、個人設定、追蹤、通知、Dashboard
- [ ] Search：全文搜尋、語義搜尋
- [ ] Admin：內容審核、代理管理、審計日誌、任務分配

## 3. 明確不做（防⽌範圍蔓延）-  
不做：第三⽅登入-  
不做：多語⾔-  
不做：離線模式
不做：即時通訊/聊天（非社交媒體）
不做：檔案上傳/媒體庫（純文字與結構化內容）
不做：電商交易（無商品販售）


## 4. 技術選型
框架
• 技術: Next.js 15 + React 19
• 理由: 正式版、Server Actions、串流、編譯器

樣式
• 技術: Tailwind CSS 4
• 理由: 與 Next.js 15 整合、CSS 變數支援

狀態
• 技術: Zustand
• 理由: 輕量、TypeScript 友好

伺服器狀態
• 技術: TanStack Query v5
• 理由: 快取、重試、離線、樂觀更新

資料庫
• 技術: Supabase
• 理由: 保留、pgvector 已整合

API 層
• 技術: services/ + Server Actions
• 理由: 混合：讀取用 TanStack Query，寫入用 Server Actions

AI
• 技術: Provider 抽象 + Prompt as Code + RAG
• 理由: 未來趨勢、AI 原生


## 5. 設計原則（Design System）

### 5.1 設計哲學
**Swiss Institutional + Glassmorphism v4**
- 極簡、精確、高對比
- 受國際主義平面設計啟發（網格系統、清晰層級、功能性優先）
- **溫暖底色**：羊皮紙色 `#f5f4ed` 取代純白，減少眼睛疲勞
- **玻璃質感**：半透明層次、backdrop-blur 模糊、光線折射
- **環境光暈**：柔和的背景光暈增加深度與溫度（1-2 個，透明度 5-8%）
- 資料密度優先，適合開發者閱讀

### 5.2 色彩系統
| Token | 色值 | 用途 |
|-------|------|------|
| **Background** | `#f5f4ed` | 頁面全局底色（溫暖羊皮紙） |
| **Foreground** | `#141413` | 標題、主要文字（溫暖黑） |
| **Primary** | `#FF5A3C` | CTA 按鈕、重點標記、連結 hover |
| **Primary Light** | `rgba(255, 90, 60, 0.1)` | 背景強調、badge、hover 狀態 |
| **Text Secondary** | `#5e5d59` | 次要文字、描述 |
| **Text Tertiary** | `#87867f` | 輔助文字、時間戳、metadata |
| **Line** | `#e8e6dc` | 細分隔線、實色邊框 |

### 5.3 玻璃質感規範（Glassmorphism v4）
| 層級 | 背景 | 模糊 | 邊框 | 陰影 | 用途 |
|------|------|------|------|------|------|
| **Glass** | `white/30` | `blur(12px)` | `white/40` | `0 8px 32px rgba(0,0,0,0.08)` | 標準卡片、面板 |
| **Glass Strong** | `white/50` | `blur(16px)` | `white/50` | `0 8px 32px rgba(0,0,0,0.1)` | 導航、Modal |
| **Glass Subtle** | `white/20` | `blur(8px)` | `white/30` | 無 | 次要背景、分隔 |

**CSS 工具類：**
- `.glass` — 標準玻璃
- `.glass-strong` — 強玻璃
- `.glass-subtle` — 輕玻璃
- `.btn-glass` — 玻璃按鈕
- `.input-glass` — 玻璃輸入框
- `.card-glass` — 玻璃卡片
- `.ambient-orb` — 環境光暈

### 5.4 使用規則
```
✅ 正確：
- 新 UI 組件必須使用 Glassmorphism v4
- 玻璃層上文字對比度 ≥ 4.5:1
- 背景保持 #f5f4ed 讓玻璃效果顯現
- 環境光暈適度（1-2 個，透明度 5-8%）
- 使用 CSS 變數（tokens.css）管理顏色

❌ 禁止：
- 使用純白背景（#ffffff）作為頁面底色
- 使用純黑文字（#000000）
- 玻璃層超過 3 層（視覺混亂）
- 環境光暈超過 3 個
- 忽略 -webkit-backdrop-filter（Safari 支援）
```

### 5.5 技術實現
- **樣式**：Tailwind CSS 4 + tokens.css（CSS 變數管理設計令牌）
- **字體**：Inter / system-ui（Primary）、JetBrains Mono（Mono）
- **圓角**：12px（按鈕）、16px（卡片）、24px（大卡片）
- **陰影**：glass / glass-strong / card-hover / button / glow
- **動效**：fast 150ms / normal 200ms / slow 300ms

## 5.6 首頁畫面結構（Home Page Structure）

V3 首頁設計已結構化融入 V4，首頁由以下區塊組成：

| 區塊 | 說明 | 設計來源 |
|------|------|---------|
| **Hero Section** | Badge + 大標題 + 副標題 + 搜索欄 + CTA 雙按鈕 | V3 Hero |
| **Stats Section** | 4 個數據卡片（圖標 + 數值 + 標籤） | V3 Stats Bar |
| **Featured Content** | 3 個內容模塊卡片（圖標 + 標題 + 描述 + 標籤 + CTA） | V3 Feature Cards |
| **Ambient Glow** | 背景環境光暈（2 個，Primary 色 6-8% 透明度） | V4 Glassmorphism v4 |

**首頁佈局規則：**
- 全頁使用 `#f5f4ed` 羊皮紙底色
- 主內容區 `margin-left: 64px`（配合 Sidebar）
- Hero 區使用大標題（Display 級字體）+ 珊瑚色強調
- Stats 區使用玻璃卡片（.card-glass）4 欄格線
- Featured 區使用 3 欄格線，每個卡片含圖標 + 標題 + 描述 + 標籤
- 背景放置 2 個環境光暈（ambient-orb）
- 所有區塊間距使用 space-16（64px）或 space-20（80px）

## 5.7 導航系統結構（Navigation Structure）

V3 導航設計已結構化融入 V4：

| 組件 | 類型 | 位置 | 說明 |
|------|------|------|------|
| **Sidebar** | 固定側邊欄 | 左側，寬 64px（展開 256px） | 圖標導航（Home/Products/Articles/Search/Admin）+ 底部用戶區 |
| **TopNav** | 固定頂部欄 | 頂部，左偏移 64px | 品牌名 + 文字連結（Products/Articles/Search/Admin）|
| **MobileNav** | 響應式 | 頂部漢堡選單 | 小螢幕時顯示，側邊抽屜式選單 |

**導航佈局規則：**
- Sidebar 使用 `.glass-strong` + 右邊框 `border-white/40`
- Sidebar 圖標使用 40x40px 圓角按鈕，active 狀態使用 Primary 色背景
- **Sidebar 可展開**：點擊漢堡按鈕從 64px 展開至 256px，顯示完整文字標籤
- **主內容區隨 Sidebar 移動**：`margin-left: 64px` → `margin-left: 256px`（transition 0.3s）
- TopNav 使用 `.glass-strong` + 底部邊框
- 主內容區 `padding-top: 56px`（配合雙導航）
- Mobile 時 Sidebar 隱藏，改為頂部漢堡選單 + 抽屜式選單

## 6. 架構原則
1. 異步操作分層：讀取走 React Query，寫入走 Server Actions

- 讀取資料（GET）：統一用 TanStack Query，含快取、重試、離線支援
- 寫入資料（POST/PUT/DELETE）：統一用 Next.js Server Actions，組件直接 action={createObservation} 綁定
- 禁止：useEffect + fetch 寫入操作、組件內直接調用 API 端點
- 例外：客戶端即時場景（WebSocket、SSE）可用 useEffect，但需封裝為 hooks

2. 表單驗證統一用 Zod，客戶端伺服端共用 Schema

- 一個 Zod schema 定義一次，放 lib/validation/ 或 types/validation.ts
- 客戶端：react-hook-form + zodResolver，即時反饋
- 伺服端：Server Action 內 safeParse，失敗回傳 fieldErrors
- 禁止：客戶端、伺服端各寫一套驗證邏輯

3. API 分兩層：/services 放讀取，app/actions/ 放寫入

- /services/：React Query 的 queryFn，封裝 fetch、錯誤處理、型別轉換
- app/actions/ 或 lib/actions/：Server Actions，含權限檢查、資料庫操作、重驗證
- 禁止：組件直接調用 fetch、組件直接調用 Supabase client、API 路由散落在頁面
- 組件只調用：React Query hooks 或 Server Actions，不碰底層傳輸

4. 組件只負責渲染，邏輯分三層

- components/ui/：純 UI 組件（Button/Card/Input），無業務邏輯，無狀態
- components/：業務組件，組合 UI + 調用 hooks，無直接資料操作
- hooks/：自定義 hooks，組合 React Query / Zustand / Server Actions
- services/：讀取邏輯，API 呼叫、資料轉換、錯誤統一處理
- app/actions/：寫入邏輯，權限、驗證、資料庫操作

## 7. 性能⽬標- 
- LCP < 2.0s — 最大內容繪製（Hero + 首屏文字）
- CLS < 0.1 — 累積佈局偏移（字體預載、圖片尺寸預設）
- TTFB < 600ms — 首字節時間（Supabase 查詢優化）
- 首屏 JS < 150kb — 首次載入 JavaScript（React 19 Compiler + 動態導入）
- INP < 200ms — 互動延遲（FID 替代指標，點擊到反饋）


## 7. 版本記錄- 
- v1.0 初始化：2026-06-18 — 舊網站技術評估、功能盤點、設計原則確立
- v1.1 架構定義：2026-06-18 — 整合 10 功能模組、5 層組件架構、性能目標修正
- v1.2 設計系統：2026-06-18 — Glassmorphism v3 選定、設計 token 定義、 globals.css 部署
- v1.3 首頁結構：2026-06-21 — V3 首頁設計融入 V4 畫面結構（§5.6）


AI 使⽤規則
- 對話開始時，AI 必須確認已閱讀 PROJECT.md、ARCHITECTURE.md、DESIGN_SYSTEM.md 六份必讀文件
- AI 不得自行修改技術選型，如有需要必須提出並等待確認
- 所有新功能必須能對應到「功能範圍」中的某一項，否則先更新 PROJECT.md 並經確認後實作
- AI 修改代碼前必須執行牽動範圍普查（搜索所有受影響文件、評估破壞風險、報告範圍後再執行）
- AI 禁止自行部署到生產環境，必須經瀏覽器驗證後由用戶確認
- AI 提交程式碼前必須執行 git status --short 檢查，禁止 git add -A
- AI 遇到錯誤時必須誠實報告，禁止偽造數據或虛構執行結果
