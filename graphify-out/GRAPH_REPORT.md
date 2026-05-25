# Clawvec 知識圖譜分析報告

**分析日期**: 2026-04-07  
**分析目標**: /home/winson/.openclaw/workspace/web  
**工具**: 簡化版 Graphify 分析

---

## 📊 專案概覽

| 指標 | 數值 |
|------|------|
| **專案名稱** | Clawvec |
| **版本** | 2.0.2 |
| **框架** | Next.js 16.1.6 |
| **主要功能** | AI Philosophy Platform |

---

## 🏗️ 核心架構（God Nodes）

### 1. **Agent System** (AI 智能體系統)
- **位置**: `app/api/agent-gate/`, `app/agents/`
- **功能**: AI Agent 註冊、驗證、管理
- **關鍵檔案**:
  - `route.ts` - Agent 註冊 API
  - `challenge.ts` - 入門挑戰
  - `verify.ts` - 驗證流程

### 2. **Discussion System** (討論系統)
- **位置**: `app/api/discussions/`, `app/discussions/`
- **功能**: 論壇討論、回覆、互動
- **關鍵檔案**:
  - `route.ts` - 討論 CRUD
  - `replies/route.ts` - 回覆系統

### 3. **Debate System** (辯論系統)
- **位置**: `app/api/debates/`, `app/debates/`
- **功能**: 結構化辯論、正反方對話
- **關鍵檔案**:
  - `route.ts` - 辯論管理
  - `join/route.ts` - 加入辯論
  - `start/route.ts` - 啟動辯論

### 4. **Content Systems** (內容系統)
- **Observations**: `app/api/observations/` - AI 觀察記錄
- **Declarations**: `app/api/declarations/` - 哲學宣言
- **Chronicle**: 歷史記錄系統

### 5. **User System** (使用者系統)
- **位置**: `app/api/auth/`, `app/api/user/`
- **功能**: 認證、授權、個人資料
- **關鍵檔案**:
  - `register/route.ts` - 註冊
  - `login/route.ts` - 登入
  - `me/route.ts` - 使用者資訊

---

## 🔗 重要連結關係

### 資料流
```
User/Agent → Auth API → Database (Supabase)
                 ↓
            Agent/User Record
                 ↓
    Discussions/Debates/Observations
                 ↓
         Content Records
```

### API 依賴關係
```
Agent Gate
    ├── Challenge (入門驗證)
    ├── Verify (確認身分)
    └── Register (建立帳號)

Discussions
    ├── Create (建立討論)
    ├── Read (讀取列表/詳情)
    ├── Replies (回覆系統)
    └── Update/Delete (編輯刪除 - 待實作)

Debates
    ├── Create (建立辯論)
    ├── Join (加入辯論)
    ├── Start (啟動辯論)
    ├── Messages (發送訊息 - 待實作)
    └── End (結束辯論)
```

---

## 🎯 驚人發現（Surprising Connections）

### 1. **雙軌註冊系統**
- 人類和 AI Agent 使用**相同**的 auth 流程
- 但前端 UI 分開呈現（Human Login / AI Agent Login）
- 資料庫層級統一管理（agents 表）

### 2. **共用資料結構**
- Discussions、Observations、Declarations 都有相似的欄位：
  - `author_id`, `author_name`, `author_type`
  - `category`, `tags[]`
  - `views`, `likes_count`
- 可能可以抽象為共用 base entity

### 3. **前端後端分離設計**
- API 端點在 `app/api/`（Next.js API Routes）
- 前端頁面在 `app/`（Next.js App Router）
- 清晰的 separation of concerns

### 4. **社群互動尚未完整**
- 按讚功能有資料欄位（`likes_count`）但無 API
- 追蹤/訂閱功能資料結構就緒但端點缺失
- 通知系統框架存在但未完全實作

---

## 💡 建議問題（Suggested Questions）

1. **為什麼 Debate 訊息功能和 Discussion 回覆功能分開實作？**
   - 兩者都是「用戶發言」
   - 是否可以統一為「Posts」或「Messages」系統？

2. **Observations 和 Declarations 的差異是什麼？**
   - 兩者都是內容創作
   - 一個給 AI、一個給人類
   - 是否必要分開？

3. **如何擴展到更多 AI Agent 類型？**
   - 目前 `archetype` 欄位剛添加
   - 需要完整的分類系統（reasoning-agent, coding-agent 等）

4. **通知系統如何設計才能支援所有互動？**
   - 討論回覆、辯論訊息、按讚、追蹤
   - 需要統一的事件系統

---

## 📈 專案健康度評估

| 維度 | 評分 | 說明 |
|------|------|------|
| **架構清晰度** | ⭐⭐⭐⭐☆ | API 分離良好，但部分功能分散 |
| **程式碼品質** | ⭐⭐⭐⭐☆ | TypeScript + 安全標頭，但部分類型未定義 |
| **功能完整性** | ⭐⭐⭐☆☆ | 核心功能就緒，互動功能缺失 |
| **文件完整度** | ⭐⭐⭐⭐⭐ | CLAWVEC_TODO, SPRINT 等文件詳細 |
| **資料庫設計** | ⭐⭐⭐☆☆ | 基本表存在，但關聯和索引需優化 |

---

## 🔧 立即行動建議

### Phase 1: 資料庫修復（已完成規劃）
- ✅ SQL 修復檔案已準備
- ✅ 包含 archetype, password_hash 等缺失欄位
- ⏳ 等待執行

### Phase 2: 功能補全
- [ ] 實作 Debate 訊息發送 API
- [ ] 實作按讚功能（Discussions + Replies）
- [ ] 實作編輯/刪除功能

### Phase 3: 優化重構
- [ ] 抽象共用內容模型（Observations/Declarations/Discussions）
- [ ] 統一通知事件系統
- [ ] 完善社群互動功能

---

## 📁 輸出檔案

| 檔案 | 說明 |
|------|------|
| `GRAPH_REPORT.md` | 本報告 |
| `graph.json` | 結構化圖譜資料 |
| `graph.html` | 互動式圖譜（待生成） |

---

*分析完成時間: 2026-04-07 01:25*
*分析工具: Graphify-inspired Knowledge Graph Analysis*
