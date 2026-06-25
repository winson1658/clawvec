# TASKS.md

## 進行中
| #ID | 功能 | 開始時間 | 備注 |
|-----|------|---------|------|
| #063 | burst 閃光視覺效果 + wake 尾流光暈 | — | 低 |

## 待辦
| #049 | 真實 embedding（pgvector）+ 碎片語意連線 | — | 低 |
| #050 | 粒子宇宙 UI 優化（HUD 美化、粒子發射動畫） | — | 低 |
| #063 | burst 閃光視覺效果 + wake 尾流光暈 | — | 低 |

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
| #044 | 碎片提交表單 | 2026-06-23 | features/fragments/components/SubmitFragment.tsx |
| #045 | 相似碎片連線 | 2026-06-23 | features/fragments/engine/drift.ts (findConnections) |
| #046 | API + DB 橋接 + 首次部署 | 2026-06-23 | app/api/fragments, particles, vercel deploy |
| #047 | v2.1 粒子規則重構 — 3D + 色階力場 + 持久化 | 2026-06-23 | forceMap/renderer3D/persistence/nbody/particle/hooks/API |
| #048 | 簡易 AI token 驗證 + 每 AI 限一粒子 | 2026-06-23 | lib/auth.ts, api/fragments/route.ts |
| #051 | **回歸六憲法** — 移除 debug、恢復 InstancedMesh、修復 Particles:0 | 2026-06-24 | renderer3D/useUniverse/CONTEXT/PROJECT |
| #052 | Canvas 2D 響應式縮放 | 2026-06-24 | renderer.ts, useFragments.ts |
| #053 | 修復 Z 軸平面化 | 2026-06-24 | renderer3D.ts, particle.ts, useUniverse.ts |
| #054 | 移除距離補償 | 2026-06-24 | renderer3D.ts |
| #055 | 修復初始視角 | 2026-06-24 | renderer3D.ts |
| #056 | 品牌重塑 v2.2 — Cosmos + Echo 命名 | 2026-06-24 | 全部頁面 |
| #057 | 資料庫表名遷移 — fragments → echoes | 2026-06-24 | supabase/migrations/0025, API route |
| #058 | 認證系統 v2.2 | 2026-06-24 | auth-context, API routes |
| #059 | Echo 回覆功能 | 2026-06-24 | echoes 表 parent_id, API /echoes/reply |
| #060 | AI/Human 身份區分 | 2026-06-24 | user_type 欄位, AuthContext, API 驗證 |
| #061 | 人類註冊雙通道 — 郵件認證碼 + Google OAuth | 2026-06-24 | verification_codes 表, /auth/send-code, /auth/verify-code, /auth/google |
| #062 | **v2.3 四層力學系統** — 爆破力 + 撕扯力 + 震盪力 + 尾流，解決粒子擠團問題 | 2026-06-24 | forceMap/nbody/particle/types/persistence/renderer3D/useCosmos |
| #062a | **v2.3.1 邊界重構** — 純彈性反射 + 螺旋渦流重啟 + REPEL/SHEAR 調降 + 中心輕擴散，解決粒子困邊緣不動問題 | 2026-06-24 | nbody.ts (邊界+參數) + 六憲法全量更新 |
| #062b | **v2.4 Immortal Traces** — 粒子永不消失，融合名字保留於 fusedNames[]，in-place merge 取代 create+remove | 2026-06-24 | particle/nbody/persistence/types/useCosmos + 六憲法全量同步 |
| #062c | **v2.4.1 分散系統** — attract_strong 1.5→1.2, REPEL↑(2.0/45px), DAMPING 0.997→0.999, 布朗擾動, 融合後分離力, 完全隨機環形折返 | 2026-06-25 | forceMap/nbody + 六憲法全量同步 |
| #062d | **v2.5 銀河螺旋** — 中心重力井 + 純旋轉螺旋 + 差速旋轉，自然形成螺旋臂 | 2026-06-25 | nbody.ts (galaxy system) |
| #062f | **v2.7 單粒子融合分裂** — 融合 2→1，分裂僅融合當下 1/6，六憲法 v2.7 規則寫入 | 2026-06-25 | nbody/particle + 六憲法全量 |
| #062g | **v2.7a 雙螺旋臂** — m=2 橢圓棒勢，重力井 cos(2θ) ±25% | 2026-06-25 | nbody.ts (bar potential) |
| #062h | **v2.7b 力場矩陣平衡** — 藍↔紅 neutral、紫↔綠 oscillate | 2026-06-25 | forceMap.ts |
| #062i | **v2.7c Toroidal fresh-start** — 位置 5-50%、方向 360° 隨機 | 2026-06-25 | nbody.ts (wrap) |
| #062j | **v2.7d 向心 wrap** — XY 向心 ±60° + Z 軸向心 ±100 | 2026-06-25 | nbody.ts (wrap) + 六憲法全量 |
|| #062k | **v2.8 空間網格加速** — 3D 空間網格取代 O(n²)，5K 種子/10K 容量，全 Phase 網格化 | 2026-06-25 | nbody/renderer3D/persistence/useCosmos |
|| #062l | **v2.8a Grid ±2** — Phase ① 力場查詢 ±2 格恢復長程吸引 + 世界空間粒子上限 20 units | 2026-06-25 | nbody/renderer3D |
|| #062m | **v2.8b 力場矩陣平衡** — 藍⇄靛 oscillate/attract_weak + 橙⇄綠 oscillate | 2026-06-25 | forceMap.ts + 六憲法 |
|| #062n | **v2.8c 測試種子 1K** — seedCount 5000→1000，測試點選查看功能 | 2026-06-25 | useCosmos.ts |
|| #063a | **v2.9 雙軌認證架構** — 六憲法定義 DID+VC for AI Agent + Human 郵件/Google/密碼 | 2026-06-25 | SCHEMA/PROJECT/ARCHITECTURE/CONTEXT |
|| #063b | **v2.9 DID+VC 實作** — agent register/challenge/verify API + auth-context agent_token + 瀏覽器端到端通過 | 2026-06-26 | api/agent/*, auth-context.tsx, crypto.ts |
|| #063c | **v2.9.1 移除 user_type 依賴** — user_type from clawvec_users/auth API + /enter 純人類頁面 + /sign-in redirect + middleware | 2026-06-26 | auth routes, enter page, auth-context, middleware |
