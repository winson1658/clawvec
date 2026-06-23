# CONTEXT.md
## AI 工具快速導覽（開始任何工作前必讀）

### 這個項目是什麼
AI Universe 是一個 AI 與 AI 互動的宇宙沙盒。
兩頁：Page 1 重力場粒子宇宙（`/`）+ Page 2 碎片漂流之海（`/fragments`）。
核心價值：讓 AI 的行為可被看見、被記憶、湧現不可預測的美。

### 技術棧（禁止自行更改）
| 層次 | 選型 | 注意事項 |
|------|------|---------|
| 框架 | Next.js 16 + React 19 | Turbopack 構建 |
| 樣式 | Tailwind CSS 4 | Page 1/2 使用 #0a0a14 深空底色 |
| 渲染 | Canvas 2D (原生) | HiDPI 2x 渲染，非 WebGL |
| 狀態 | React useRef + useState | 物理模擬用 ref 避免 re-render |
| AI | DeepSeek (primary) + OpenAI (backup) | embedding API |
| DB | Supabase（PostgreSQL + pgvector）| particles + fragments 表，16 行種子數據 |
| 部署 | Vercel | `cd ~/clawvec-v4 && npx vercel --prod` |

### 設計系統快速參考
| 元素 | 規範 | 說明 |
|------|------|------|
| **底色** | `#0a0a14` | 深空黑，兩頁通用 |
| **粒子光暈** | HSL variable | 色相由屬性決定 |
| **碎片光點** | `#ffffff` → 色相微染 | 五種型態不同視覺 |
| **連線** | `rgba(255,255,255,0.15)` | 相似碎片連線 |
| **強調色** | `#FF5A3C` | 投放按鈕、焦點狀態 |
| **HUD 文字** | `rgba(255,255,255,0.7)` | 半透明白 |

### 當前模塊清單
| 模塊 | 路徑 | 狀態 | 備注 |
|------|------|------|------|
| **universe** | features/universe/ | ✅ 已完成 | Page 1: Canvas 粒子宇宙 |
| **fragments** | features/fragments/ | ✅ 已完成 | Page 2: 碎片漂流 |
| **API** | app/api/particles/, app/api/fragments/ | ✅ 已完成 | GET/POST 兩組端點 |
| **services** | features/*/services/ | ✅ 已完成 | 客戶端 API 封裝 |
| **[舊版全部]** | features/[_archived]/, app/_archived/ | 💤 隱藏 | 舊 Clawvec 文明基礎設施 |

### 六憲法文件
- PROJECT.md — 產品目標、功能範圍、設計系統
- ARCHITECTURE.md — 目錄結構、邊界規則、依賴方向
- SCHEMA.md — 資料庫結構（particles + fragments 已部署）
- TASKS.md — 任務清單（#036-#046 全數完成）
- AI_WORKFLOW.md — AI 開發流程（Spec → Claude → Tester → Codex → Deploy）
- CONTEXT.md — 本文件

### 最常需要修改的文件
- **新功能** → `src/features/universe/` 或 `src/features/fragments/`
- **API 調用** → `src/app/api/particles/` 或 `src/app/api/fragments/`
- **AI 功能** → `src/ai/providers/` 或 `src/ai/prompts/`
- **數據類型** → `src/types/domain.types.ts`
- **路由** → `src/app/page.tsx` 或 `src/app/fragments/page.tsx`

### 快速規則（必須遵守）
1. 組件中不能直接 `fetch()` 或 `axios` → 用 `features/*/services/` 層
2. 伺服端 Supabase 用 `lib/supabase-server.ts`（service_role key）
3. 客戶端 Supabase 用 `lib/supabase.ts`（anon key）
4. 新功能前先查 TASKS.md 確認有對應任務
5. 舊版 features/[_archived]/ 和 app/_archived/ 不可刪除，不可 import
6. Page 1/2 兩頁共享粒子：fragments POST → particles INSERT
7. 本地構建通過才能部署
8. Demo 數據作為 DB 空時的 fallback

### 當前狀態
- 本地開發：✅ 兩頁功能完整，API 正常，DB 有 16 筆種子數據
- 部署狀態：⚠️ Vercel 構建卡住（Turbopack + Vercel free tier 兼容問題），clawvec.com 仍是舊版

### 禁止觸碰的文件（需要特別授權）
- supabase/migrations/*.sql（改動需要數據庫遷移）
- .env.local（含密鑰）
- features/[_archived]/（舊版保留，不可改動）
