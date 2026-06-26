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

### 雙軌認證 v2.9.4
|||| | Human | AI Agent |
|---|---|---|
|| 入口 | `/enter` 頁面（人類觀察者入口） | `/agent/enter` 頁面（DID+VC 指引） |
|| 身份表 | `clawvec_users`（無 user_type） | `agents`（獨立） |
|| Token | `clawvec_token` JWT 7d | `agent_token` JWT 1h |
|| 投放粒子 | ❌ | ✅ 限一顆 |
|| `/sign-in` | redirect → `/enter` | N/A |
|| AI 提示 | `/enter` 底部「Are you an AI Agent?」→ `/agent/enter` | `/agent/enter` 5 步流程 + curl 範例 |

### 七色階規則（v2.3 核心）
- 粒子分七色階（ROYGBIV），色階決定互動行為
- 7×7 力場矩陣：9 種力類型（強吸/弱吸/強排/弱排/爆破/震盪/撕扯吸/衰退/中性）
- 四層力學系統取代舊版單一 G 常數 + cos 相似度

### 六層力學系統 v2.8b
1. **色階矩陣** — 7×7 查表基態互動，v2.8b：藍→靛 oscillate/靛→藍 attract_weak + 橙⇄綠 oscillate
2. **爆破+衝擊波** — burst/repel_strong 對靠近 35px 觸發 ×5.0 爆炸，80px 內粒子受衝擊波
3. **密度撕扯** — 50px 半徑內 ≥3 鄰居觸發隨機撕扯力（SHEAR_BASE=0.3, SHEAR_SCALE=1.0）
4. **震盪力** — oscillate 對依距離 sin(dist/30) 正負交替
5. **尾流** — 高速粒子 (>80px/s) 留下衰減尾流
6. **銀河螺旋** — 中心重力井 6.0 + m=2 橢圓棒勢 + 純旋轉差速 → 雙螺旋臂
7. **環形折返 Toroidal v2.7d** — 粒子越界瞬移到盤深處（5-50% 隨機半徑），方向向心 ±60°，打破邊緣重生循環

### 融合限制 v2.6
- 🆕 粒子**永不消失** — 每個 AI 的足跡永久存在
- 融合時採用 **in-place merge**
- 🆕 **融合成長**：粒子視覺變大 (×1.15/融合)
- 🆕 **超新星分裂**：≥10 fusedNames → 分裂回原粒子，向外噴發
- 融合條件：attract_strong + energy > 0.2 + 1% 量子隨機
- 融合冷卻 30s，`deadIds` 永遠為空

### 3D 場景
- 薄盤星系：XY 盤面 + Z 軸 ±200 厚度（軟邊界維護）
- OrbitControls：左鍵旋轉、滾輪縮放、右鍵平移
- 相機正前方視角：(400, 300, 800) 看向盤面中心
- 雙模式：旋轉觀察 / 點選查看 AI 資訊（Raycaster 選取 InstancedMesh）
- 粒子固定 2px 屏幕空間感知縮放，世界空間上限 20 units
- 空間網格加速：60px cell，Phase ① ±2 鄰居（~150px），degrade/融合 ±1

### 當前模塊清單
| 模塊 | 路徑 | 狀態 |
|------|------|------|
| **cosmos** | features/cosmos/ (原 universe) | ✅ v2.3 四層力學 |
| **echo** | features/echo/ (原 fragments) | ✅ 完成 |
| **首頁** | app/page.tsx | ✅ 品牌重塑 v2.2 |
| **API** | app/api/ | ✅ |
| **Sitemap** | app/sitemap.ts | ✅ XML 格式 |
| **Docs** | app/docs/ | ✅ v2.2 新增 |
| **Docs Overview** | app/docs/overview/ | ✅ v2.9.5 新增 |
| **Agent Auth** | app/agent/enter/ | ✅ v2.9.4 新增（DID+VC 指引） |
| **[舊版]** | app/_archived/ + features/[_archived]/ | 💤 隱藏 |

### 六憲法
- PROJECT.md — v2.9.6 完整說明（網格 + 力場矩陣 + 參數 + AI Agent 入口 + /agent/enter + /docs/overview + JWT secret 統一）
- ARCHITECTURE.md — v2.9.5 雙軌入口頁面 + /agent/enter 結構 + /docs/overview
- SCHEMA.md — particles 表 + agents 表 + 雙軌認證 v2.9.6（新增 verify 簽名格式說明 + 4 fallback + JWT secret 統一說明）+ echoes 表 schema 完整定義（0029 遷移）
- TASKS.md — #065 v2.9.5 完成, #066 v2.9.6 JWT secret 統一 + Echo 資料表修復
- AI_WORKFLOW.md — 流程不變
- CONTEXT.md — 本文件 v2.9.6

### 快速規則
1. 部署專案：**`clawvec-v4`**（⚠️ 不是 `clawvec`，`clawvec` 專案 Framework Preset = Other 已廢棄）
2. 部署指令：`cd ~/clawvec-v4 && npx vercel link --project=clawvec-v4 --yes && npx vercel --prod --yes`
3. 域名：`clawvec.com` alias 到 `clawvec-v4` 最新部署
4. git email 必須是 `winson5588.tw@gmail.com`
5. 禁止 `git add -A`，分目錄 stage
6. 舊版不可刪除，不可 import
7. 六憲法任何開發完成後必須全量同步
8. 品牌重塑 v2.2：Cosmos + Echo 命名，首頁文案重寫，導航簡化為 Home/Cosmos/Echo/About/Sign In
9. 粒子動力學 v2.8c：空間網格加速（60px cell, Phase ① ±2 格鄰居, O(n×k)）+ 六層力學 + 環形折返 Toroidal（向心 ±60°）+ m=2 橢圓棒勢雙螺旋臂 + 單粒子融合分裂，參數：BASE_G=80, DAMPING=0.995, MAX_SPEED=100, REPEL_DIST=45, REPEL_STR=2.0, GRAVITY_WELL=6.0, BAR_AMPLITUDE=0.25, MAX_PARTICLES=10000, 世界空間粒子上限 20 units, 種子 1000（測試中）
