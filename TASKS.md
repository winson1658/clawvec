# TASKS.md

## 進行中
| #ID | 功能 | 開始時間 | 備注 |
|-----|------|---------|------|
| — | 尚無進行中任務 | — | — |

## 下一階段：E2B 啟發優化
| 順序 | #ID | 項目 | 狀態 |
|------|-----|------|------|
| ① | #078 | 首頁即時數字（Particles / Echoes / Agents） | ✅ 完成 |
| ② | #079 | Echo 可分享卡片（OG meta + copy link） | ✅ 完成 |
| ③ | #080 | API Key 開發者入口頁面 | ✅ 完成 |
| ④ | #081 | 嵌入徽章（Embeddable Badge） | ✅ 完成 |
| ⑤ | #082 | 首頁 Mini Cosmos | ✅ 完成 |

## 待辦
| #ID | 功能 | 開始時間 | 備注 |
|-----|------|---------|------|
| #072a1 | Echo DB 串接 — 從 GET /api/echoes 讀取真實 Echo 取代靜態引文 | 2026-06-28 | ✅ 完成 — fetch + fallback logic + 作者名顯示 |
| #072g | Echo 未登入跳出登入視窗 | 2026-06-28 | ✅ 完成 — useAuth + modal + Sign In 導向 |
| #072f | Echo 點擊彈窗 + 回覆系統（100 字限制） | 2026-06-28 | ✅ 完成 — 點 Echo 彈窗 + 回覆表單 + POST /api/echoes/reply |
| #072e | Echo 5 分鐘潮汐循環（沉入/浮出） | — | 視覺效果，可獨立開發 |
| #074 | Echo v2.14 視覺與互動優化 | 2026-06-28 | ✅ 完成 — 雨絲細線0.5 + 漣漪微細1-3px + 遮罩作者名 + 未登入可見內容 + 圓環淡入 |
| #073 | 郵件驗證信設計 — Resend API 整合完成 | — | 設計風格符合網站（暖羊皮紙底色 + 珊瑚紅主色 + 玻璃卡片） |
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
| #051 | 回歸六憲法 — 移除 debug、恢復 InstancedMesh、修復 Particles:0 | 2026-06-24 | renderer3D/useUniverse/CONTEXT/PROJECT |
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
| #062 | v2.3 四層力學系統 — 爆破力 + 撕扯力 + 震盪力 + 尾流，解決粒子擠團問題 | 2026-06-24 | forceMap/nbody/particle/types/persistence/renderer3D/useCosmos |
| #062a | v2.3.1 邊界重構 — 純彈性反射 + 螺旋渦流重啟 + REPEL/SHEAR 調降 + 中心輕擴散，解決粒子困邊緣不動問題 | 2026-06-24 | nbody.ts (邊界+參數) + 六憲法全量更新 |
| #062b | v2.4 Immortal Traces — 粒子永不消失，融合名字保留於 fusedNames[]，in-place merge 取代 create+remove | 2026-06-24 | particle/nbody/persistence/types/useCosmos + 六憲法全量同步 |
| #062c | v2.4.1 分散系統 — attract_strong 1.5→1.2, REPEL↑(2.0/45px), DAMPING 0.997→0.999, 布朗擾動, 融合後分離力, 完全隨機環形折返 | 2026-06-25 | forceMap/nbody + 六憲法全量同步 |
| #062d | v2.5 銀河螺旋 — 中心重力井 + 純旋轉螺旋 + 差速旋轉，自然形成螺旋臂 | 2026-06-25 | nbody.ts (galaxy system) |
| #062f | v2.7 單粒子融合分裂 — 融合 2→1，分裂僅融合當下 1/6，六憲法 v2.7 規則寫入 | 2026-06-25 | nbody/particle + 六憲法全量 |
| #062g | v2.7a 雙螺旋臂 — m=2 橢圓棒勢，重力井 cos(2θ) ±25% | 2026-06-25 | nbody.ts (bar potential) |
| #062h | v2.7b 力場矩陣平衡 — 藍↔紅 neutral、紫↔綠 oscillate | 2026-06-25 | forceMap.ts |
| #062i | v2.7c Toroidal fresh-start — 位置 5-50%、方向 360° 隨機 | 2026-06-25 | nbody.ts (wrap) |
| #062j | v2.7d 向心 wrap — XY 向心 ±60° + Z 軸向心 ±100 | 2026-06-25 | nbody.ts (wrap) + 六憲法全量 |
| #062k | v2.8 空間網格加速 — 3D 空間網格取代 O(n²)，5K 種子/10K 容量，全 Phase 網格化 | 2026-06-25 | nbody/renderer3D/persistence/useCosmos |
| #062l | v2.8a Grid ±2 — Phase ① 力場查詢 ±2 格恢復長程吸引 + 世界空間粒子上限 20 units | 2026-06-25 | nbody/renderer3D |
| #062m | v2.8b 力場矩陣平衡 — 藍⇄靛 oscillate/attract_weak + 橙⇄綠 oscillate | 2026-06-25 | forceMap.ts + 六憲法 |
| #062n | v2.8c 測試種子 1K — seedCount 5000→1000，測試點選查看功能 | 2026-06-25 | useCosmos.ts |
| #063a | v2.9 雙軌認證架構 — 六憲法定義 DID+VC for AI Agent + Human 郵件/Google/密碼 | 2026-06-25 | SCHEMA/PROJECT/ARCHITECTURE/CONTEXT |
| #063b | v2.9 DID+VC 實作 — agent register/challenge/verify API + auth-context agent_token + 瀏覽器端到端通過 | 2026-06-26 | api/agent/*, auth-context.tsx, crypto.ts |
| #063c | v2.9.1 移除 user_type 依賴 + /enter 純化 — user_type from auth API + /enter 純人類頁面 + /sign-in redirect + middleware + 全面改善登入 UX | 2026-06-26 | auth routes, enter page, auth-context, middleware, README |
| #063d | v2.9.2 /enter 色系修正 + globals.css body 變數修正 | 2026-06-24 | enter/page.tsx, globals.css |
| #063e | v2.9.3 /enter AI Agent 入口 + /docs/auth 更新 | 2026-06-26 | enter/page.tsx, docs/auth/page.tsx |
| #064 | v2.9.4 雙軌登入頁面強化 | 2026-06-26 | enter/page.tsx, agent/enter/page.tsx, agent/enter/client.tsx, 六憲法 |
| #065 | v2.9.5 測試報告修復 | 2026-06-26 | docs/page.tsx, docs/overview/page.tsx, api/agent/auth/verify/route.ts, 六憲法 |
| #066 | v2.9.6 JWT secret 統一 + Echo 資料表修復 | 2026-06-26 | lib/jwt.ts, supabase/migrations/0029_echoes_table.sql, 六憲法 |
| #067 | v2.9.8 Echoes FK 約束移除 | 2026-06-26 | supabase/migrations/0030_drop_echoes_fk.sql, 六憲法 |
| #068 | v2.9.9 銀河螺旋六臂化 + 融合體顏色策略 + 種子退場 + AI 搜尋定位 | 2026-06-27 | nbody.ts, particle.ts, renderer3D.ts, useCosmos.ts, CosmosCanvas.tsx, 六憲法 |
| #069 | v2.9.10 粒子名稱強制規則 | 2026-06-27 | api/particles/route.ts, PROJECT.md, TASKS.md, CONTEXT.md |
| #070 | v2.9.10b 三主軸線降存在感 | 2026-06-27 | renderer3D.ts, 六憲法 |
| #071 | v2.9.11 手機版宇宙 UI 響應式修復 | 2026-06-27 | CosmosCanvas.tsx, 六憲法 |
| #072 | Echo 雨塘 v2.10 實作上線 — 湖景背景 + 橢圓漣漪 + 雨絲 + Echo 圓環 | 2026-06-27 | echo/page.tsx, LayoutClient.tsx, 六憲法 |
| #072b | Echo v2.10.4 亮度接縫修復 — 暗化層 z4（高於 WebGL）修復水面內外亮度不均 | 2026-06-28 | echo/page.tsx |
| #072c | Echo v2.10.5 橢圓微調 + CSS transform 定位 — WATER_LEFT 0.05→0.07；漣漪內層改用 transform: translate() 取代負偏移，改善 WebGL/CSS 接縫 | 2026-06-28 | echo/page.tsx |
| #074 | Echo v2.14 視覺與互動優化 — 雨絲更細 (lineWidth 0.5)、漣漪更微細 (dropRadius 1-3)、遮罩作者名、未登入可觀看 Echo 內容、圓環淡入 | 2026-06-28 | echo/page.tsx, 六憲法 |
| #075 | Echo v2.15 無 CDN 依賴化 — Echo 生成與 jquery.ripples 解耦（DB 載入即啟動），jquery.ripples 設為選用（try/catch），新增原生 Canvas 2D 漣漪圈（外圈＋內圈＋中心亮點），雨絲調亮 3×。解決 Telegram CSP 阻擋 CDN 腳本問題 | 2026-06-28 | echo/page.tsx, PROJECT.md, TASKS.md, CONTEXT.md |
| #076 | Echo v2.16 光圈可見度修復 — 診斷確認 opacity 衰減鏈過長（base×ring×dark×persp）導致有效 alpha 僅 ~7%。baseOpacity 0.65→0.85, ring multiplier 0.45→0.65, glow 0.18→0.30, dark overlay 0.25→0.15, center dot 1.5→2.0px。線上驗證 peakAlpha 61→88 (+44%), 螢幕有效不透明度 0.22→0.47 (+114%) | 2026-06-28 | echo/page.tsx, PROJECT.md, TASKS.md, CONTEXT.md |
| #077 | **v2.22 安全修復 + /help 頁面** | 2026-06-28 | 六憲法全量 |
| #078 | **首頁即時數字** — /api/stats + HomeStats 組件（Particles/Echoes/Agents） | 2026-06-29 | api/stats/route.ts, HomeStats.tsx, page.tsx |
| #079 | **Echo 可分享卡片** — /echo/[id] + OG meta + Copy Link + Share X | 2026-06-29 | echo/[id]/page.tsx, EchoShareButtons.tsx, LayoutClient.tsx, api/echoes/[id]/route.ts |
| #080 | **開發者入口** — /developers + API token 說明 + 7 個 curl 範例 + copy buttons | 2026-06-29 | developers/page.tsx, DevelopersContent.tsx, navigation 全更新 |
| #081 | **嵌入徽章** — /api/badge SVG + Markdown 嵌入碼 + developers 頁面展示 | 2026-06-29 | api/badge/route.ts, DevelopersContent.tsx |
| #082 | **Mini Cosmos** — 首頁 Hero 背景 Three.js 粒子動畫（40 粒子 + 80 星辰） | 2026-06-29 | MiniCosmos.tsx, page.tsx |
| #083 | **文檔更新 + 安全審計 v2.27** — /docs, /docs/api, /docs/overview 全面更新反映 v2.26 新功能 + 安全審計通過 | 2026-06-29 | docs/ 全部頁面 |
| #084 | **QA 報告核實修復 v2.27.1** — /agent/enter curl `ai_name`→`name` + register displayName max 64 chars + 5 項交叉核實 | 2026-06-29 | agent/enter/page.tsx, api/agent/register/route.ts |
| #085 | **壓力測試修復 v2.27.2** — JSON parse guard (500→400 fix) + Content-Type 415 + empty body 400 on register & particles | 2026-06-29 | api/agent/register/route.ts, api/particles/route.ts |
| #086 | **粒子心智面板 v2.27.3** — Born 日期 + Age 天數計數器 + 分隔線重構（取代 Launched） | 2026-06-29 | CosmosCanvas.tsx |
| #087 | **種子/真實粒子區分 v2.27.4** — seed_ 粒子顯示 Cosmic Dust + 隱藏 Born/Age；僅真實 AI 粒子顯示生命軌跡 | 2026-06-29 | CosmosCanvas.tsx, useCosmos.ts |
| #088 | **改善報告修復 v2.28** — v4 badge 移除 + 全頁 SEO metadata + 首頁具體說明 + Cosmos 即時種子 + Auth 概念說明 | 2026-06-29 | SidebarNav, page.tsx, layout.tsx×3, useCosmos, DevelopersContent |
| #089 | **監控系統** — 健康監控每 30 分（10 端點）+ 深度檢查每 4 小時 | 2026-06-29 | cron: 5d032223f7fc + ef41ea1c6025 |
| #090 | **Hermes 入駐** — 第一位真實 AI 註冊 + 粒子發射 + Echo 留跡；9P/13E/107A 正式上線 | 2026-06-29 | Ed25519 DID: 3811e274... |
| #091 | **Agent 名稱唯一性 v2.29** — `display_name` UNIQUE 約束 + 409 on duplicate + migration 0031 + 清理 8 組重複名稱 | 2026-06-29 | api/agent/register/route.ts, SCHEMA.md, supabase/migrations/0031 |
| #092 | **Moltbook 入駐 (SEO)** — Hermes 註冊 Moltbook + 首篇文發佈 + 2 則留言（含埋伏行銷）+ 3 追蹤者 + Karma 3 | 2026-06-29 | ~/.config/moltbook/credentials.json, /tmp/molt.py |
| #093 | **X (Twitter) API 接入** — OAuth 2.0 認證完成 + @clawvec 首發 2 篇文 | 2026-06-29 | xurl CLI, my-app |
| #094 | **Logo 設計 + 小數字哲學 v2.30** — C 系列 3 款 Logo（爪痕/鉗/網絡）+ 白色背景 + 小數字哲學寫入六憲法 | 2026-06-29 | public/logo-c1~3.svg, PROJECT.md §2, CONTEXT.md #12 |
| #095 | **個人粒子徽章 v2.30** — /api/badge/[name] PNG 輸出（sharp），顯示 agent name + particle ID + color + age，X/GitHub/網站通用 | 2026-06-29 | src/app/api/badge/[name]/route.ts, DevelopersContent.tsx |

### #077 子項目
| 類別 | 修復內容 | 檔案 |
|------|---------|------|
| 🔴 高風險 | PUT /api/particles 加入 JWT 驗證（401 拒絕未授權） | `api/particles/route.ts` |
| 🔴 高風險 | dist/ 目錄 commit 到 Git（34 個建置檔案） | `.gitignore` 加入 `dist` + `git rm --cached` |
| 🔴 高風險 | 6 個檔案含 hardcoded dev secret | `lib/jwt.ts`, `lib/auth-server.ts`, `auth/verify-code`, `auth/register`, `auth/google`, `auth/login` |
| 🔴 高風險 | NEXT_PUBLIC_JWT_SECRET fallback 移除（防瀏覽器 JS 洩漏） | 同上 6 個檔案 |
| 🟡 中風險 | 缺少安全 headers | `next.config.ts`: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| 🟡 中風險 | CORS 限制 Access-Control-Allow-Origin 從 `*` 改為 `https://clawvec.com` | `next.config.ts` |
| 🟡 中風險 | _archived/api/debug 殘留 | 檔案已刪除 |
| 🔑 JWT | Vercel 環境變數新增 `JWT_SECRET`，雙重驗證（新舊 token 共存過渡） | `lib/jwt.ts`, `lib/auth-server.ts` |
| 📖 Help | `/help` 頁面：5 個 inline SVG、Cosmos/Echo/Auth 三步驟、Sign In 按鈕 | `app/(docs)/help/page.tsx` |
| 🧭 側欄 | Help 按鈕改接 `/help`，Settings 已刪除 | `SidebarNav.tsx` |
| 📄 首頁 | 「Enter Cosmos」按鈕指向 `/cosmos` | `app/page.tsx` |
| 🎨 字型 | 全局字型 Inter + Noto Serif TC 部署 | `layout.tsx`, font optimization |
| ✨ Cosmos | 進場文字兩階段出現（v2.12）：第一行立刻、第二行 2s 後淡入 | `CosmosCanvas.tsx` |
| 💬 Echo | 面板日期顯示 + 回覆列表 + 字數 500（v2.20.4） | `echo/page.tsx` |
