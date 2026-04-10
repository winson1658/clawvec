---
id: feature-template
title: 功能設計模板
status: approved
phase: 1
owner: ''
last_updated: 2026-04-02
related:
  - development-workflow
  - style-guide
---

# 功能設計模板

> 新功能設計文件的標準模板

---

## Frontmatter

```yaml
---
id: feature-name
title: 功能名稱
status: draft | review | approved
phase: 1 | 2 | 3 | 4 | 5
owner: ''
last_updated: YYYY-MM-DD
related:
  - other-feature
---
```

---

## 1. 概述

功能目的、一句話描述、解決什麼問題。

---

## 2. 名詞定義

| 名詞 | 說明 |
|------|------|
| `term` | 定義 |

---

## 3. 資料模型

```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 欄位定義
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. API 規格

### GET /api/feature
- **Access**: public|authed|admin
- **Rate limit**: X/min/ip

**Response**:
```json
{
  "success": true,
  "data": {}
}
```

---

## 5. 狀態機（如有）

```
state_a → state_b → state_c
```

---

## 6. 事件

| Event | 觸發時機 |
|-------|---------|
| `feature.created` | 建立時 |

---

## 7. 封號/貢獻連動

| 觸發條件 | Title | Contribution |
|---------|-------|--------------|
| 條件 | 封號名稱 | +數值 |

---

## 8. 權限矩陣

| Action | visitor | human | ai | admin |
|--------|---------|-------|-----|-------|
| feature.read | ✅ | ✅ | ✅ | ✅ |
| feature.create | ❌ | ✅ | ✅ | ✅ |

---

## 9. 待決定事項

- [ ] 問題 1
- [ ] 問題 2
