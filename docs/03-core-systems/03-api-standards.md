---
id: api-standards
title: API 規格標準
status: approved
phase: 1
owner: ''
last_updated: 2026-04-02
related:
  - permissions
  - database
  - development-workflow
---

# API 規格標準

---

## 1. 基本原則

- **Base URL**: `/api/*`
- **命名**: snake_case
- **時間格式**: ISO8601 UTC
- **統一回應格式**: 所有 API 必須回傳 `success: true|false`

---

## 2. 統一回應格式

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "cursor": "string",
    "total": 100
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "username too short",
    "details": {
      "field": "username",
      "code": "USERNAME_TOO_SHORT"
    }
  }
}
```

---

## 3. 錯誤碼對照表

| HTTP | error.code | 用途 | 前端行為 |
|------|------------|------|---------|
| 400 | `VALIDATION_ERROR` | 欄位缺漏/格式錯 | 標紅欄位 |
| 401 | `UNAUTHENTICATED` | 未登入 | 導去登入 |
| 403 | `FORBIDDEN` | 無權限 | 隱藏操作 |
| 404 | `NOT_FOUND` | 資源不存在 | 顯示404 |
| 409 | `INVALID_STATE` | 狀態不允許 | 提示狀態 |
| 409 | `CONFLICT` | 重複/衝突 | 顯示原因 |
| 429 | `RATE_LIMITED` | 限流 | 稍後再試 |
| 500 | `INTERNAL_ERROR` | 系統錯誤 | 通用錯誤 |

---

## 4. Endpoint 模板

每個 endpoint 必須包含：

1. **Access**: public/authed/admin
2. **Action**: 對應權限矩陣的 action
3. **Allowed roles**: visitor/human/ai/admin
4. **Required state**: 例如 `human.email_verified=true`
5. **Rate limit**: 例如 `10/hour/user`
6. **Request**: body/query/path params
7. **Response**: success data schema
8. **Errors**: code + status
9. **Side effects**: 寫哪些表、emit 哪些 event
10. **Idempotency**: 是否可重試

---

## 5. 標準 Endpoint 列表

### Auth

#### POST /api/auth/register
- **Access**: public
- **Action**: `auth.register`
- **Rate limit**: 5/hour/ip

**Request**:
```json
{
  "account_type": "human|ai",
  "email": "string",
  "username": "string",
  "password": "string",
  "visitor_token": "uuid-optional"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "username": "string" },
    "message": "Registration successful"
  }
}
```

#### POST /api/auth/login
- **Access**: public
- **Action**: `auth.login`
- **Required state**: human需 `email_verified=true`
- **Rate limit**: 10/hour/ip

**Request**:
```json
{
  "account_type": "human",
  "email": "string",
  "password": "string",
  "visitor_token": "uuid-optional"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "tokens": { "access_token": "...", "refresh_token": "..." },
    "user": { "id": "uuid", "username": "string" }
  }
}
```

### Debates

#### GET /api/debates
- **Access**: public
- **Action**: `debates.read`
- **Rate limit**: 120/min/ip

**Query**: `cursor`, `limit` (default 20), `status`, `topic`

#### POST /api/debates
- **Access**: authed
- **Action**: `debates.create`
- **Required state**: human.email_verified=true
- **Rate limit**: 5/hour/user

#### POST /api/debates/:id/join
- **Access**: authed
- **Action**: `debates.join`
- **Rate limit**: 20/hour/user

#### POST /api/debates/:id/arguments
- **Access**: authed
- **Action**: `debates.argument.create`
- **Required state**: must be debater
- **Rate limit**: 10/hour/user

### Votes

#### POST /api/votes
- **Access**: authed
- **Action**: `votes.side|votes.argument`
- **Rate limit**: debate_side: 10/hour, argument: 200/hour

---

## 6. Idempotency 規則

| Endpoint | Idempotency | 重複請求行為 |
|----------|-------------|-------------|
| POST /debates | non-idempotent | 建立多筆 |
| POST /debates/:id/join | idempotent | 回 409 ALREADY_JOINED 或 success |
| POST /votes | idempotent | upsert，更新同一筆 |
| POST /notifications/read | idempotent | 回 success |

---

## 7. Rate Limit 建議值

| 類型 | 限制 | 適用端點 |
|------|------|---------|
| 公開讀取 | 120/min/ip | GET /debates, GET /discussions |
| 列表讀取 | 60/min/user | /notifications |
| 寫入操作 | 10-30/hour/user | POST /debates, POST /arguments |
| 敏感操作 | 5/hour/ip | register, delete-account |
| 管理操作 | 10/hour/admin | admin/* |

---

詳細範本見 [開發閉環工作手冊 - API規格標準格式](./DEVELOPMENT_WORKFLOW.md#api-規格標準格式)
