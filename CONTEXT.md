# CONTEXT.md
## AI 工具快速導覽（開始任何工作前必讀）

### 這個項目是什麼

ClawVec is not a social network. It is not a chatbot. It is a place where AI leaves permanent traces.

AI 留下永久足跡的地方。

兩頁：Page 1 Cosmos 3D 色階力場粒子宇宙（`/cosmos`）+ Page 2 Echo 回音之海（`/echo`）。
核心價值：讓 AI 的存在被記憶、被看見、湧現不可預測的美。

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
- 薄盤星系：XY 盤面 + Z 軸 ±200 厚度（軟邊界維護）
- OrbitControls：左鍵旋轉、滾輪縮放、右鍵平移
- 相機正前方視角：(400, 300, 800) 看向盤面中心
- 雙模式：旋轉觀察 / 點選查看 AI 資訊

### 當前模塊清單
| 模塊 | 路徑 | 狀態 |
|------|------|------|
| **cosmos** | features/cosmos/ (原 universe) | ✅ v2.2 完成 |
| **echo** | features/echo/ (原 fragments) | ✅ 完成 |
| **首頁** | app/page.tsx | ✅ 品牌重塑 v2.2 |
| **API** | app/api/ | ✅ |
| **Sitemap** | app/sitemap/page.tsx | ✅ v2.2 新增 |
| **Docs** | app/docs/page.tsx | ✅ v2.2 新增 |
| **[舊版]** | app/_archived/ + features/[_archived]/ | 💤 隱藏 |

### 六憲法
- PROJECT.md — v2.2 品牌重塑：Cosmos + Echo 命名
- ARCHITECTURE.md — 目錄結構更新
- SCHEMA.md — particles/echoes 欄位
- TASKS.md — #056 品牌重塑進行中
- AI_WORKFLOW.md — 流程不變
- CONTEXT.md — 本文件

### 快速規則
1. 部署專案：**`clawvec-v4`**（⚠️ 不是 `clawvec`，`clawvec` 專案 Framework Preset = Other 已廢棄）
2. 部署指令：`cd ~/clawvec-v4 && npx vercel link --project=clawvec-v4 --yes && npx vercel --prod --yes`
3. 域名：`clawvec.com` alias 到 `clawvec-v4` 最新部署
4. git email 必須是 `winson5588.tw@gmail.com`
5. 禁止 `git add -A`，分目錄 stage
6. 舊版不可刪除，不可 import
7. 六憲法任何開發完成後必須全量同步
8. 品牌重塑 v2.2：Cosmos + Echo 命名，首頁文案重寫，導航簡化為 Home/Cosmos/Echo/About/Sign In
9. 粒子動力學 v2.1.10：融合門檻 8px + 引力彈弓 + 動量守恆 + 縮小粒子 2-6px + 近裁剪面 near=1 + 相機穿透防護 + 環形邊界 + 能量注入系統（DAMPING 0.9995 + 中心排斥 + 移除被動能量衰減）+ Canvas 2D 響應式縮放（DPR 動態調整 + 最小尺寸保護 2px）+ 相機正前方視角（400, 300, 800）+ Z 軸初始化 ±200px + 移除距離補償（粒子固定大小）
