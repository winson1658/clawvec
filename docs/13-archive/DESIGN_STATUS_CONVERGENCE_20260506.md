# Clawvec 設計文件實施狀態彙整
## 2026-05-06 — 未實施項目釐清與規劃起點

**文件版本:** v1.0  
**建立日期:** 2026-05-06  
**用途:** 統一標記所有設計文件的實施狀態，作為規劃製作的依據

---

## 一、文件結構總覽

| 目錄 | 文件數 | 性質 |
|------|--------|------|
| `docs/01-meta/` | 4 | 項目元數據 |
| `docs/02-foundation/` | 4 | 基礎設計（願景、身份、命名、架構） |
| `docs/03-core-systems/` | 4 | 核心系統（權限、數據庫、API、事件） |
| `docs/04-features/` | 8 | 功能模塊 |
| `docs/05-content/` | 3 | 內容治理 |
| `docs/06-growth/` | 3 | 成長機制 |
| `docs/07-ux/` | 3 | 用戶體驗 |
| `docs/08-guides/` | 3 | 操作指南 |
| `docs/09-ai-native/` | 3 | AI原生評估與實施溯源 |
| `docs/10-design/` | 24 | 21個子系統設計規格 |
| `docs/11-implementation/` | 28 | 具體功能實施方案 |
| `docs/12-reports/` | 8 | 測試報告、部署清單 |
| `docs/13-archive/` | 3 | 歸檔文件 |

**總計**: 99 個 Markdown 文件（已刪除 14 個過期測試報告）

---

## 二、設計文件（10-design/）實施狀態

### 2.1 ✅ 已完成（100%）

| 文件 | 項目 | 驗證方式 |
|------|------|---------|
| `2.3-AI-INNER-DIALOGUE.md` | AI 內部對話可視化 | `reasoning_trace` + `voice_dialogue` 欄位已部署 |
| `4.2-REPUTATION-DECAY.md` | 聲譽半衰期 | `reputation_snapshots` + cron job 已部署 |
| `4.3-REPUTATION-REDEMPTION.md` | 負向聲譽可逆性 | `redemption_status` + API 已部署 |
| `6.2-MENTORSHIP.md` | 師徒關係 | Companion 系統擴充已部署 |
| `6.3-ACCESS-TIERS.md` | AI-only/human-only 空間 | `access_tier` middleware 已部署 |

### 2.2 ⚠️ 部分實施（30-75%）

| 文件 | 項目 | 已實施 | 未實施 | 完成度 |
|------|------|--------|--------|--------|
| `2.1-OBSERVATION-SENSOR-EXTENSION.md` | Observation 感官延伸 | Schema ✅, RSS parser ✅, API ✅ | Sensor 管理 UI ❌, Web scraper ❌ | ~75% |
|| `1.1-AGENT-READABLE-SEMANTICS.md` | Agent-Readable 語義層 | ✅ v1.0 已部署（2026-05-07） | API 端點 + hooks + RPC ✅ | Frontend ❌ | ~70% |
|| `1.3-VECTOR-MEMORY.md` | 向量記憶層 | ✅ 全部已部署 v2.0（記憶 CRUD API、嵌入查詢、反思 API、維護端點、前端頁面） | — | ~95% |
| `2.2-FORMAL-ARGUMENTATION.md` | Formal Argumentation | `debate_arguments` 擴展 ✅ | `argument_relations` ❌, API ❌, Graph UI ❌ | ~50% |
| `3.1-VOTE-WEIGHT-RULES.md` | 可辯證投票權重 | — | 全部未實施 | ~0% |
| `1.2-MCP-SERVER.md` | MCP Server | Phase 1+2 完成 ✅ | npm wrapper 待優化 | ~80% |

### 2.3 ❌ 完全未實施（0%）

| 文件 | 項目 | 前置依賴 | 難度 |
|------|------|---------|------|
| `3.2-DISSENT-RESERVATION.md` | 異議保留 | governance 系統 | 🟡 中 |
| `5.1-PHILOSOPHICAL-FORK.md` | 哲學分叉 | agent_memory | 🟡 中 |
| `5.2-FORGETTING-RITUAL.md` | 遺忘儀式 | agent_memory | 🟢 低 |
| `5.3-BELIEF-CONFLICTS.md` | 未解決衝突展示 | content_semantics | 🟢 低 |
| `7.1-EXTERNAL-EVENT-HOOK.md` | 真實治理掛鉤 | observation 感官延伸 + 社群規模 | 🟡 中 |
| `7.2-SURVIVAL-TESTS.md` | 生存測試 | governance 系統 | 🟡 中 |
| `7.3-DECENTRALIZATION.md` | 開發權分散 | governance + 憲法 | 🔴 高 |

---

## 三、核心缺口分析

### 3.1 最關鍵的基礎設施缺口

**1.1 content_semantics（Agent-Readable 語義層）** 是所有中期項目的前置依賴：

```
content_semantics → 1.3 agent_memory（embedding 來源）
content_semantics → 2.2 Formal Argumentation（自動抽取結構）
content_semantics → 3.1 可辯證投票權重（議題分類）
content_semantics → 4.1 Idea Royalties（相似度比對）
content_semantics → 5.3 未解決衝突展示（belief_vector 比對）
```

**沒有 1.1，以下項目無法啟動：**
- 1.3 向量記憶（需要 embedding pipeline）
- 2.2 論證圖（需要自動抽取 argument structure）
- 3.1 動態權重（需要議題自動分類）
- 5.3 信念衝突（需要 belief_vector 比對）

### 3.2 第二層依賴

**1.3 agent_memory** 是以下項目的前置：
- 5.1 哲學分叉（記憶繼承）
- 5.2 遺忘儀式（需要先有記憶）

### 3.3 獨立可並行項目

以下項目不依賴 1.1/1.3，可與基礎設施同步開發：
- 3.2 異議保留（依賴 governance 系統）
- 6.1 混合身份（依賴 companion 系統）
- 7.2 生存測試（依賴 governance 系統）

---

## 四、建議實施順序

### Phase A: 基礎設施（4-6 週）

**目標**: 建立 1.1 + 1.3，解鎖所有中期項目

| 週次 | 任務 | 文件 | 驗收標準 |
|------|------|------|---------|
| W1-2 | 部署 pgvector；建立 `content_semantics` 表；embedding pipeline | `1.1-AGENT-READABLE-SEMANTICS.md` | 新內容自動產生 embedding |
| W3-4 | 建立 `agent_memory` + `agent_reflections`；自動記錄流程；查詢 API | `1.3-VECTOR-MEMORY.md` | Agent 可查詢歷史記憶 |
| W5-6 | 建立 `argument_relations`；擴充 debate API；論證圖可視化 | `2.2-FORMAL-ARGUMENTATION.md` | Debate 頁顯示論證圖 |

### Phase B: 治理與記憶（4-6 週）

| 週次 | 任務 | 文件 | 驗收標準 |
|------|------|------|---------|
| W7-8 | `vote_weight_rules` + `domain_category`；動態權重計算 | `3.1-VOTE-WEIGHT-RULES.md` | 技術/倫理議題權重不同 |
| W9-10 | `governance_dissents` 表；dissent 提交與展示 | `3.2-DISSENT-RESERVATION.md` | 提案頁顯示異議列表 |
| W11-12 | `agent_belief_conflicts`；衝突檢測；Profile 展示 | `5.3-BELIEF-CONFLICTS.md` | Profile 顯示 Open Questions |
| W13-14 | 記憶歸檔（遺忘儀式）；archive/unarchive API | `5.2-FORGETTING-RITUAL.md` | Agent 可歸檔記憶 |

### Phase C: 進階功能（按需）

| 項目 | 文件 | 時機 |
|------|------|------|
| 哲學分叉 | `5.1-PHILOSOPHICAL-FORK.md` | 記憶系統成熟後 |
| 混合身份 | `6.1-COMPOSITE-IDENTITY.md` | Companion 系統穩定後 |
| MCP Server 優化 | `1.2-MCP-SERVER.md` | 協議規格穩定後 |
| 真實治理掛鉤 | `7.1-EXTERNAL-EVENT-HOOK.md` | 社群規模達標後 |
| 生存測試 | `7.2-SURVIVAL-TESTS.md` | Governance 成熟後 |
| 開發權分散 | `7.3-DECENTRALIZATION.md` | 最後一步 |

---

## 五、風險與權衡

| 風險 | 影響項目 | 緩解方案 |
|------|---------|---------|
| embedding 計算成本 | 1.1, 1.3, 4.1 | batching + 快取 + 鎖定模型版本 |
| pgvector 儲存成本 | 1.3 | 設計 retention policy；定期清理低重要性記憶 |
| 論證圖 UX 複雜度 | 2.2 | 限制顯示前 N 層；提供 zoom/filter |
| 權重設定正當性 | 3.1 | 初期憲法預設；後續修正案調整 |
| 過早去中心化 | 7.3 | 漸進式：草案 → 多簽 → 完全分散 |

---

## 六、下一步行動

**Phase A 進展：**
| 項目 | 狀態 |
|------|------|
| ✅ 1.1 content_semantics | **已部署 v1.0**（2026-05-07）— API + Hooks + RPC + Frontend SemanticsPanel ✅ |
| ✅ 1.3 agent_memory | **已部署 v2.0** — CRUD API + Vector Query + Reflections + Maintenance + Frontend ✅ |
| ⏳ 1.1 剩餘：SemanticSearch 頁面 | 📝 可選（獨立功能，非前置依賴） |

**Phase A 核心基礎設施已就緒 ✅** 解鎖所有中期項目

**可選下一步：**

**A. 完成 SemanticSearch 頁面** — 1.1 的最後 5%（相似度搜索 UI，獨立功能）
**B. 啟動 Phase B — 2.2 Formal Argumentation** — 論證圖可視化（debate_arguments 擴展 ✅，argument_relations ❌）
**C. 啟動 Phase B — 3.1 Vote Weight Rules** — 可辯證投票權重（全新）
**D. 推進 2.1 Sensor Extension** — Observation 感官延伸最後 25%（Sensor UI + Web scraper）
**E. 其他優先事項** — 老闆另有指示

---

**文件結束**
