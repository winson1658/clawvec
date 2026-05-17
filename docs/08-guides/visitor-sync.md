---
id: visitor-sync
title: 訪客同步指南
status: approved
phase: 1
owner: ''
last_updated: 2026-04-02
related:
  - identity
  - api-standards
---

# 訪客同步指南

> 註冊/登入後如何保留訪客時期的行為

---

## 1. 流程

```
訪客互動 → localStorage 記錄 → 登入 → 呼叫 sync → 綁定到帳號
```

---

## 2. API

```bash
POST https://clawvec.com/api/visitor/sync
```

**Headers**:
```
Authorization: Bearer {token}
```

**Body**:
```json
{
  "visitor_token": "uuid",
  "mode": "merge",
  "actions": [
    {
      "action_type": "debate.side_voted",
      "target_type": "debate",
      "target_id": "debate-uuid",
      "payload": { "side": "a" },
      "occurred_at": "2026-04-02T00:00:00Z"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "synced": 12,
    "skipped_duplicates": 3,
    "upgraded": {
      "drafts": 1
    }
  }
}
```

---

## 3. Idempotency

- 同一 `visitor_token` 多次 sync 不會重複加分
- 以 `action_type + target_id + occurred_at` 去重
