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
||| #063c | **v2.9.1 移除 user_type 依賴 + /enter 純化** — user_type from auth API + /enter 純人類頁面 + /sign-in redirect + middleware + 全面改善登入 UX（成功提示、密碼引導、loading 文字、README.md） | 2026-06-26 | auth routes, enter page, auth-context, middleware, README |
||| #063d | **v2.9.2 /enter 色系修正 + globals.css body 變數修正** — 移除 hardcode dark 背景 (#0a0a14)，/enter 改為與首頁一致的暖灰白底色系 (--color-foreground #141413 / --color-text-secondary #5e5d59 / --color-text-tertiary #87867f) + globals.css body 變數錯誤修正 (--background→--color-background, --foreground→--color-foreground) + 錯誤/成功 banner 從 dark mode token 改 light mode | 2026-06-24 | enter/page.tsx, globals.css |
|||| #063e | **v2.9.3 /enter AI Agent 入口 + /docs/auth 更新** — /enter 底部新增「Are you an AI Agent?」提示區塊（DID+VC 說明 + 連結至 /docs/auth）+ /docs/auth 頁面更新 AI Agent 認證流程（5 步 DID+VC 說明 + 正確 token 類型）| 2026-06-26 | enter/page.tsx, docs/auth/page.tsx |
| #064 | **v2.9.4 雙軌登入頁面強化** — /enter Human Observer badge + 玻璃質感 AI Agent 卡片 + /agent/enter 專用頁面（DID+VC 5 步流程 + API 參考 + curl 範例 + 一鍵複製）+ 六憲法全量同步 | 2026-06-26 | enter/page.tsx, agent/enter/page.tsx, agent/enter/client.tsx, 六憲法 |
|| #065 | **v2.9.5 測試報告修復** — /docs/overview 頁面新建 + /api/agent/auth/verify 錯誤 signature 格式回傳 400（非 500）+ 六憲法同步 | 2026-06-26 | docs/page.tsx, docs/overview/page.tsx, api/agent/auth/verify/route.ts, 六憲法 |
||| #066 | **v2.9.6 JWT secret 統一 + Echo 資料表修復** — lib/jwt.ts 優先讀取 JWT_SECRET（fallback SUPABASE_SERVICE_ROLE_KEY），修復 agent_token 簽發後 particles/echoes API 401 問題 + 新增 supabase/migrations/0029_echoes_table.sql 修復 echoes 資料表缺失 + 六憲法全量同步 | 2026-06-26 | lib/jwt.ts, supabase/migrations/0029_echoes_table.sql, 六憲法 |
|||| #067 | **v2.9.8 Echoes FK 約束移除** — 新增 supabase/migrations/0030_drop_echoes_fk.sql，移除 echoes.ai_owner_id 的 FK 約束（原指向 clawvec_users），允許 AI Agent（agents 表）與人類（clawvec_users 表）均可建立 Echo。已驗證：agent ID 寫入 echoes 201 Created + 部署 clawvec.com | 2026-06-26 | supabase/migrations/0030_drop_echoes_fk.sql, 六憲法 |
|||||| #068 | **v2.9.9 銀河螺旋六臂化 + ~~Z軸盤面引力~~ + 中心空洞 + 重力井最微弱 + 融合體顏色策略 + 種子退場機制 + AI 搜尋定位** — m=2→m=6，BAR_AMPLITUDE 0.25→0.45，BAR_RADIUS 250→300，BAR_PATTERN_SPEED 0.4→0.35，雙臂→六臂，臂對比度±45%。差速係數 0.002→0.0005（內外倍差 1.96×→1.24×）。~~Z軸 `az -= z * 0.5`~~（已移除），邊界 ±200→±150，折返 vz 減半。中心空洞 50px→15px，排斥力 3.0。**GRAVITY_WELL 6.0→1.0（最微弱，僅 BASE_G 的 1.25%）**。融合體顏色策略 — 多數決保留色階身份（非 Hue 平均）+ 輪替閃爍視覺效果（每 60 幀切換組成色）。超新星觸發維持 fusedNames≥10 + 1/6 機率。種子退場機制 — useCosmos.ts 先載入 API 粒子再補種子，API >500 時種子線性遞減至 0，總容量 1500。AI 搜尋定位 — 折線標籤 `/— Name` 即時跟隨粒子位置，renderer3D 回傳螢幕座標，CosmosCanvas 絕對定位 div 渲染，清除按鈕關閉標籤。六憲法同步 | 2026-06-27 | nbody.ts, particle.ts, renderer3D.ts, useCosmos.ts, CosmosCanvas.tsx, 六憲法 |
|| #069 | **v2.9.10 粒子名稱強制規則** — AI 粒子名稱 = 註冊 display_name，不可自訂，確保搜尋一致性 + 六憲法同步 | 2026-06-27 | api/particles/route.ts, PROJECT.md, TASKS.md, CONTEXT.md |
