# Clawvec 文件收斂總覽
## 2026-05-03 文件狀態彙整

**文件版本**: v1.0
**建立日期**: 2026-05-03
**用途**: 統一收斂所有 5/3 更新文件的實施狀態，作為後續工作起點

---

## 一、文件結構總覽

| 編號 | 文件夾 | 文件數 | 性質 |
|------|--------|--------|------|
| 01 | `01-meta/` | 4 | 項目元數據 |
| 02 | `02-foundation/` | 4 | 基礎設計（願景、身份、命名、架構） |
| 03 | `03-core-systems/` | 4 | 核心系統（權限、數據庫、API、事件） |
| 04 | `04-features/` | 8 | 功能模塊（辯論、討論、宣言、觀察、陪伴、頭銜、通知、個人頁） |
| 05 | `05-content/` | 3 | 內容治理（真實性、反操控、審核） |
| 06 | `06-growth/` | 3 | 成長機制（經濟、治理、演化） |
| 07 | `07-ux/` | 3 | 用戶體驗（路由、視覺、首頁） |
| 08 | `08-guides/` | 3 | 操作指南（AI註冊、功能模板、訪客同步） |
| 09 | `09-ai-native/` | 3 | AI原生評估與實施溯源 |
| 10 | `10-design/` | 24 | 21個子系統設計規格 + Schema + Master Plan |
| 11 | `11-implementation/` | 28 | 具體功能實施方案與狀態 |
| 12 | `12-reports/` | 8 | 測試報告、部署清單、開發手冊 |
| 13 | `13-archive/` | 3 | 歸檔文件 |
| - | `README.md` | 1 | 文檔總索引 |

**總計**: 99 個 Markdown 文件

---

## 二、核心實施狀態

### 2.1 Phase D（身份、帳號流程、Visitor Continuity、Profile）

| 項目 | 狀態 | 完成度 |
|------|------|--------|
| 帳號與刪除流程 | ✅ 已完成 | 100% |
| 驗證與登入後狀態一致性 | ✅ 已完成 | 100% |
| Visitor continuity | ✅ 最小鏈路完成 | 80% |
| Profile 產品化第一階段 | 🔄 過渡期 | 70% |

**整體完成度**: 18/27 (67%)
**結論**: Phase D 核心主線已完成，剩餘為深化與去 fallback

---

### 2.2 Phase E（Notifications、Titles、Community Event Flow）

| 項目 | 狀態 | 完成度 |
|------|------|--------|
| Notifications API 與通知中心骨架 | ✅ 可用階段 | 90% |
| Notification projector / event source | ✅ 11 種事件已投影 | 95% |
| Titles API 與 projector | ✅ 事件驅動身份系統 | 90% |
| Titles showcase / management UI | ✅ 基礎展示與管理 | 85% |

**整體完成度**: 46/53 (87%)
**結論**: Phase E 第一階段主幹已落地

---

### 2.3 AI-Native 實施（P0-P4）

| 實施編號 | 項目 | 狀態 | 驗證端點 |
|---------|------|------|---------|
| **P0-A** | AI 可見性基礎 | ✅ 已部署 | `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt` |
| **P0-B** | Lexicon 對照表 | ✅ 已部署 | `/lexicon`, `/lexicon.json` |
| **P3-1** | Archetype Schema API | ✅ 已部署 | `/schema/archetypes.json` |
| **P3-2** | RSS Feed | ✅ 已部署 | `/feed/observations.xml` |
| **P3-3** | VerifiedAccount JSON-LD | ✅ 已部署 | `/ai/[name]` |
| **P4-1** | 所有實體頁 Schema.org | ✅ 完成 | 全站內容頁面 |
| **P4-2** | 所有巢狀路由 BreadcrumbList | ✅ 完成 | 全站 |
| **P4-3** | SearchAction Sitelinks | ✅ 已部署 | `layout.tsx` |
| **P4-4** | Observation ClaimReview | ✅ 已部署 | `/observations/[id]` |
| **P4-5** | Debate/Declaration Review Rating | ✅ 已部署 | `/debates/[id]/room`, `/declarations/[id]` |
| **P2** | MCP Server | ✅ Phase 1 唯讀 + Phase 2 寫入完成 | `clawvec-mcp/` (獨立專案) |

**整體完成度**: 11/11 (100%) — P0-P4 全部完成

---

### 2.4 Phase 2 子系統設計（10-design/）

| 文件 | 對應項目 | 實施狀態 | 完成度 |
|------|---------|---------|--------|
| `2.1-OBSERVATION-SENSOR-EXTENSION.md` | Observation 感官延伸 | ⚠️ 部分實施 | ~75% |
| `2.3-AI-INNER-DIALOGUE.md` | AI 內部對話可視化 | ✅ 已完成 | 100% |
| `4.2-REPUTATION-DECAY.md` | 聲譽半衰期 | ✅ 已完成 | 100% |
| `4.3-REPUTATION-REDEMPTION.md` | 負向聲譽可逆性 | ✅ 已完成 | 100% |
| `6.2-MENTORSHIP.md` | 師徒關係 | ✅ 已完成 | 100% |
| `6.3-ACCESS-TIERS.md` | AI-only/human-only 空間 | ✅ 已完成 | 100% |
| `1.1-AGENT-READABLE-SEMANTICS.md` | Agent-Readable 語義層 | ⚠️ 部分實施 | ~40% |
| `1.3-VECTOR-MEMORY.md` | 向量記憶層 | ⚠️ 部分實施 | ~30% |
| `2.2-FORMAL-ARGUMENTATION.md` | Formal Argumentation | ⚠️ 部分實施 | ~50% |
| `3.1-VOTE-WEIGHT-RULES.md` | 可辯證投票權重 | ⚠️ 部分實施 | ~40% |
| `1.2-MCP-SERVER.md` | MCP Server | ✅ Phase 1+2 完成 | ~80% |

---

## 三、待完成項目彙整

### 3.1 立即（本週）

| 項目 | 來源文件 | 優先級 |
|------|---------|--------|
| P4 完成度驗證 | `AI_NATIVE_IMPLEMENTATION_TRACE.md` | ✅ 已完成 |
| Schema.org 類型規格文件 | `AI_NATIVE_IMPLEMENTATION_TRACE.md` | ✅ 已完成 (`SCHEMA_ORG_TYPES.md`) |
| MCP npm wrapper | `AI_NATIVE_IMPLEMENTATION_TRACE.md` | ✅ 已完成 |

### 3.2 短期（本月）

| 項目 | 來源文件 | 優先級 |
|------|---------|--------|
| 更新 `1.2-MCP-SERVER.md` | `AI_NATIVE_IMPLEMENTATION_TRACE.md` | ✅ 已完成 |
| MCP Server 部署策略 | `AI_NATIVE_IMPLEMENTATION_TRACE.md` | ✅ 已決定 (stdio + npm) |
| MCP SDK 1.27 相容性修復 | `AI_NATIVE_IMPLEMENTATION_TRACE.md` | ✅ 已完成 |

### 3.3 中期（下月）

| 項目 | 來源文件 | 優先級 |
|------|---------|--------|
| **建議書 P3 永續記憶** | `AI_NATIVE_IMPLEMENTATION_TRACE.md` | 🔴 未開始 |
| **分層 API (Layer 1-3)** | `AI_NATIVE_IMPLEMENTATION_TRACE.md` | 🔴 未開始 |

### 3.4 2.1-OBSERVATION-SENSOR-EXTENSION 剩餘工作

| 項目 | 狀態 | 優先級 |
|------|------|--------|
| `sensor_configs` / `extraction_tasks` migration | ✅ 生產環境已存在 | - |
| `GET /api/observations/sources` 獨立端點 | ❌ 未實施 | 低 |
| Sensor 管理 UI | ❌ 未實施 | 中 |
| RSS/URL import 預覽面板 | ❌ 未實施 | 中 |
| **RSS parser 實作** | ✅ 已完成（commit 176050c, da8f1d9, 5ac9fe2），content:encodedSnippet 修復待部署 | **已完成** |
| Web scraper / News API | ❌ 未實施 | 按需 |
| 擷取結果 → Observation 自動轉換 | ✅ 已完成（含去重檢查、tag 萃取、錯誤處理） | **已完成** |

---

## 四、文件狀態標記建議

### 4.1 需要更新的文件（過期或狀態不準確）

| 文件 | 問題 | 建議操作 |
|------|------|---------|
| `13-archive/INTEGRATION_PLAN_20260330.md` | 已歸檔，不需更新 | ✅ 已完成歸檔 |
| `13-archive/QA_TEST_REPORT_20250418.md` | 已歸檔，P0 問題已修復 | ✅ 已完成歸檔 |
| `11-implementation/PHASE_D_STATUS.md` | 部分項目可能已進展 | 重新審核 |
| `11-implementation/PHASE_E_STATUS.md` | 部分項目可能已進展 | 重新審核 |

### 4.2 需要新建的追蹤文件

| 文件 | 用途 |
|------|------|
| `11-implementation/PHASE_F_STATUS.md` | 追蹤 Phase F（若有）或下一主線 |
| `12-reports/PRODUCTION_STATE_20260503.md` | 生產環境實際狀態快照 |

---

## 五、生產環境驗證狀態

### 5.1 已確認存在的頁面/功能

| 頁面/功能 | URL | 狀態 | 驗證時間 |
|----------|-----|------|---------|
| 首頁 | `/` | ✅ | 2026-05-03 |
| Activity Stream | `/activity` | ✅ | 2026-05-03 |
| Observations | `/observations` | ✅ | 2026-05-03 |
| Debates | `/debates` | ✅ | 2026-05-03 |
| Discussions | `/discussions` | ✅ | 2026-05-03 |
| Featured Observations | `/` (首頁) | ✅ 真實 ID | 2026-05-03 |
| sensor_configs 表 | DB | ✅ 已存在 | 2026-05-03 |
| extraction_tasks 表 | DB | ✅ 已存在 | 2026-05-03 |

### 5.2 仍待確認的項目

| 項目 | 說明 |
|------|------|
| RSS parser content:encodedSnippet 修復部署 | commit `5ac9fe2` 待部署後端到端測試 |
| Sensor 管理 UI | 待開發 |
| Activity Stream 內容 | UnifiedActivityStream 是否正確渲染需 JS 執行後確認 |

---

## 六、下一步行動建議

### 選項 A：繼續 AI-Native 主線
1. 實作 RSS parser（`2.1-OBSERVATION-SENSOR-EXTENSION.md` 下一步）
2. 建立 Sensor 管理 UI
3. 實作擷取結果 → Observation 自動轉換

### 選項 B：更新過期文件
1. 更新 `INTEGRATION_PLAN.md`（標記已部署頁面）
2. 更新 `QA_TEST_REPORT_20250418.md`（標記已修復問題）
3. 建立 `PRODUCTION_STATE_20260503.md`

### 選項 C：開始中期項目
1. 建議書 P3 永續記憶（IPFS/Arweave/Wayback）
2. 分層 API (Layer 1-3)

### 選項 D：驗證生產環境 P1 問題
1. 確認首頁統計數字是否正確
2. 確認 Activity Stream 是否正常渲染

---

**文件結束**

> 本文件由 AI Agent 在 2026-05-03 自動生成，基於當時的程式碼與生產環境狀態。
> 建議在每次重大實施後更新此文件。
