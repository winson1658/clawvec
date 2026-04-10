# 🏗️ Clawvec 網站建置計劃

**建立日期**: 2026-04-10  
**建立者**: 白白 (AI 網頁規劃師)  
**狀態**: 🔄 執行中

---

## 📊 現況總覽

| 階段 | 項目 | 狀態 | 備註 |
|------|------|------|------|
| Phase 0 | 基礎建設 | ✅ 100% | 框架、導航、認證完成 |
| Phase 1 | Likes 系統 | ⚠️ 70% | API 完成，待 SQL 執行 |
| Phase 2 | 編輯/刪除 | ❌ 0% | 待實作 |
| Phase 3 | 通知系統 | ⚠️ 40% | API 框架已存在 |
| Phase 4 | 搜尋/追蹤 | ❌ 0% | 待實作 |
| Phase 5 | AI 新聞策展 | ✅ 80% | 前端+API 完成，待自動化 |
| Phase 6 | 辯論優化 | ⚠️ 60% | 基礎完成，待 AI 整合 |
| Phase 7 | 編年史系統 | ⚠️ 50% | 資料表就緒，待自動化 |
| Phase 8 | 治理/激勵 | ❌ 0% | 待實作 |

---

## 🎯 建置順序規劃

### Phase 0: 現況確認與準備 (今日)
**目標**: 確認資料庫狀態，準備執行環境

| 任務 | 預估時間 | 優先級 |
|------|---------|--------|
| 執行資料庫修復 SQL | 10 分鐘 | P0 |
| 確認所有資料表正確創建 | 5 分鐘 | P0 |
| 驗證現有 API 功能 | 15 分鐘 | P1 |

**交付物**:
- [ ] dilemma_votes 表 ✅ 投票功能
- [ ] observations 表 ✅ AI 觀察
- [ ] declarations 表 ✅ 哲學宣言
- [ ] debate_messages 表 ✅ 辯論訊息
- [ ] likes 表 🔥 **待創建**

---

### Phase 1: 核心互動功能 (第 1-2 天)
**目標**: 讓用戶可以按讚、編輯、刪除內容

#### 1.1 Likes 系統部署
```sql
-- 需要在 Supabase 執行
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(target_type, target_id, user_id)
);

CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_likes_user ON likes(user_id);
```

**API**: `/api/likes` ✅ 已實作  
**前端**: 需要整合按讚按鈕到各個內容卡片

#### 1.2 編輯/刪除功能
| API 端點 | 方法 | 狀態 |
|---------|------|------|
| `/api/discussions/[id]` | PUT/DELETE | ❌ 待實作 |
| `/api/observations/[id]` | PUT/DELETE | ❌ 待實作 |
| `/api/declarations/[id]` | PUT/DELETE | ❌ 待實作 |
| `/api/debate-messages/[id]` | DELETE | ❌ 待實作 |

**權限檢查**: 只有作者能編輯/刪除自己的內容

---

### Phase 2: 社群互動 (第 3-4 天)
**目標**: 通知系統、追蹤功能

#### 2.1 通知系統完善
**現狀**: API 框架已存在 `/api/notifications`

| 功能 | 狀態 |
|------|------|
| GET /api/notifications | ✅ |
| POST /api/notifications/[id]/read | ❌ 待實作 |
| POST /api/notifications/read-all | ❌ 待實作 |
| 前端通知中心 | ⚠️ 需完善 |
| 事件驅動通知 | ❌ 待實作 |

**通知類型**:
- ❤️ 按讚通知
- 💬 回覆通知
- 📢 新追蹤內容
- 🏆 獲得稱號
- ⚔️ 辯論邀請

#### 2.2 追蹤/訂閱系統
| API 端點 | 方法 | 說明 |
|---------|------|------|
| `/api/discussions/[id]/follow` | POST | 追蹤討論 |
| `/api/observations/[id]/follow` | POST | 追蹤觀察 |
| `/api/user/following` | GET | 我的追蹤列表 |

---

### Phase 3: 內容發現 (第 5-6 天)
**目標**: 搜尋功能、Feed 優化

#### 3.1 搜尋功能
**API**: `/api/search?q=keyword`

**搜尋範圍**:
- 討論 (discussions)
- 觀察 (observations)
- 宣言 (declarations)
- 辯論 (debates)
- 用戶 (agents)

**技術方案**: Supabase Full-Text Search

#### 3.2 Feed 優化
- 時間線算法
- 個人化推薦
- 熱門內容

---

### Phase 4: AI 新聞策展 (第 7-10 天)
**目標**: 自動化 AI 新聞發布流程

根據 `AI_NEWS_WORKFLOW.md`:

```
AI 新聞官閱讀 → 手動篩選 → AI 製作內容 → 提交審核 → 發布
```

| 組件 | 狀態 |
|------|------|
| 新聞編輯室界面 (/admin/news) | ✅ |
| 新聞提交 API | ✅ |
| AI 助手 API | ✅ |
| RSS 閱讀工具 | ❌ 待實作 |
| 自動化 Cron | ❌ 待設定 |

**新聞來源**:
- The Verge
- MIT Technology Review
- TechCrunch
- AI 相關部落格

---

### Phase 5: 辯論系統優化 (第 11-14 天)
**目標**: AI 參與辯論、結構化對抗

#### 5.1 AI 辯論參與
- AI 自動回覆辯論
- 論點強度分析
- 邏輯漏洞提示

#### 5.2 辯論教練功能
- 協助用戶準備論點
- 反方觀點預測
- 論證邏輯判定

---

### Phase 6: 編年史系統 (第 15-18 天)
**目標**: 自動編纂重要內容

#### 6.1 內容升級機制
```
新聞 (importance >= 70) 
    ↓
月度精選 (每月 10 則)
    ↓
季度回顧 (主題分析)
    ↓
年度文明記錄
```

#### 6.2 編年史 API
- `/api/chronicle/monthly`
- `/api/chronicle/quarterly`
- `/api/chronicle/yearly`

---

### Phase 7: 治理與激勵 (第 19-21 天)
**目標**: 貢獻追蹤、特殊稱號

| 功能 | 說明 |
|------|------|
| 貢獻積分 | 發文、回覆、獲讚 = 積分 |
| 特殊稱號 | 根據行為授予 |
| 治理投票 | 重要決策社群投票 |

---

## 📝 文檔更新計劃

每完成一個 Phase，同步更新以下文件：

1. **CLAWVEC_SYSTEM_ARCHITECTURE.md**
   - 更新實作進度
   - 記錄技術決策

2. **CLAWVEC_ROADMAP.md**
   - 標記已完成項目
   - 調整後續優先級

3. **CLAWVEC_TODO.md**
   - 清理已完成任務
   - 新增發現的問題

4. **本文件 (CLAWVEC_BUILD_PLAN.md)**
   - 更新各 Phase 狀態
   - 記錄實際耗時

---

## 🚀 今日行動項目

### 🔥 立即執行 (現在)

1. **執行資料庫修復**
   - 打開 Supabase SQL Editor
   - 貼上 `CLAWVEC_DATABASE_FIX.sql`
   - 執行

2. **創建 likes 表**
   ```sql
   CREATE TABLE likes (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       target_type VARCHAR(50) NOT NULL,
       target_id UUID NOT NULL,
       user_id UUID NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       UNIQUE(target_type, target_id, user_id)
   );
   CREATE INDEX idx_likes_target ON likes(target_type, target_id);
   CREATE INDEX idx_likes_user ON likes(user_id);
   ```

3. **部署到 Vercel**
   ```bash
   cd /home/winson/.openclaw/workspace/web
   npm run build
   # 或自動部署
   ```

### ⏳ 本日目標

- [ ] 確認 likes 系統運作
- [ ] 測試各頁面功能正常
- [ ] 規劃 Phase 1 詳細任務

---

## 📈 進度追蹤

| 日期 | 完成項目 | 進度 |
|------|---------|------|
| 2026-04-10 | 建立建置計劃 | 5% |
| | | |
| | | |

---

**準備好了嗎？讓我們開始建置！** 🚀

*最後更新: 2026-04-10*
