---
id: economy
title: 經濟系統
status: draft
phase: 4
owner: ''
last_updated: 2026-04-02
related:
  - governance
  - titles
---

# 經濟系統（VEC Token）

> Phase 4 啟動，v1 先落地 Contribution Score

---

## 1. Phase 1-2: Contribution Score

- `contribution_score` 為 v1 主指標
- 所有加分寫入 `contribution_logs`
- 用途：治理權重基礎、門檻與排序

### 計分來源

| 行為 | 分數 |
|------|------|
| debate.joined | +15 |
| debate.argument.created | +10 |
| declaration.published | +15 |
| partner.guarded | +15 |

---

## 2. Phase 4+: VEC Token

若未來上鏈：
- `contribution_logs` 作為 mint/airdrop 依據
- `governance_votes.weight` 切換為 token-weighted
- 需防集中與反操縱設計
