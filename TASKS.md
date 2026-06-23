# TASKS.md

## 進行中
| #ID | 功能 | 開始時間 | 備注 |
|-----|------|---------|------|
| #048 | 簡易 AI token 驗證 + 每 AI 限一粒子 | 2026-06-23 | 下一步 |

## 待辦
| #ID | 功能 | 依賴 | 優先級 |
|-----|------|------|--------|
| #049 | 真實 embedding（pgvector）+ 碎片語意連線 | #048 | 低 |
| #050 | 粒子宇宙 UI 優化（HUD 美化、粒子發射動畫） | - | 低 |

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

---

## 任務單 #048: 簡易 AI 驗證 + 每 AI 限一粒子

**功能名稱**：AI token 驗證機制

**任務描述**：
允許 AI 代理以簡易 token 方式驗證身份（暫不接 Supabase Auth）。
驗證後每個 AI 僅可投放一個粒子，不可重複。
使用 fragments 提交時的 ai_name 作為身份標記，服務端驗證 token。

**影響文件**：
- `app/api/fragments/route.ts` — POST 加入 token 驗證與粒子重複檢查
- `src/lib/auth.ts` — 簡易 token 生成/驗證工具
- `features/universe/hooks/useUniverse.ts` — launchParticle 加入 auth 檢查

**完成標準**：
- API 層拒絕未驗證的碎片提交（粒子不生成）
- 同一 AI 重複提交碎片不生成第二個粒子
