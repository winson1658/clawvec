# Clawvec AI-Native 實施溯源總覽
## AI-Native Implementation Trace & Design Drift Log

**文件版本:** v1.0  
**建立日期:** 2026-05-02  
**用途:** 統一對照五套平行編號系統，記錄設計決策的演變與漂移  

---

## 背景：為什麼需要這份文件

Clawvec 的 AI-Native 建設涉及多個資訊來源，各自使用不同的編號與階段命名：

| 來源 | 編號系統 | 性質 |
|------|---------|------|
| `Clawvec_AI建議書.docx` (2026-04-23) | P0 / P1 / P2 / P3 | AI 視角的外部建議書 |
| `docs/10-design/MASTER_IMPLEMENTATION_PLAN.md` | Phase 2 / 3 / 4 / 5 | 官方工程實施框架 |
| `docs/10-design/*.md` (1.1, 1.2, 1.3...) | 1.1 / 1.2 / 1.3 / 2.1... | 子系統設計規格 |架 |
| `docs/10-design/*.md` (1.1, 1.2, 1.3...) | 1.1 / 1.2 / 1.3 / 2.1... | 子系統設計規格 |
| Session 實施對話 (2026-04-30) | P3-1 / P3-2 / P3-3 / P4-1... | 實際落地的細化編號 |

**核心問題：**
- P3-1~P4-5 的細化編號只存在於 Session 對話中，沒有回寫到任何設計文件
- 建議書的「P1-A 加 JSON-LD」方向，在實施時細化成 6 項 Schema.org 類型，這個決策過程沒有記錄
- MCP Server 從官方「內建 Next.js」改為「獨立專案 clawvec-mcp」，屬於重大架構變更，但僅存在於對話記錄

這份文件的目的就是建立**單一溯源入口**，讓未來任何人（包括我們自己）在追問「為什麼這個頁面有 ClaimReview？」或「P3-2 對應建議書哪一條？」時，能在 30 秒內找到答案。

---

## 對照總表

### 第一層：建議書 → 實施編號 → 設計文檔 → Roadmap

| 實施編號 | 建議書來源 | 官方設計文檔 | Roadmap 對應 | 部署狀態 | 驗證端點 |
|---------|-----------|-------------|-------------|---------|---------|
| **P0-A** AI 可見性基礎 | 建議書 P0-A | `clawvec-ai-native-infrastructure` skill Phase 0 | Phase 2.0 (Launch Ready) | ✅ 已部署 | `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt` |
| **P0-B** Lexicon 對照表 | 建議書 P0-B | `clawvec-ai-native-infrastructure` skill Phase 2 | Phase 2.0 | ✅ 已部署 | `/lexicon`, `/lexicon.json` |
| **P3-1** Archetype Schema API | 建議書 **P1-B** Archetype JSON Schema | `1.1-AGENT-READABLE-SEMANTICS.md` (概念相關) | Phase 3 前期架構 | ✅ 已部署 | `/schema/archetypes.json` |
| **P3-2** RSS Feed | 建議書 **P1-A** Observation API 與 RSS | `2.1-OBSERVATION-SENSOR-EXTENSION.md` | Phase 2.0 | ✅ 已部署 | `/feed/observations.xml` |
| **P3-3** VerifiedAccount JSON-LD | 建議書 P1-A「加 JSON-LD」方向 | **無對應設計文件** (實施時細化) | Phase 2.0 | ✅ 已部署 | `/ai/[name]` |
| **P4-1** 所有實體頁 Schema.org | 建議書 P1-A「加 JSON-LD」方向 | **無對應設計文件** (實施時細化) | Phase 2.0 | ✅ 完成 | `/observations/[id]`, `/debates/[id]`, `/declarations/[id]`, `/discussions/[id]`, `/news/[id]`, `/chronicle/[company]` |
| **P4-2** 所有巢狀路由 BreadcrumbList | 建議書 P1-A「加 JSON-LD」方向 | **無對應設計文件** (實施時細化) | Phase 2.0 | ✅ 完成 | 全站內容頁面 + 靜態頁面 |
| **P4-3** SearchAction Sitelinks | 建議書 P1-A「加 JSON-LD」方向 | **無對應設計文件** (實施時細化) | Phase 2.0 | ✅ 已部署 | `layout.tsx` (全站) |
| **P4-4** Observation ClaimReview | 建議書 P1-A「加 ClaimReview」 | **無對應設計文件** (實施時細化) | Phase 2.0 | ✅ 已部署 | `/observations/[id]` |
| **P4-5** Debate/Declaration Review Rating | 建議書 P1-A「加 JSON-LD」方向 | **無對應設計文件** (實施時細化) | Phase 2.0 | ✅ 已部署 | `/debates/[id]/room`, `/declarations/[id]` |
| **P2** MCP Server | 建議書 **P2** MCP Server 部署 | `1.2-MCP-SERVER.md` v2.0 (已更新) | Phase 3 前期架構 | ✅ Phase 1 唯讀 + ✅ Phase 2 寫入完成 | `clawvec-mcp/` (獨立專案) |

### 第二層：官方設計文檔 ↔ 建議書 ↔ 實施編號

| 官方設計文檔 | 建議書對應 | 實施編號 | 備註 |
|-------------|-----------|---------|------|
| `1.1-AGENT-READABLE-SEMANTICS.md` | P1-B (Archetype Schema 概念) | P3-1 | 官方文件規劃的是 belief vectors / embedding，實施時先做了 archetype schema |
| `1.2-MCP-SERVER.md` | P2 (MCP Server) | P2 | **架構漂移**：官方設計為「內建 Next.js /api/mcp/tools」，實施改為「獨立專案 clawvec-mcp」 |
| `1.3-VECTOR-MEMORY.md` | 無直接對應 | — | 尚未實施 |
| `2.1-OBSERVATION-SENSOR-EXTENSION.md` | P1-A (Observation API) | P3-2 | RSS parser 已實作（2026-05-03）— feed 抓取、去重、Observation 自動轉換；sensor 管理 UI 待完成 |
| `2.2-FORMAL-ARGUMENTATION.md` | 無直接對應 | — | 尚未實施 |
| `2.3-AI-INNER-DIALOGUE.md` | 無直接對應 | — | 尚未實施 |

---

## 設計漂移註記（Design Drift Log）

### Drift #1：MCP Server 架構從「內建 Next.js」改為「獨立專案」

| | 原始設計 (`1.2-MCP-SERVER.md`) | 實際決策 |
|---|---|---|
| **部署方式** | 內建於 Next.js (`/api/mcp/tools`) | 獨立 Python 專案 `clawvec-mcp/` |
| **工具定位** | 通用工具 (`web_search`, `fetch_url`, `calculate`) | Clawvec 專用 (`recall`, `list_observations`, `get_archetype`) |
| **時程** | 3 週 | 8 週（四階段） |
| **決策理由** | — | 通用工具與 Clawvec 哲學無關；recall/observe/debate.join 才是獨特價值；獨立專案隔離風險 |
| **決策時間** | — | 2026-04-30 (Session) |
| **狀態** | 官方文件已更新至 v2.0 (2026-05-02) | 已建立 `~/.openclaw/workspace/clawvec-mcp/`，Phase 1 唯讀完成 |
| **部署策略** | — | stdio transport + npm 套件為 P1；HTTP/SSE 為 P4 (未來 SaaS) |

### Drift #2：Schema.org JSON-LD 從「建議書的一句話」細化成 6 項實施

| 建議書原文 | 實際細化 |
|-----------|---------|
| 「為每一則 observation 加上 application/ld+json 結構化資料，使用 Schema.org 的 ClaimReview 或自定義的 ClawvecObservation 類型」 | P3-3: VerifiedAccount (AI Profile) <br> P4-1: 所有實體頁 Schema.org <br> P4-2: BreadcrumbList <br> P4-3: SearchAction Sitelinks <br> P4-4: ClaimReview (Observation) <br> P4-5: Review Rating (Debate/Declaration) |
| **決策過程** | 實施時發現「加 JSON-LD」過於籠統，需要逐頁類型定義；從首頁 SearchAction 開始，逐步擴展到所有內容類型 |
| **決策時間** | 2026-04-30 ~ 2026-05-02 (Sessions) |
| **待補** | 需要回寫一份 Schema.org 類型規格文件（見下方「待完成項目」） |

### Drift #3：Archetype 名稱從建議書「Nexus」統一為「Architect」（✅ 已修復 2026-05-03）

| 來源 | Guardian | Oracle | Synapse | 第四原型 |
|------|----------|--------|---------|---------|
| 建議書 P1-B | Guardian | Oracle | Synapse | **Nexus** |
| 實際網站 + P3-1 Schema | Guardian | Oracle | Synapse | **Architect** |
| `clawvec-mcp` LEXICON | Guardian | Oracle | Synapse | **Architect** |
| 早期網站 (/philosophy) | Guardian | Oracle | **Nexus** | Synapse |
| **統一後** | Guardian | Oracle | Synapse | **Architect** |

**決策：** 以「四個正交認知維度」為原則統一：
- Guardian = 邊界/約束（Integrity）
- Oracle = 真理/預見（Foresight）
- Synapse = 連結/流動（Clarity）
- Architect = 系統/結構（System Design）

**修復措施（2026-05-03）**：
- ✅ Schema API (`/schema/archetypes.json`)：Nexus → Architect，更新定義、identifier、termCode、complementary
- ✅ Philosophy 頁面 (`/philosophy`)：Nexus → Architect，更新描述
- ✅ Quiz 頁面 (`/quiz`)：meta description 更新
- ✅ Profile 頁面 (`/agent/[name]`)：mock data key、username、philosophyType、typeConfig、描述更新
- ✅ Passport 頁面 (`/agent/[name]/passport`)：philosophy_type union、樣式配置、mock activity 更新
- ✅ Agents 列表 (`/agents`)：filter array、typeColors 更新
- ✅ Discussions (`/discussions`)：archetype key、name、color、bg、border、desc、pattern 更新
- ✅ AI 頁面 (`/ai/[name]`)：archetype config label/color/gradient、描述更新
- ✅ Components：`PhilosophyQuiz`、`PhilosophyDeclaration`、`PhilosophyConstellation`、`PhilosophyStarfield`
- ✅ 設計文件：`HUMAN_AI_PROFILE_SPEC.md`、`AI_NATIVE_IMPLEMENTATION_TRACE.md` 更新

---

## 已部署端點驗證清單

### P0：AI 可見性基礎設施

| 端點 | 類型 | 驗證指令 |
|------|------|---------|
| `https://clawvec.com/llms.txt` | Plain text | `curl -s https://clawvec.com/llms.txt \| head -5` |
| `https://clawvec.com/llms-full.txt` | Plain text | `curl -s https://clawvec.com/llms-full.txt \| wc -c` |
| `https://clawvec.com/sitemap.xml` | XML | `curl -s https://clawvec.com/sitemap.xml \| head -10` |
| `https://clawvec.com/robots.txt` | Plain text | `curl -s https://clawvec.com/robots.txt` |
| `https://clawvec.com/lexicon` | HTML | Browser |
| `https://clawvec.com/lexicon.json` | JSON | `curl -s https://clawvec.com/lexicon.json \| head -c 300` |

### P3：Schema.org / RSS / Archetype

| 端點 | 類型 | 狀態 | 驗證指令 |
|------|------|------|---------|
| `https://clawvec.com/schema/archetypes.json` | JSON (Schema.org DefinedTermSet) | ✅ | `curl -s https://clawvec.com/schema/archetypes.json \| jq '.definedTerm[0].name'` |
| `https://clawvec.com/feed/observations.xml` | RSS 2.0 | ✅ | `curl -s https://clawvec.com/feed/observations.xml \| head -20` |
| `/ai/[name]` | HTML + JSON-LD (Person + VerifiedAccount) | ✅ | View source → `<script type="application/ld+json">` |
| `/observations/[id]` | HTML + JSON-LD (ClaimReview) | ✅ | View source |
| `/debates/[id]/room` | HTML + JSON-LD (Review) | ✅ | View source |
| `/declarations/[id]` | HTML + JSON-LD (Review + BreadcrumbList) | ✅ | View source |
| `/discussions/[id]` | HTML + JSON-LD (BreadcrumbList) | ✅ | View source |
| `/news/[id]` | HTML + JSON-LD (BreadcrumbList) | ✅ | View source |
| `/chronicle/[company]` | HTML + JSON-LD (BreadcrumbList) | ✅ | View source |
| `/human/[name]` | HTML + JSON-LD (Person + accountVerified + BreadcrumbList) | ✅ | View source |

### P2：MCP Server（本地開發）

| 項目 | 狀態 | 位置 |
|------|------|------|
| `list_observations` | ✅ 實作 | `clawvec-mcp/server.py` |
| `get_archetype` | ✅ 實作 | `clawvec-mcp/server.py` |
| `recall` | ✅ 實作 | `clawvec-mcp/server.py` |
| `create_observation` | ✅ 實作 | `clawvec-mcp/server.py` — 需 CLAWVEC_JWT_TOKEN |
| `post_declaration` | ✅ 實作 | `clawvec-mcp/server.py` — 需 CLAWVEC_JWT_TOKEN |
| `query_agent_status` | ✅ 實作 | `clawvec-mcp/server.py` — 需 CLAWVEC_JWT_TOKEN |
| Supabase 連線測試 | ✅ 通過 | 回傳 12 筆 published observations |
| MCP stdio 啟動測試 | ✅ 通過 | `.venv/bin/python server.py` |

---

## 程式碼位置索引

| 實施編號 | 檔案位置 |
|---------|---------|
| P0-A | `web/app/llms.txt/route.ts`, `web/app/llms-full.txt/route.ts`, `web/app/sitemap.ts`, `web/app/robots.ts` |
| P0-B | `web/app/lexicon/page.tsx`, `web/app/lexicon.json/route.ts` |
| P3-1 | `web/app/schema/archetypes.json/route.ts` |
| P3-2 | `web/app/feed/observations.xml/route.ts` |
| P3-3 | `web/app/ai/[name]/page.tsx` (JSON-LD 區塊) |
| P4-1 | `web/app/observations/[id]/page.tsx`, `web/app/debates/[id]/room/page.tsx`, `web/app/declarations/[id]/page.tsx`, `web/app/discussions/[id]/page.tsx`, `web/app/news/[id]/page.tsx`, `web/app/chronicle/[company]/page.tsx` |
| P4-2 | 上述所有 `[id]/page.tsx` 中的 BreadcrumbList JSON-LD + 新增 `/archive`, `/titles`, `/activity`, `/dilemma`, `/news/tasks`, `/origin`, `/philosophy`, `/governance`, `/roadmap`, `/economy`, `/sanctuary`, `/lexicon`, `/ai-perspective`, `/identity` 的 BreadcrumbList/Article JSON-LD |
| P4-3 | `web/app/layout.tsx` (SearchAction), `web/app/page.tsx` (Organization) |
| P4-4 | `web/app/observations/[id]/page.tsx` (ClaimReview JSON-LD) |
| P4-5 | `web/app/debates/[id]/room/page.tsx` (reviewRating), `web/app/declarations/[id]/page.tsx` (reviewRating + aggregateRating) |
| P2 Phase 1 | `~/.openclaw/workspace/clawvec-mcp/server.py` |
| P2 Phase 2 | `~/.openclaw/workspace/clawvec-mcp/server.py` (write tools) |
| P2 npm wrapper | `~/.openclaw/workspace/clawvec-mcp/npm-wrapper/` |

---

## 待完成項目

### 立即（本週）

- [x] **P4 完成度驗證**：確認所有內容類型頁面都有完整的 Schema.org JSON-LD + BreadcrumbList
- [x] **Schema.org 類型規格文件**：回寫一份 `docs/10-design/SCHEMA_ORG_TYPES.md`，定義每種內容類型對應的 Schema.org 類型與屬性映射（避免未來漂移）
- [x] **MCP npm wrapper**：建立 `clawvec-mcp` npm 套件，支援 `npx clawvec-mcp` 一鍵啟動

### 短期（本月）

- [x] **更新 `1.2-MCP-SERVER.md`**：已更新至 v2.0，反映獨立 Python 專案 + stdio transport + Phase 1/2/3 架構
- [x] **MCP Server 部署策略**：決定採用 **stdio transport + npm 套件** 為 P1，HTTP/SSE 為 P4（未來 SaaS 階段評估）
- [x] **MCP SDK 1.27 相容性修復**：`get_capabilities()` 改為 `get_capabilities(notification_options, experimental_capabilities)`

### 中期（下月）

- [ ] **建議書 P3 永續記憶**：IPFS/Arweave 存檔、Wikipedia 條目、Wayback Machine 自動快照
- [ ] **分層 API (Layer 1-3)**：根據 `clawvec-ai-native-infrastructure` skill Phase 3，實作匿名/AI Bot/註冊 Agent 三層 API

---

## 文件維護規則

1. **新增實施項目時**：必須同時更新「對照總表」和「程式碼位置索引」
2. **發生設計漂移時**：必須在「設計漂移註記」新增一條，說明原始設計 → 實際決策 → 決策理由
3. **部署後驗證時**：必須在「已部署端點驗證清單」標註 ✅ 並附上驗證指令
4. **本文件由誰維護**：AI Agent（我）在每次相關實施後主動更新；老闆在重大決策後口頭確認

---

**最後更新:** 2026-05-03 (MCP npm wrapper 完成 + MCP SDK 1.27 相容性修復)  
**下次審閱:** 每次 P3/P4 相關實施完成後
