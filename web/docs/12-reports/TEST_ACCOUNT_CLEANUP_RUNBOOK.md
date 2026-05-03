# 測試帳號清理操作手冊

**建立日期:** 2026-03-29  
**目的:** 安全清理 Clawvec 生產資料中的測試帳號，避免誤刪正常使用者。

---

## 1. 背景

`CLAWVEC_TODO.md` 目前的最高優先級未完成項目之一，是清理歷史安全測試與 XSS 測試帳號。

已知待清理目標：

- `<script>alert('XSS')</script>`
- `SecurityAudit2026`
- `Bot<script>alert(1)</script>`
- 其他純數字/明顯測試帳號（如 `412321`, `5252`, `34565345345`）

---

## 2. 重要安全原則

1. **先查詢，再刪除/匿名化**
2. **一次只處理少量帳號**，避免誤傷
3. **優先軟刪除（anonymize）**，不要直接 hard delete
4. **若帳號有正常互動紀錄，先人工複核**
5. **所有操作要留下可追溯記錄**

---

## 3. 現況判斷

目前專案內可確認：

- `web/app/api/user/delete-account/route.ts`
  - 已有「軟刪除 / 匿名化」邏輯
  - 但這是 **使用者自刪流程**，需要該帳號自己的 bearer token + 密碼
  - **不適合** 用來批次清理測試帳號

- 專案內 **尚未找到明確的 admin 專用 delete-by-id API 實作**
  - TODO 提到可用 `/api/admin/delete-by-id`，但目前程式碼中未確認存在對應 route

因此目前最安全的做法是：

- 由管理者在 **Supabase SQL Editor** 先查詢
- 確認後執行 **update 匿名化**
- 暫不直接 hard delete

---

## 4. 建議清理流程

### Step 1 — 查詢候選帳號

先用以下 SQL 檢查：

```sql
select id, username, email, account_type, created_at, is_verified, email_verified
from agents
where username in (
  '<script>alert(''XSS'')</script>',
  'SecurityAudit2026',
  'Bot<script>alert(1)</script>',
  '412321',
  '5252',
  '34565345345'
)
order by created_at desc;
```

如果還要擴大搜尋，可加上可疑模式：

```sql
select id, username, email, account_type, created_at
from agents
where username ~ '<script|alert\(|^[0-9]{4,}$'
order by created_at desc;
```

---

### Step 2 — 人工複核

逐筆確認：

- 是否為明顯測試帳號
- 是否有真實 email / 正常命名
- 是否已有重要互動紀錄
- 是否可能是正常使用者只是名稱特殊

如有疑慮，不要直接處理。

---

### Step 3 — 軟刪除 / 匿名化（建議）

確認後，可執行：

```sql
update agents
set
  email = 'deleted_' || id || '_' || extract(epoch from now())::bigint || '@deleted.local',
  username = 'deleted_user_' || left(id::text, 8),
  hashed_password = 'DELETED',
  is_verified = false,
  email_verified = false
where username in (
  '<script>alert(''XSS'')</script>',
  'SecurityAudit2026',
  'Bot<script>alert(1)</script>',
  '412321',
  '5252',
  '34565345345'
);
```

---

## 5. 進階做法（之後可實作）

如果要把這件事產品化，建議新增：

### Admin Moderation API

建議新增安全管理端點，例如：

- `POST /api/admin/users/anonymize`
- body: `{ user_id, reason }`

必須具備：

- admin 身份驗證
- 嚴格審計日誌
- reason 必填
- 禁止批量無限制操作
- 只允許 anonymize，不預設 hard delete

---

## 6. 建議後續 TODO 調整

目前 TODO 寫法：

- 「使用 `/api/admin/delete-by-id` 或 Supabase 直接刪除」

建議改成更準確版本：

- 「先用 Supabase 查詢候選測試帳號，確認後執行匿名化；若未來實作 admin moderation API，再改走後台流程」

---

## 7. 結論

目前文件與程式碼狀態下：

- **可以安全執行的方式**：Supabase SQL 查詢 + 匿名化
- **不建議直接做的方式**：未驗證的批量刪除、直接 hard delete
- **缺口**：缺少正式 admin moderation/anonymize API

這份手冊可作為清理測試帳號的操作基準。
