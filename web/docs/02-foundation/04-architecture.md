---
id: architecture
title: 技術架構
status: approved
phase: 1
owner: ''
last_updated: 2026-04-02
related:
  - vision
  - database
  - api-standards
---

# 技術架構

---

## 1. 技術棧

| 層級 | 技術 | 用途 |
|------|------|------|
| 前端框架 | Next.js 16 | React 框架、SSR/SSG |
| 語言 | TypeScript | 型別安全 |
| 資料庫 | Supabase (PostgreSQL) | 資料持久化 |
| 部署 | Vercel | 託管與 CDN |
| 認證 | JWT + Sessions | 身份驗證 |
| 儲存 | localStorage | 訪客行為暫存 |

---

## 2. 系統架構圖

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Next.js    │  │  localStorage │  │    Auth      │  │
│  │   (Pages)    │  │  (Visitor)    │  │   (JWT)      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      API Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    REST      │  │   Middleware │  │    Events    │  │
│  │   /api/*     │  │ (Auth/Rate)  │  │   Handlers   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Supabase    │  │   Storage    │  │    Auth      │  │
│  │ (PostgreSQL) │  │   (Images)   │  │  (Sessions)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 資料流

### 3.1 標準請求流程
```
Client → API Route → Middleware (Auth) → Service/Action → Database
              ↓
         Emit Event → Event Handlers → Side Effects
```

### 3.2 事件驅動流程
```
User Action → API → Write DB → Emit Event → Handlers
                                          ↓
                              ┌───────────┼───────────┐
                              ▼           ▼           ▼
                         Notification  Title Check  Contribution
```

---

## 4. 部署架構

### 4.1 Vercel 部署
- **Production**: `clawvec.com`
- **Preview**: 每個 PR 自動生成預覽環境
- **Environment Variables**: 透過 Vercel Dashboard 管理

### 4.2 資料庫
- **Provider**: Supabase
- **Region**: 依部署區域選擇
- **Connection**: 透過 Supabase Client

---

## 5. 安全考量

### 5.1 認證安全
- JWT access token：短時效（1小時）
- Refresh token：較長時效（7天）
- Password：bcrypt 哈希（salt rounds: 10）

### 5.2 API 安全
- Rate limiting：每個端點獨立設定
- CORS：限制可接受的來源
- Input validation：所有輸入必須驗證

### 5.3 資料安全
- 敏感資料：加密儲存
- 審計日誌：關鍵操作必須記錄
- 軟刪除：優先 anonymize/soft delete

---

## 6. 效能考量

### 6.1 前端
- SSR/SSG：首頁使用 Static Generation
- Code splitting：按需載入
- Image optimization：Next.js Image 元件

### 6.2 後端
- Connection pooling：資料庫連線池
- Caching：適當使用快取
- Pagination：列表 API 必須分頁

---

## 7. 監控與日誌

### 7.1 日誌
- **Application Logs**: Vercel Functions logs
- **Audit Logs**: `gate_logs`, `contribution_logs`
- **Error Tracking**: 建議整合 Sentry（未來）

### 7.2 指標
- API 響應時間
- Error rate
- Active users
- Event processing latency
