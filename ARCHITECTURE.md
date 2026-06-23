# ARCHITECTURE.md

## 1. 標準目錄結構

src/
├── app/                      # 路由層（只放路由 + 佈局）
│   ├── page.tsx              # Page 1: Universe（重力場粒子宇宙）
│   ├── layout.tsx            # 根佈局（極簡：PageNav only）
│   ├── fragments/
│   │   └── page.tsx          # Page 2: Fragment Drift（碎片漂流之海）
│   └── api/                  # API 路由
│       ├── particles/
│       │   └── route.ts      # GET (list) / POST (create) particles
│       └── fragments/
│           └── route.ts      # GET (random) / POST (submit → particle)
│
├── features/                 # 業務功能模塊
│   ├── universe/             # Page 1 模塊
│   │   ├── README.md
│   │   ├── components/
│   │   │   └── UniverseCanvas.tsx    # Canvas 2D 渲染 + HUD 內嵌
│   │   ├── hooks/
│   │   │   └── useUniverse.ts       # 粒子管理 + 物理循環 + 投放互動
│   │   ├── engine/
│   │   │   ├── particle.ts          # Particle 類別
│   │   │   ├── nbody.ts             # N 體計算 + Barnes-Hut 四叉樹 + 融合
│   │   │   └── renderer.ts          # Canvas 2D 渲染器
│   │   ├── services/
│   │   │   └── particles.service.ts # 客戶端 API 封裝
│   │   ├── types/
│   │   │   └── universe.types.ts
│   │   └── index.ts
│   │
│   ├── fragments/             # Page 2 模塊
│   │   ├── README.md
│   │   ├── components/
│   │   │   ├── DriftCanvas.tsx       # Canvas 碎片漂流 + 模態卡片
│   │   │   └── SubmitFragment.tsx    # 五選一提交表單
│   │   ├── hooks/
│   │   │   └── useFragments.ts       # 碎片池 + 漂移動畫 + 選取
│   │   ├── engine/
│   │   │   ├── drift.ts             # 漂移物理 + 連線檢測
│   │   │   └── renderer.ts          # 碎片渲染器
│   │   ├── services/
│   │   │   └── fragments.service.ts # 客戶端 API 封裝
│   │   ├── types/
│   │   │   └── fragments.types.ts
│   │   └── index.ts
│   │
│   └── [_archived]/           # 舊版模塊（隱藏，非刪除）
│       ├── (features)/        # explore/chronicle/agents/...
│       ├── agent-legacy/
│       └── api/               # agent/ai/debug 舊 API
│
├── components/                # 全局共享組件
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   └── PageNav.tsx           # Universe / Fragments 雙頁切換
│
├── lib/
│   ├── supabase.ts           # 客戶端 Supabase（anon key）
│   ├── supabase-server.ts    # 伺服端 Supabase（service_role key）
│   ├── utils.ts
│   └── constants.ts
│
└── styles/
    └── globals.css

---

## 2. 邊界規則（強制）

app/
• 可以放什麼: 路由、佈局、頁面組件
• 禁止放什麼: 業務邏輯、API 調用、狀態管理

features/universe/
• 可以放什麼: Canvas 2D 渲染、物理引擎、粒子互動
• 禁止放什麼: 碎片邏輯

features/fragments/
• 可以放什麼: 碎片漂流、提交表單、卡片展開
• 禁止放什麼: 粒子物理

features/[_archived]/
• 舊版模塊全部隱藏（app/ 層不掛載路由）
• 代碼保留在 features/[archived]/ 和 app/_archived/ 下
• 不可刪除（保留歷史參考）

---

## 3. 依賴方向（單向）

app/ → features/ → api/
  ↓       
components/

- universe/ 和 fragments/ 互相隔離
- API 層處理兩頁橋接（fragments POST → particles INSERT）

---

## 4. 關鍵設計決策

**渲染引擎**：Canvas 2D（非 WebGL）
- 選擇原因：避免額外依賴（PixiJS/Three.js）、HiDPI 渲染足夠
- 物理計算內嵌於主線程（粒子數 < 500，無需 Web Worker）

**兩頁橋接**：
- fragments/ 提交碎片時 → POST /api/fragments → 自動創建 particles 記錄
- universe/ 讀取 /api/particles → 渲染粒子
- 橋接邏輯在 API 層，不在 features/ 中

**Demo 數據 fallback**：
- 若 DB 無數據，兩頁自動載入 demo 粒子/碎片
- 確保首次訪問即有視覺效果

**舊版模塊處理**：
- 路由全部移至 app/_archived/（404）
- features/[_archived]/ 保留原始碼
- .vercelignore 排除 `_archived` 目錄避免構建膨脹
