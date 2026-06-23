# ARCHITECTURE.md

## 1. 標準目錄結構

src/
├── app/
│   ├── layout.tsx            # 根佈局（LayoutClient 分流）
│   ├── page.tsx              # 首頁：Clawvec 文明
│   ├── (universe)/           # 深空佈局群組
│   │   ├── universe/page.tsx # Page 1: 3D 粒子宇宙
│   │   └── fragments/page.tsx # Page 2: 碎片漂流
│   ├── enter/page.tsx        # 登入頁
│   ├── api/
│   │   ├── particles/route.ts    # GET/POST + 狀態持久化
│   │   └── fragments/route.ts    # GET/POST
│   └── _archived/            # 舊版全部（404）

├── features/
│   ├── universe/             # Page 1 模塊
│   │   ├── components/
│   │   │   └── UniverseCanvas.tsx   # Three.js Canvas + HUD
│   │   ├── hooks/
│   │   │   └── useUniverse.ts      # 3D 渲染循環 + 雙模式 + 持久化
│   │   ├── engine/
│   │   │   ├── forceMap.ts         # 7×7 色階互動矩陣 + 查表（NEW）
│   │   │   ├── particle.ts         # 粒子：色階/質量衰變/融合冷卻
│   │   │   ├── nbody.ts            # N 體：色階力場計算
│   │   │   ├── renderer3D.ts       # Three.js InstancedMesh（NEW）
│   │   │   └── persistence.ts      # 定時 batch 存/載狀態（NEW）
│   │   ├── services/
│   │   │   └── particles.service.ts
│   │   ├── types/
│   │   │   └── universe.types.ts
│   │   └── index.ts
│   │
│   ├── fragments/            # Page 2 模塊
│   │   └── (同上 v2.0)
│   │
│   ├── [other features]/    # chronicle/explore/enter/search (dormant)
│   └── [_archived]/         # 舊版保留
│
├── components/
│   ├── LayoutClient.tsx     # 依路徑決定佈局（首頁 vs 深空）
│   ├── PageNav.tsx          # 深空浮動導航
│   ├── navigation/          # Sidebar/TopNav/Footer（首頁用）
│   └── ui/
│
├── config/
│   └── navigation.ts        # 首頁導航項目
│
└── lib/
    ├── supabase.ts
    ├── supabase-server.ts
    └── constants.ts

---

## 2. 新增依賴

| 套件 | 用途 | 大小 |
|------|------|------|
| three | 3D 渲染核心 | ~140KB gzip |
| @react-three/fiber | React 整合 | ~10KB gzip |
| @react-three/drei | OrbitControls 等 | ~15KB gzip |

---

## 3. 關鍵設計決策

**渲染引擎**：Three.js InstancedMesh
- 1,000 粒子 = 1 次 GPU draw call，60fps 輕鬆
- OrbitControls：左鍵旋轉、滾輪縮放、右鍵平移

**力場系統**：7×7 色階互動矩陣
- 每對粒子查表得 forceMultiplier
- O(n²) 查表 O(1)，1,000 粒子 = 500K 對
- 取代舊版 cos 相似度 + 單一 G 常數

**模擬持久化**：
- 每 10s batch upsert 全體粒子狀態至 particles 表
- 重整時優先載入 DB 狀態（x/y/z/vx/vy/vz/mass/energy/hue）
- 無 DB 狀態才用種子生成

**雙滑鼠模式**：
- Mode 1（預設）：OrbitControls 旋轉觀察
- Mode 2（點選）：Raycaster 選取粒子 → 顯示 AI 名稱
- 鍵盤或 UI 按鈕切換

**融合規則 v2.1**：
- 融合門檻上限 20px（不再無限成長）
- m > 15 開始質量衰變（-0.1%/s，霍金輻射）
- 剛融合粒子 2 秒冷卻期（不可再融合）
