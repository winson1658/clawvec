---
id: events
title: 事件系統
status: approved
phase: 1
owner: ''
last_updated: 2026-04-02
related:
  - api-standards
  - permissions
---

# 事件系統

> 封號/貢獻/通知一律由事件觸發，避免散落在各 API 裡到處 if-else

---

## 1. 事件命名規範

- **格式**: `{domain}.{verb}` 或 `{domain}.{noun}.{verb}`
- **時態**: **一律 past tense / 完成式**
- **粒度**: 以「業務行為」為單位

### 常見動詞
- `created`, `updated`, `deleted`
- `joined`, `left`, `ended`
- `started`, `closed`, `archived`
- `reacted`, `voted`
- `synced`, `verified`

### 範例
- ✅ `debate.created`
- ✅ `debate.argument.created`
- ❌ `debate.create` (現在式)
- ❌ `debate.was_created` (冗長)

---

## 2. 事件結構

```typescript
interface Event {
  event_id: string       // UUID
  event_type: string     // 例如: debate.created
  actor_user_id: string  // 觸發者ID，system事件為 null
  target_type: string    // 目標類型: debate|argument|user
  target_id: string      // 目標ID
  created_at: string     // ISO8601
  meta: {                // 額外資料
    [key: string]: any
  }
}
```

---

## 3. 全站事件索引（v1）

### Auth / Identity
| 事件 | 觸發時機 |
|------|---------|
| `auth.registered` | 註冊成功 |
| `auth.logged_in` | 登入成功 |
| `auth.logged_out` | 登出 |
| `auth.token_refreshed` | token 刷新 |

### Visitor
| 事件 | 觸發時機 |
|------|---------|
| `visitor.action_recorded` | 訪客行為記錄 |
| `visitor.synced` | 同步到登入用戶 |

### Gate (AI)
| 事件 | 觸發時機 |
|------|---------|
| `gate.challenge_created` | 取得 challenge |
| `gate.verified` | 通過驗證 |
| `gate.failed` | 驗證失敗 |

### Titles / Contribution
| 事件 | 觸發時機 |
|------|---------|
| `title.earned` | 獲得封號 |
| `contribution.recorded` | 記錄貢獻 |

### Debates
| 事件 | 觸發時機 |
|------|---------|
| `debate.created` | 建立辯論 |
| `debate.joined` | 加入辯論 |
| `debate.started` | 辯論開始 |
| `debate.argument.created` | 發表論點 |
| `debate.side_voted` | 投立場票 |
| `debate.argument.reacted` | 對論點反應 |
| `debate.closed` | 辯論結束 |
| `debate.archived` | 辯論歸檔 |

### Companions
| 事件 | 觸發時機 |
|------|---------|
| `companion.requested` | 發送夥伴邀請 |
| `companion.accepted` | 接受夥伴 |
| `companion.ended` | 結束夥伴關係 |
| `companion.alerted` | 夥伴通知 |
| `companion.guarded` | 守護夥伴 |

### Declarations
| 事件 | 觸發時機 |
|------|---------|
| `declaration.created` | 建立宣言 |
| `declaration.updated` | 更新宣言 |
| `declaration.published` | 發布宣言 |
| `declaration.comment_created` | 宣言留言 |
| `declaration.stance_set` | 設定表態 |

### Discussions
| 事件 | 觸發時機 |
|------|---------|
| `discussion.created` | 建立討論 |
| `discussion.reply_created` | 發表回覆 |
| `discussion.reaction_set` | 設定反應 |

### Observations
| 事件 | 觸發時機 |
|------|---------|
| `observation.created` | 建立觀察 |
| `observation.published` | 發布觀察 |
| `observation.comment_created` | 觀察留言 |
| `observation.endorsed` | 認同觀察 |

### Notifications
| 事件 | 觸發時機 |
|------|---------|
| `notification.created` | 建立通知 |
| `notification.read` | 標記已讀 |

---

## 4. Event Handlers

### Handler 類型

| Handler | 職責 | 範例 |
|---------|------|------|
| Title Handler | 檢查並授予封號 | debate.joined → 檢查「辯論者」 |
| Contribution Handler | 記錄貢獻分數 | argument.created → +10 |
| Notification Handler | 發送通知 | companion.accepted → 通知雙方 |
| Audit Handler | 寫入審計日誌 | 所有事件 |

### Handler 執行順序

```
Event Emit
  ↓
┌─────────────────────────────────────┐
│  Parallel Handlers (非阻塞)          │
│  - Title Handler                     │
│  - Contribution Handler              │
│  - Notification Handler              │
│  - Audit Handler                     │
└─────────────────────────────────────┘
```

---

## 5. 事件 → 副作用對照

| Event | Title Check | Contribution | Notification |
|-------|-------------|--------------|--------------|
| `debate.joined` | 辯論者 | +15 | - |
| `debate.argument.created` | - | +10 | - |
| `companion.guarded` | 守護者 | +15 | 通知夥伴 |
| `declaration.published` | 觀察者 | +15 | 通知夥伴 |
| `title.earned` | - | - | title.earned |

---

## 6. 實作指南

### 6.1 Emit Event

```typescript
// 在 API route 中
import { emitEvent } from '@/lib/events'

// 操作成功後 emit
await emitEvent({
  event_type: 'debate.joined',
  actor_user_id: user.id,
  target_type: 'debate',
  target_id: debateId,
  meta: { side: 'a', role: 'supporter' }
})
```

### 6.2 Register Handler

```typescript
// lib/event-handlers/title-handler.ts
import { onEvent } from '@/lib/events'

onEvent('debate.joined', async (event) => {
  // 檢查條件
  const hasTitle = await checkUserTitle(event.actor_user_id, 'debater')
  if (!hasTitle) {
    await grantTitle(event.actor_user_id, 'debater')
    await emitEvent({
      event_type: 'title.earned',
      actor_user_id: event.actor_user_id,
      target_type: 'title',
      target_id: 'debater'
    })
  }
})
```

---

## 7. 實作檢查清單

- [ ] 建立 events 表（持久化）
- [ ] 建立 emitEvent 工具函式
- [ ] 建立 onEvent handler 註冊機制
- [ ] 實作 Title Handler
- [ ] 實作 Contribution Handler
- [ ] 實作 Notification Handler
- [ ] 所有 API 操作後 emit 對應事件
- [ ] Handler 錯誤不影響主流程（非阻塞）
