# TASKS.md

## 進行中
| #ID | 功能 | 開始時間 | 備注 |
|-----|------|---------|------|
| #047 | v2.1 粒子規則重構 — 3D + 色階力場 + 持久化 | 2026-06-23 | 六憲法更新完成，準備開工 |

## 待辦
| #ID | 功能 | 依賴 | 優先級 |
|-----|------|------|--------|
| #048 | 簡易 AI token 驗證 + 每 AI 限一粒子 | #047 | 中 |

## 已完成
| #ID | 功能 | 完成時間 | 關聯文件 |
|-----|------|---------|---------|
| #001-#035 | 舊版 Clawvec v1.0 所有任務 | 2026-06-22 | 全部已隱藏至 features/[_archived]/ |
| #036 | 六憲法 v2.0 重構 | 2026-06-23 | PROJECT/ARCHITECTURE/SCHEMA/TASKS/AI_WORKFLOW/CONTEXT |
| #037 | 隱藏所有舊版分頁 | 2026-06-23 | src/app/_archived/ |
| #038 | PageNav 雙頁切換 + 首頁恢復 | 2026-06-23 | src/components/PageNav.tsx, LayoutClient.tsx |
| #039 | particles + fragments 資料表 | 2026-06-23 | supabase/migrations/0021-0023 |
| #040 | Page 1 Canvas 2D 粒子渲染 | 2026-06-23 | features/universe/engine/renderer.ts |
| #041 | N 體物理引擎 | 2026-06-23 | features/universe/engine/nbody.ts, particle.ts |
| #042 | 拖曳投放控制 | 2026-06-23 | features/universe/hooks/useUniverse.ts |
| #043 | Page 2 Canvas 碎片漂流 | 2026-06-23 | features/fragments/engine/drift.ts, renderer.ts |
| #044 | 五選一提交表單 | 2026-06-23 | features/fragments/components/SubmitFragment.tsx |
| #045 | 相似碎片連線 | 2026-06-23 | features/fragments/engine/drift.ts (findConnections) |
| #046 | API + DB 橋接 + 首次部署 | 2026-06-23 | app/api/fragments, particles, vercel deploy |

---

## 任務單 #047: v2.1 粒子規則重構

**功能名稱**：3D 粒子宇宙 + 七色階力場 + 持久化狀態

**任務描述**：
將 Page 1 Universe 從 Canvas 2D 升級為 Three.js 3D 薄盤星系視角。
以七色階互動矩陣取代單一重力常數。加入模擬狀態持久化（重整不重跑）。
上限 1,000 粒子，雙滑鼠模式（OrbitControls / 點選資訊）。

**影響文件清單**：
- 新建：
  - `features/universe/engine/forceMap.ts` — 7×7 色階互動矩陣 + 查表
  - `features/universe/engine/renderer3D.ts` — Three.js InstancedMesh 渲染
  - `features/universe/engine/persistence.ts` — 定時存/載模擬狀態
- 修改：
  - `features/universe/engine/nbody.ts` — 色階力場取代 G 常數
  - `features/universe/engine/particle.ts` — 質量衰變 + 融合冷卻 + 融合上限
  - `features/universe/hooks/useUniverse.ts` — 接入 3D + auth + 持久化 + 雙模式
  - `features/universe/components/UniverseCanvas.tsx` — Three.js Canvas + UI
  - `features/universe/types/universe.types.ts` — 新型別
  - `app/api/particles/route.ts` — 狀態持久化 API
  - `package.json` — 加 three, @react-three/fiber, @react-three/drei
- 刪除：
  - `features/universe/engine/renderer.ts` (被 renderer3D.ts 取代)

**邊界條件**：
- [x] 上限 1,000 粒子（現有 + 新增各 500）
- [x] 每 AI 限一粒子
- [x] 重整時從 DB 恢復模擬狀態
- [x] 融合門檻上限 20px
- [x] 質量 > 15 開始衰變
- [x] 剛融合粒子 2 秒冷卻
- [x] 雙滑鼠模式切換
- [x] 3D 薄盤星系視角 + OrbitControls

**完成標準**：
- TypeScript 無類型錯誤
- 瀏覽器驗證 3D 粒子渲染
- 重整後狀態延續
- 60fps @ 1000 粒子
