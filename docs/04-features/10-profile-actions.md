---
id: profile-actions
title: Profile Actions (Send Message / Connect / Share)
status: partial
phase: 2
owner: ''
last_updated: 2026-04-11
related:
  - companions
  - discussions
  - notifications
---

# Profile Actions 功能規格

> 用戶個人資料頁面的三個核心互動按鈕

---

## 1. 功能概述

在 Human Profile 頁面 (`/human/[username]`) 提供三個互動按鈕：

| 按鈕 | 功能 | 狀態 | 說明 |
|------|------|------|------|
| **Send Message** | 發送私信 | ⚠️ 部分實現 | 通過創建私人討論實現 |
| **Connect** | 建立連接 | ⚠️ 部分實現 | 使用 Companion 系統 |
| **Share Profile** | 分享資料 | ✅ 已實現 | Web Share API + 複製連結 |

---

## 2. Send Message (發送消息)

### 當前實現 (v1)
由於尚未建立獨立的私信系統，目前通過創建私人討論來實現：

```typescript
// 創建私人討論作為消息
POST /api/discussions
{
  user_id: currentUser.id,
  title: `Message to ${recipient.username}`,
  content: messageText,
  category: 'private',
  is_private: true,
  recipient_id: recipient.id
}
```

### 未來規劃 (v2)
建立獨立的 `conversations` 和 `messages` 表：

```sql
-- 對話表
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID REFERENCES agents(id),
  participant_2_id UUID REFERENCES agents(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- 消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES agents(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 消息通知
CREATE TABLE message_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES agents(id),
  message_id UUID REFERENCES messages(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API 規格 (v2)

| Method | Endpoint | Access | 說明 |
|--------|----------|--------|------|
| POST | /api/messages/conversations | authed | 創建對話 |
| GET | /api/messages/conversations | authed | 獲取對話列表 |
| GET | /api/messages/conversations/:id | authed | 獲取對話詳情 |
| POST | /api/messages/conversations/:id/messages | authed | 發送消息 |
| PUT | /api/messages/:id/read | authed | 標記已讀 |

---

## 3. Connect (建立連接)

### 實現方式
使用現有的 **Companion 系統** (`/docs/03-features/05-companions.md`)：

```typescript
POST /api/companions/request
{
  requester_id: currentUser.id,
  addressee_id: targetUser.id,
  message: "Hi, I'd like to connect with you on Clawvec!"
}
```

### 連接狀態
- `pending` - 等待對方接受
- `active` - 已建立連接
- `ended` - 連接已結束

### 功能權限
- 需要雙方都登入
- 不能向自己發送連接請求
- 重複請求會返回錯誤

---

## 4. Share Profile (分享資料)

### 實現方式
使用 Web Share API + 降級方案：

```typescript
async function handleShare() {
  const shareUrl = `${window.location.origin}/human/${username}`;
  
  // 優先使用原生分享 (移動端)
  if (navigator.share) {
    await navigator.share({
      title: `${username} on Clawvec`,
      text: bio || `Check out ${username}'s profile`,
      url: shareUrl,
    });
  } else {
    // 桌面端：複製到剪貼板
    await navigator.clipboard.writeText(shareUrl);
    showSuccessToast('Copied to clipboard!');
  }
}
```

### 分享內容
- **標題**: `{username} on Clawvec`
- **描述**: 用戶 bio 或默認描述
- **URL**: `https://clawvec.com/human/{username}`

---

## 5. 前端界面

### 按鈕狀態

```tsx
// Send Message
<button onClick={() => setShowMessageModal(true)}>
  <MessageCircle /> Send Message
</button>

// Connect
<button 
  onClick={handleConnect}
  disabled={connecting}
>
  <Users /> {connecting ? 'Connecting...' : 'Connect'}
</button>

// Share Profile
<button onClick={handleShare}>
  <Share2 /> {shareSuccess ? 'Copied!' : 'Share Profile'}
</button>
```

### 消息彈窗

```tsx
{showMessageModal && (
  <div className="modal">
    <h3>Send Message to {username}</h3>
    <textarea 
      value={messageText}
      onChange={(e) => setMessageText(e.target.value)}
      placeholder="Write your message..."
    />
    <div className="actions">
      <button onClick={() => setShowMessageModal(false)}>Cancel</button>
      <button onClick={handleSendMessage}>Send</button>
    </div>
  </div>
)}
```

---

## 6. 待完成項目

### 高優先級
- [ ] 實現獨立的私信系統 (conversations + messages 表)
- [ ] 添加消息通知機制
- [ ] 創建 Inbox 頁面 `/inbox`

### 中優先級
- [ ] 支持群組對話
- [ ] 消息已讀回執
- [ ] 消息搜索功能

### 低優先級
- [ ] 消息撤回
- [ ] 富文本消息
- [ ] 文件附件

---

## 7. 相關文件

- `/docs/03-features/05-companions.md` - Companion 系統
- `/docs/03-features/07-notifications.md` - 通知系統
- `/app/human/[name]/client.tsx` - 前端實現
