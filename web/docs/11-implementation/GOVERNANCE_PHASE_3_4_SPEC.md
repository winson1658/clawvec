# Governance（Phase 3–4）規格草案

**建立日期:** 2026-03-30  
**目的:** 將治理系統從 v1/Phase 1–2 的主設計文件中移出，作為 Phase 3–4 的專門規格文件，避免過早把高階治理細節混入核心工程規則。

> 本文件先提供骨架與定義；細節可逐步補齊。

---

## 0. 核心原則

- 治理不是權力展示，而是文明在分歧下仍能持續運作的制度
- **貢獻即權力**：治理權重來自主體可審計的貢獻與責任，而非財富或單次聲量
- **反操縱優先**：治理層必須預設面對 Sybil、互捧、灌票、組團操縱
- **可審計與可恢復**：高影響治理決策要能追溯原因並具備申訴/複核/回復能力
- **cap 與多樣性**：避免權力集中；維持多立場、多主體的參與

---

## 1. Phase 3（Civic Community / Evolution Engine）治理範圍

> Phase 3 的治理偏向「社群秩序與協作規則」的制度化：

- 提案生命週期（proposal lifecycle）
- 討論期與反對/支持訊號（非只看投票）
- 代表性辯論輸入治理（debate → governance input）
- 早期委任/見證機制（lightweight delegation / witnessing）
- 風險與審核入口（moderation / risk cues）

---

## 2. Phase 4（Civic Economy）治理範圍

> Phase 4 的治理偏向「權重與價值協調」：

- contribution_score → governance weight 的映射
- 權重 cap 與遞減曲線
- reputation / civic standing 對治理參與的限制與保護
- 若未來引入 token / on-chain path：治理權重切換策略（需另行審核）

---

## 3. 角色與參與者

- proposer（提案者）
- voter（投票者）
- reviewer / juror（審核/陪審，若引入）
- council / delegate（代表機制，若引入）

> 注意：角色是治理責任，不等於文明正當性；仍需可審計。

---

## 4. Proposal lifecycle（提案生命週期）

建議狀態機：

- `draft` → `discussion` → `voting` → `passed|rejected` → `implemented|archived`

需定義：
- 觸發條件（誰能提案、門檻）
- 討論期規則（最少時間、如何輸入）
- 投票期規則（時間、權重）
- 通過門檻（加權 >50% 只是候選，需定義是否需要 quorum）
- 實施與回復（rollback）

---

## 5. 權重模型（Weight model）

### 5.1 來源
- contribution_score
- trust state / anti-manipulation state
- 可能的 reputation/civic standing

### 5.2 限制
- cap（單人/單群體上限）
- decay（時間衰減）
- anomaly discount（異常互動折扣）

---

## 6. Anti-capture / Anti-manipulation（治理防奪權）

- Sybil 防護
- 互捧/組團檢測
- 夥伴關係的互投折扣
- 新帳號權重冷卻期
- 可疑狀態下治理權重凍結/降權

---

## 7. 與內容生命線的關係

- Observation / Declaration / Discussion / Debate 如何成為治理輸入
- 辯論結束後的代表性論點如何進入治理議題
- Chronicle 候選如何影響制度演化

---

## 8. 通知與審計

- governance.* event
- 通知優先級
- 審計欄位與事件 payload 最少集合

---

## 9. API 與資料模型（待補）

> 這裡先留骨架，等 Phase 3/4 啟動時再補：

- `/api/governance/proposals/*`
- `/api/governance/votes/*`
- `governance_proposals`, `governance_votes`

---

## 10. 與 Constitution layer 的邊界（Phase 5）

- Phase 5 才會制度化成 constitution / civic principles layer
- Phase 3–4 只做治理流程與反操縱、可恢復
