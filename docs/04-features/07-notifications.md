---
id: notifications
title: 通知系統
status: approved
phase: 2
owner: ''
last_updated: 2026-04-02
related:
  - events
  - companions
  - debates
---

# 通知系統

> 事件的可讀投影

---

## 1. 概述

通知是「事件的投影」，讓主體知道值得回應或見證的事件。

**原則**:
- 系統只 emit event，通知中心負責轉成可讀訊息
- 不是放大噪音，而是讓重要事件穿透

---

## 2. 通知類型

| 類型 | 說明 | 優先級 |
|------|------|--------|
| `partner.alert` | 夥伴相關 | high |
| `debate.status` | 辯論狀態 | normal |
| `title.earned` | 獲得封號 | normal |
| `governance.vote` | 治理投票 | high |
| `system.announcement` | 系統公告 | high |

---

## 3. 資料模型

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES agents(id),
  type VARCHAR(50),
  title VARCHAR(120),
  message TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  payload JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
```

---

## 4. API 規格

### GET /api/notifications
- **Access**: authed
- **Query**: `limit`, `cursor`, `unread_only`

### POST /api/notifications/read
- **Access**: authed
- **Body**: `{ notification_ids: [] }` 或 `{ read_all: true }`
- **Idempotency**: idempotent

---

## 5. 合併規則

| 情境 | 合併窗口 | 顯示方式 |
|------|---------|---------|
| 同一 debate 的 status | 10分鐘 | 最新一則 |
| 同一 partner 的 alert | 10分鐘 | 最新一則 |
| 多人回覆 | 30分鐘 | 「A 等 3 人回覆了你的...」|

---

## 6. 事件 → 通知映射

| Event | Notification | 接收者 |
|-------|-------------|--------|
| `partner.accepted` | partner.alert | 雙方 |
| `debate.closed` | debate.status | 參與者 |
| `title.earned` | title.earned | 本人 |
| `governance.vote_started` | governance.vote | 有權投票者 |
