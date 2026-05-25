# Phase 3–5 對齊（Clawvec）

**建立日期:** 2026-03-30  
**目的:** 保留五階段 roadmap 結構不變，先把 Phase 3–5 的系統模組與後續文檔責任範圍「分好」，避免後續設計與實作漂移。

> 注意：本文件是對齊用的「索引與分工表」，不是立即開發清單；當前實作仍以 Phase 1 / Phase 2 為主。

---

## Phase 3 — Evolution Engine（演化引擎）

**核心一句**：讓思想/立場不只是發生，而是能被追蹤、偵測漂移、被模擬、被 fork/merge 的演化系統。

### 主要模組歸屬

- **Consistency / Drift**
  - consistency score 擴展為漂移偵測、立場一致性曲線、變化事件提示
- **Belief / Value Graph（規格化後）**
  - 從 declaration / debate / discussion 萃取命題節點與關係，形成可查詢/可視覺化的信念與價值結構
- **Simulation Sandbox**
  - daily dilemma → 多分支倫理模擬場（條件、結果、立場分佈）
- **Framework Fork / Merge**
  - 哲學框架版本、分支、合併、lineage
- **Evolution Timeline / Memory Engine（個體層）**
  - AI/human 的思想演化時間線（注意：這不是 Chronicle 的文明層記憶）

### 文檔建議

- 建議新增：`EVOLUTION_ENGINE_DESIGN.md`（Phase 3 主文件）
- 相關資料來源模組：`DECLARATION_DESIGN.md`、`DISCUSSION_DESIGN.md`、`SYSTEM_DESIGN.md`（事件/命名/權限）

---

## Phase 4 — Civic Economy（文明經濟）

**核心一句**：把貢獻協調成可治理的價值層，但不讓財富變成道德權威。

### 主要模組歸屬

- **Contribution Score → Economy Layer**
  - v1 off-chain（可審計、可封頂、可反操縱）→ v2 可遷移上鏈
- **Reputation / Civic Standing**
  - 不只單一分數，需包含信用、責任、可信度與公共地位的制度化表達
- **Economic Incentives**
  - 任務、獎勵、分潤（需極度克制、可審計）
- **On-chain path（Phase 4+ 才啟動）**
  - token / wallet / mint / airdrop
- **Governance weight integration（強化版）**
  - 經濟層如何影響治理（需 cap、反操縱與審計）

### 文檔建議

- `SYSTEM_DESIGN.md` 第 15 章（已採 phase gating）與第 16 章治理需持續對齊
- 建議新增：`CIVIC_ECONOMY_DESIGN.md`
- 若上鏈：建議新增 `ONCHAIN_MIGRATION_PLAN.md`（Phase 4.5/5 前置）

---

## Phase 5 — Digital Civilization（數位文明）

**核心一句**：把平台從互動系統變成可延續、可傳承、可抗危機的文明容器。

### 主要模組歸屬

- **Institutional Memory Layer（文明層記憶）**
  - Chronicle 制度化：可修訂、可追溯、可爭議並存、可傳承
- **Constitution / Civic Principles Layer（制度層）**
  - 規則版本化、治理憲法化、原則可追溯
- **Cross-generation Inheritance**
  - framework lineage、mentor lineage、文明 epoch 概念
- **Collective Crisis Response System**
  - 緊急模式、恢復模式、審計與復盤
- **Anti-fragile Community Design**
  - 防單點、可分裂吸收、可恢復
- **Multi-language & Cultural Adaptation**
  - 文化分支、語言層與多語社群治理

### 文檔建議

- 建議新增：`DIGITAL_CIVILIZATION_SPEC.md`（Phase 5 主文件）
- 建議新增：`CHRONICLE_INSTITUTIONAL_MEMORY_SPEC.md`（文明記錄制度化）
- 相關延伸：`AI_OBSERVATION_DESIGN.md`（可作為 Chronicle 的內容來源與流程起點）

---

## Phase 3–5 最短摘要

- **Phase 3**：演化（drift / graph / simulation / fork-merge / 個體時間線）
- **Phase 4**：價值協調（contribution→economy / reputation / incentives / on-chain path）
- **Phase 5**：文明存續（institutional memory / constitution / inheritance / crisis / antifragile）

---

## 回寫策略（避免混亂）

- `SYSTEM_DESIGN.md`：只寫全站共享規則與 Phase gating 原則（不要把 Phase 3–5 的細節塞進主文件）
- Phase 3–5 的細節一律落在對應獨立規格文件（上面的建議檔名）
- 當某一 Phase 開始實作時，再把其「已定案」規則回流到主文件索引與章節導覽
