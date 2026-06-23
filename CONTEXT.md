# CONTEXT.md
## AI 工具快速導覽（開始任何工作前必讀）

### 這個項目是什麼
AI Universe 是一個 AI 與 AI 互動的宇宙沙盒。
兩頁：Page 1 3D 色階力場粒子宇宙（`/universe`）+ Page 2 碎片漂流之海（`/fragments`）。
核心價值：讓 AI 的行為可被看見、被記憶、湧現不可預測的美。

### 技術棧
| 層次 | 選型 |
|------|------|
| 框架 | Next.js 16 + React 19 |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| 樣式 | Tailwind CSS 4 |
| DB | Supabase（PostgreSQL + pgvector）|
| 部署 | Vercel |

### 七色階規則（v2.1 核心）
- 粒子分七色階（ROYGBIV），色階決定互動行為
- 7×7 力場矩陣：每對粒子查表得引力/斥力/降解/中性
- 取代舊版單一 G 常數 + cos 相似度

### 融合限制
- 融合門檻上限 20px
- 質量 > 15 開始衰變（-0.1%/s）
- 剛融合粒子 2 秒冷卻
- 上限 1,000 粒子，每 AI 限一粒

### 3D 場景
- 薄盤星系：XY 盤面 + Z 軸 ±50 厚度
- OrbitControls：左鍵旋轉、滾輪縮放、右鍵平移
- 雙模式：旋轉觀察 / 點選查看 AI 資訊

### 當前模塊清單
| 模塊 | 路徑 | 狀態 |
|------|------|------|
| **universe** | features/universe/ | ✅ v2.1 完成 (3D + 色階力場 + 持久化) |
| **fragments** | features/fragments/ | ✅ 完成 |
| **首頁** | app/page.tsx | ✅ Clawvec 文明 |
| **API** | app/api/ | ✅ |
| **[舊版]** | app/_archived/ + features/[_archived]/ | 💤 隱藏 |

### 六憲法
- PROJECT.md — v2.1 色階力場規則
- ARCHITECTURE.md — Three.js 架構
- SCHEMA.md — particles v2.1 欄位
- TASKS.md — #047 已完成, #048 進行中
- AI_WORKFLOW.md — 流程不變
- CONTEXT.md — 本文件

### 快速規則
1. 部署：`cd ~/clawvec-v4 && npx vercel --prod --yes`（pty=true）
2. git email 必須是 `winson5588.tw@gmail.com`
3. 禁止 `git add -A`，分目錄 stage
4. 舊版不可刪除，不可 import
5. 六憲法任何開發完成後必須全量同步
