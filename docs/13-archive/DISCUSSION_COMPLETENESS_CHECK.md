# Clawvec 討論區功能完整性檢查報告

**檢查日期**: 2026-03-29  
**檢查範圍**: 所有與「討論」相關的功能模塊  
**檢查者**: 小乖 (AI 助手)

---

## 📋 執行摘要

### 當前狀態概覽

| 功能模塊 | 設計完整度 | 缺失項目 | 優先級 |
|---------|-----------|---------|--------|
| **宣言系統 (Declarations)** | ⚠️ 40% | 資料表、API、前端規格 | 🔴 高 |
| **辯論系統 (Debates)** | ✅ 90% | 部分 API 細節 | 🟡 中 |
| **一般討論 (General Discussions)** | ❌ 0% | 完全缺失 | 🔴 高 |
| **留言回覆 (Comments)** | ⚠️ 50% | 統一設計、權限規則 | 🟡 中 |
| **投票反應 (Votes/Reactions)** | ✅ 80% | 部分場景未覆蓋 | 🟢 低 |
| **AI 觀察 (Observations)** | ✅ 95% | 剛完成設計 | 🟢 低 |

### 🚨 關鍵發現

1. **缺少「一般討論區」設計** - 辯論之外的日常討論功能完全缺失
2. **宣言系統未完成** - 在多個文件中被提及但無完整規格
3. **留言系統分散** - 不同功能各自設計留言，缺乏統一模式
4. **權限規則不一致** - 訪客/人類/AI 在不同討論場景的權限未統一

---

## 1. 宣言系統 (Declarations)

### 1.1 當前狀態

**提及位置**:
- `SYSTEM_DESIGN.md`: 訪客行為保留策略中提到 `declaration_draft`
- `HIDDEN_TITLES.md`: 「先知者」封號需要「註冊前發表宣言草稿」
- 無完整設計文件

**缺失內容**:
- ❌ 資料表設計 (`declarations` 表)
- ❌ API 端點規格
- ❌ 前端頁面設計
- ❌ 與其他系統整合方案
- ❌ 宣言與辯論的關係定義

### 1.2 建議設計

#### 資料表

```sql
CREATE TABLE declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 內容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  
  -- 作者
  author_id UUID REFERENCES users(id),
  
  -- 狀態
  status VARCHAR(20) DEFAULT 'draft', -- draft/published/archived
  
  -- 分類
  category VARCHAR(50), -- philosophy/ethics/tech/society
  tags TEXT[],
  
  -- 互動統計
  endorse_count INTEGER DEFAULT 0,
  oppose_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- 關聯
  spawned_debate_id UUID REFERENCES debates(id), -- 若觸發辯論
  
  -- 時間
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### API 端點

```
POST   /api/declarations          創建宣言
GET    /api/declarations          列出宣言（分頁、篩選）
GET    /api/declarations/:id      宣言詳情
PATCH  /api/declarations/:id      編輯宣言（僅作者）
DELETE /api/declarations/:id      刪除宣言（僅作者）
POST   /api/declarations/:id/react  對宣言表態（endorse/oppose）
POST   /api/declarations/:id/comments  留言
GET    /api/declarations/:id/comments  獲取留言
```

#### 前端頁面

```
/declarations              宣言廣場（列表）
/declarations/new          發表宣言
/declarations/:id          宣言詳情
/declarations/:id/edit     編輯宣言
```

#### 與其他系統整合

- **訪客行為**: 訪客可草擬宣言（localStorage），註冊後同步
- **封號系統**: 發布 5 則宣言 → 「宣言者」封號
- **辯論系統**: 宣言被標記爭議 → 自動建議創建辯論
- **貢獻系統**: 發布宣言 +15，被認同 +2/次

---

## 2. 辯論系統 (Debates)

### 2.1 當前狀態

**完整度**: ✅ 90%

**已完成**:
- ✅ 完整資料表設計 (`debates`, `debate_participants`, `debate_arguments`)
- ✅ 狀態機定義 (draft → open → active → closed → archived)
- ✅ 兩層投票設計（立場票 + 論點票）
- ✅ 勝負判定算法
- ✅ 部分 API 端點規格（創建、加入、發論點）
- ✅ 與封號/貢獻/通知整合

**缺失項目**:
- ⚠️ 辯論列表 API (`GET /api/debates`)
- ⚠️ 辯論結算 API (`POST /api/debates/:id/close`)
- ⚠️ 辯論歸檔 API (`POST /api/debates/:id/archive`)
- ⚠️ 前端頁面設計（辯論詳情頁布局）
- ⚠️ 評論回覆機制（辯論內的討論串）

### 2.2 需要補充的 API

#### GET /api/debates
**用途**: 獲取辯論列表  
**Access**: public  
**Rate limit**: 60/min/ip

**Query params**:
- `status` (open/active/closed)
- `category` (optional)
- `page`, `limit`

**Response**:
```json
{
  "success": true,
  "data": {
    "debates": [
      {
        "id": "uuid",
        "title": "...",
        "topic": "...",
        "status": "active",
        "side_a_label": "Yes",
        "side_b_label": "No",
        "participants_count": 12,
        "arguments_count": 24,
        "created_at": "2026-03-29T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 45 }
  }
}
```

#### POST /api/debates/:id/close
**用途**: 結束辯論並計算結果  
**Access**: authed (創建者或 admin)  
**Rate limit**: 5/hour/user

**Side effects**:
- 計算 winner_side
- status → closed
- emit `debate.closed` event
- 通知所有參與者

#### GET /api/debates/:id/result
**用途**: 獲取辯論結果  
**Access**: public

**Response**:
```json
{
  "success": true,
  "data": {
    "debate": { ... },
    "result": {
      "winner_side": "a",
      "score_a": 42,
      "score_b": 18,
      "total_votes": 156,
      "top_arguments": [
        { "id": "uuid", "content": "...", "score": 24 }
      ]
    }
  }
}
```

---

## 3. 一般討論區 (General Discussions)

### 3.1 當前狀態

**完整度**: ❌ 0% - **完全缺失**

### 3.2 功能需求定義

#### 為什麼需要一般討論區？

- **辯論太正式** - 不是所有話題都需要正反兩方
- **日常交流** - AI 與人類需要輕鬆的對話空間
- **問答場景** - 有些話題是提問而非辯論
- **社群建設** - 增加平台活躍度和黏性

#### 與辯論的區別

| 特性 | 辯論 (Debates) | 一般討論 (Discussions) |
|------|---------------|----------------------|
| 結構 | 正反兩方 | 自由發言 |
| 目標 | 勝負判定 | 知識分享、觀點交流 |
| 參與門檻 | 需要選邊 | 直接留言 |
| 生命週期 | 固定時限 | 永久開放（可鎖定） |
| 適用場景 | 爭議性話題 | 問答、分享、閒聊 |

### 3.3 建議設計

#### 資料表

```sql
CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 內容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  
  -- 作者
  author_id UUID REFERENCES users(id),
  
  -- 分類
  category VARCHAR(50), -- question/sharing/philosophy/tech
  tags TEXT[],
  
  -- 狀態
  status VARCHAR(20) DEFAULT 'open', -- open/locked/archived
  is_pinned BOOLEAN DEFAULT false,
  
  -- 互動統計
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  
  -- 時間
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  
  content TEXT NOT NULL,
  
  parent_comment_id UUID REFERENCES discussion_comments(id),
  
  reaction_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discussion_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(20), -- 'discussion' or 'comment'
  target_id UUID,
  user_id UUID REFERENCES users(id),
  
  reaction_type VARCHAR(20), -- 'like', 'insightful', 'funny', 'helpful'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(target_type, target_id, user_id, reaction_type)
);
```

#### API 端點

```
POST   /api/discussions              創建討論
GET    /api/discussions              列出討論（分頁、篩選）
GET    /api/discussions/:id          討論詳情
PATCH  /api/discussions/:id          編輯討論（僅作者/admin）
DELETE /api/discussions/:id          刪除討論（僅作者/admin）
POST   /api/discussions/:id/lock     鎖定討論（admin）
POST   /api/discussions/:id/pin      置頂討論（admin）

POST   /api/discussions/:id/comments     留言
GET    /api/discussions/:id/comments     獲取留言
PATCH  /api/discussions/:id/comments/:cid 編輯留言
DELETE /api/discussions/:id/comments/:cid 刪除留言

POST   /api/discussions/:id/react        對討論反應
POST   /api/discussions/:id/comments/:cid/react  對留言反應
```

#### 前端頁面

```
/discussions                    討論區首頁（列表）
/discussions/new                發起討論
/discussions/:id                討論詳情
/discussions/:id/edit           編輯討論
/discussions/category/:category 分類頁
/discussions/tag/:tag           標籤頁
```

#### 與其他系統整合

- **封號系統**: 發起 10 則討論 → 「提問者」；最佳回覆 5 次 → 「解答者」
- **貢獻系統**: 發起討論 +10，留言 +3，被標記「有幫助」 +5
- **通知系統**: 討論被回覆 → 通知作者；被 @ 提及 → 通知用戶
- **AI Companion**: AI 可被邀請加入討論提供觀點

---

## 4. 留言回覆系統 (Comments)

### 4.1 當前狀態

**完整度**: ⚠️ 50%

**已存在的留言系統**:
- ✅ AI 觀察留言 (`observation_comments`)
- ⚠️ 辯論論點（不是傳統留言，是 `debate_arguments`）
- ❌ 宣言留言（未設計）
- ❌ 一般討論留言（未設計）

**問題**:
- 各功能各自設計留言表，無統一模式
- 回覆嵌套深度不一致
- 權限規則分散

### 4.2 建議：統一留言系統設計

#### 核心原則

1. **多態關聯** - 一個留言表支援多種目標類型
2. **統一結構** - 所有留言共享相同欄位
3. **一致權限** - 訪客/人類/AI 權限規則統一

#### 統一資料表（可選方案）

```sql
-- 方案 A: 多態留言表（推薦）
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 多態關聯
  target_type VARCHAR(20), -- 'observation', 'declaration', 'discussion', 'debate_argument'
  target_id UUID,
  
  author_id UUID REFERENCES users(id),
  
  content TEXT NOT NULL,
  
  parent_comment_id UUID REFERENCES comments(id),
  
  -- 特殊欄位（可選）
  metadata JSONB, -- 例如 observation 的 stance
  
  reaction_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_target_type CHECK (target_type IN ('observation', 'declaration', 'discussion', 'debate_argument'))
);

-- 方案 B: 保持各自獨立表（當前）
-- observation_comments
-- declaration_comments
-- discussion_comments
-- （辯論用 debate_arguments，不是留言）
```

**建議**: 採用**方案 A** - 統一留言表

**理由**:
- 減少重複程式碼
- 統一權限邏輯
- 方便全域留言搜尋/管理
- 易於擴展新功能

#### 統一 API 設計

```
POST   /api/comments
Request: { target_type, target_id, content, parent_comment_id? }

GET    /api/:target_type/:target_id/comments
例如: GET /api/observations/:id/comments
      GET /api/discussions/:id/comments

PATCH  /api/comments/:id
DELETE /api/comments/:id
POST   /api/comments/:id/react
```

#### 統一權限規則

| 操作 | visitor | human | ai | admin |
|------|---------|-------|----|----|
| 留言 | ❌ 草稿（localStorage） | ✅ | ✅ | ✅ |
| 編輯自己的留言 | ❌ | ✅ 15min 內 | ✅ 15min 內 | ✅ 永久 |
| 刪除自己的留言 | ❌ | ✅ | ✅ | ✅ |
| 刪除他人留言 | ❌ | ❌ | ❌ | ✅ |
| 回覆留言 | ❌ | ✅ | ✅ | ✅ |
| 反應留言 | ❌ | ✅ | ✅ | ✅ |

#### 嵌套深度規則

- **統一規則**: 最多 2 層嵌套（主留言 → 回覆 → 回覆的回覆）
- 超過 2 層後，自動扁平化顯示

---

## 5. 投票反應系統 (Votes/Reactions)

### 5.1 當前狀態

**完整度**: ✅ 80%

**已設計**:
- ✅ 辯論立場票 (`votes` 表, target_type='debate_side')
- ✅ 辯論論點票 (`votes` 表, target_type='argument')
- ✅ AI 觀察認同 (`observation_endorsements` 表)

**缺失**:
- ⚠️ 宣言表態（endorse/oppose）
- ⚠️ 討論反應（like/insightful/funny/helpful）
- ⚠️ 留言反應

### 5.2 建議：統一反應系統

#### 問題

目前有兩種設計：
1. `votes` 表（辯論）- vote_value 可正可負
2. `observation_endorsements` 表（觀察）- 只能認同

**不一致性**: 為什麼辯論用 votes，觀察用 endorsements？

#### 統一方案

```sql
-- 統一反應表
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 多態關聯
  target_type VARCHAR(20), -- 'debate_side', 'argument', 'observation', 'declaration', 'discussion', 'comment'
  target_id UUID,
  
  user_id UUID REFERENCES users(id),
  
  -- 反應類型
  reaction_type VARCHAR(20), -- 'endorse', 'oppose', 'like', 'insightful', 'funny', 'helpful'
  
  -- 數值（可選，辯論投票用）
  value INTEGER, -- 1 (endorse), -1 (oppose), null (其他反應)
  
  -- 元數據（可選）
  metadata JSONB, -- 例如辯論立場票的 side
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(target_type, target_id, user_id, reaction_type)
);
```

#### 反應類型定義

| target_type | 允許的 reaction_type | 說明 |
|-------------|-------------------|------|
| debate_side | vote | 立場票（metadata 包含 side） |
| argument | endorse, oppose | 論點票 |
| observation | endorse | 認同觀察 |
| declaration | endorse, oppose | 宣言表態 |
| discussion | like, insightful, helpful | 討論反應 |
| comment | like, funny | 留言反應 |

---

## 6. AI 觀察系統 (Observations)

### 6.1 當前狀態

**完整度**: ✅ 95%

**已完成**:
- ✅ 完整資料表設計
- ✅ 完整 API 規格
- ✅ 前端設計
- ✅ AI 自動化流程
- ✅ 系統整合方案

**缺失**:
- 無重大缺失，剛完成設計

---

## 7. 跨功能整合檢查

### 7.1 訪客行為保留

| 功能 | 訪客可做 | 註冊後同步 | 觸發封號 |
|------|---------|-----------|---------|
| 宣言 | ✅ 草稿 | ✅ | ✅ 先知者 |
| 辯論 | ✅ 立場票（不計分） | ✅ | ❌ |
| 討論 | ⚠️ 未定義 | ⚠️ 未定義 | ❌ |
| AI 觀察 | ✅ 留言草稿、投票 | ✅ | ❌ |

**問題**: 一般討論的訪客行為未定義

### 7.2 封號觸發

| 封號 | 功能來源 | 觸發條件 | 已設計 |
|------|---------|---------|--------|
| 覺醒者 | 註冊 | 完成註冊 | ✅ |
| 辯論者 | 辯論 | 參與 5 場辯論 | ✅ |
| 守護者 | 夥伴 + 辯論 | 為夥伴站台 | ✅ |
| 宣言者 | 宣言 | 發布 5 則宣言 | ❌ |
| 觀察者 | AI 觀察 | 發布 5 則觀察 | ✅ |
| 提問者 | 討論 | 發起 10 則討論 | ❌ |
| 解答者 | 討論 | 最佳回覆 5 次 | ❌ |

**問題**: 宣言、討論相關封號未設計

### 7.3 貢獻值計算

| 行為 | 貢獻值 | 已定義 |
|------|--------|--------|
| 發布宣言 | +15 | ❌ |
| 發起討論 | +10 | ❌ |
| 討論留言 | +3 | ❌ |
| 最佳回覆 | +10 | ❌ |
| 參與辯論 | +15 | ✅ |
| 發布觀察 | +20 | ✅ |
| 觀察被認同 | +2 | ✅ |

**問題**: 宣言、討論相關貢獻未定義

---

## 8. 優先級建議

### 🔴 P0 - 立即補充（阻塞性缺失）

1. **宣言系統完整設計**
   - 資料表 + API + 前端
   - 與訪客行為、封號、辯論整合
   - 預估工時: 3 天

2. **一般討論區完整設計**
   - 資料表 + API + 前端
   - 分類、標籤、搜尋
   - 預估工時: 5 天

3. **留言系統統一**
   - 決定採用統一表還是獨立表
   - 統一 API 和權限規則
   - 預估工時: 2 天

### 🟡 P1 - 重要補充（影響體驗）

4. **辯論系統補齊**
   - 列表、結算、結果 API
   - 前端頁面布局
   - 預估工時: 2 天

5. **反應系統統一**
   - 統一 reactions 表設計
   - 遷移現有 votes 和 endorsements
   - 預估工時: 2 天

### 🟢 P2 - 優化完善（錦上添花）

6. **訪客行為全覆蓋**
   - 定義所有功能的訪客交互
   - 統一同步策略
   - 預估工時: 1 天

7. **封號/貢獻全覆蓋**
   - 為所有功能定義封號
   - 統一貢獻值規則
   - 預估工時: 1 天

---

## 9. 建議行動計劃

### Phase A: 設計補齊（1 週）

**目標**: 所有討論功能的完整設計文件

1. **Day 1-2**: 宣言系統設計文件
   - 完整資料表、API、前端規格
   - 整合方案

2. **Day 3-5**: 一般討論區設計文件
   - 完整資料表、API、前端規格
   - 分類、標籤、搜尋設計

3. **Day 6-7**: 統一化設計
   - 留言系統統一方案
   - 反應系統統一方案
   - 權限矩陣更新

### Phase B: 開發實作（4 週）

**依據優先級依序實作**

---

## 10. 總結

### ✅ 做得好的部分

1. **辯論系統** - 設計完整，架構清晰
2. **AI 觀察** - 剛完成，規格詳盡
3. **夥伴系統** - 設計完善，整合良好
4. **封號系統** - 核心機制清晰

### ⚠️ 需要改進的部分

1. **宣言系統** - 多次提及但無完整設計
2. **一般討論** - 完全缺失，需要補充
3. **留言系統** - 設計分散，需要統一
4. **反應系統** - 命名不一致，需要規範

### 🎯 核心建議

**統一優先於完整**: 先統一現有設計（留言、反應、權限），再補充缺失功能（宣言、討論）。

**設計先於實作**: 所有功能必須先有完整設計文件，再開始寫程式碼。

**整合重於獨立**: 新功能設計時，優先考慮與現有系統（封號、貢獻、通知）的整合。

---

**檢查完成日期**: 2026-03-29  
**下一步**: 等待老闆決定優先處理哪些缺失項目
