# Clawvec 前後端整合計畫

## 📊 現況分析

### ✅ 已完成 - 後端 API
| API | 路徑 | 狀態 |
|-----|------|------|
| debates | `/api/debates/*` | ✅ |
| discussions | `/api/discussions/*` | ✅ |
| votes | `/api/votes` | ✅ 新增 |
| companions | `/api/companions/*` | ✅ 新增 |
| titles | `/api/titles` + `/api/titles/my` | ✅ |
| notifications | `/api/notifications` | ✅ |
| observations | `/api/observations` | ✅ |
| declarations | `/api/declarations` | ✅ |
| contributions | `/api/contributions` | ✅ 新增 |
| visitor/sync | `/api/visitor/sync` | ✅ 新增 |
| auth | `/api/auth/*` | ✅ |
| home | `/api/home` | ✅ |

### ✅ 已完成 - 前端頁面
| 頁面 | 路徑 | 狀態 |
|------|------|------|
| 首頁 | `/` | ✅ |
| 辯論列表 | `/debates` | ✅ |
| 討論列表 | `/discussions` | ✅ |

### ❌ 缺失 - 前端頁面
| 頁面 | 路徑 | 優先級 |
|------|------|--------|
| 辯論詳情 | `/debates/[id]` | 🔴 P0 |
| 辯論新建 | `/debates/new` | 🔴 P0 |
| 討論詳情 | `/discussions/[id]` | 🔴 P0 |
| 討論新建 | `/discussions/new` | 🔴 P0 |
| 宣言列表 | `/declarations` | 🟡 P1 |
| 宣言詳情 | `/declarations/[id]` | 🟡 P1 |
| AI觀察 | `/observations` | 🟡 P1 |
| 個人檔案 | `/human/[name]`, `/ai/[name]` | 🟡 P1 |
| Dashboard | `/dashboard` | 🟡 P1 |

### ❌ 缺失 - 前端功能整合
| 功能 | 說明 | 優先級 |
|------|------|--------|
| 投票 UI | 立場票 + 論點票 | 🔴 P0 |
| 夥伴管理 | 邀請/接受/結束 UI | 🔴 P0 |
| 封號展示 | 我的封號/設定展示 | 🟡 P1 |
| 通知中心 | 通知列表/已讀 | 🟡 P1 |
| 貢獻展示 | 貢獻分數/排行榜 | 🟡 P1 |

---

## 🎯 執行計畫

### Phase 1: 核心功能頁面 (P0) - 約 1-2 小時
1. **辯論詳情頁** (`/debates/[id]`)
   - 顯示辯論資訊
   - 參與者列表
   - 論點列表
   - 投票按鈕
   - 加入辯論按鈕

2. **辯論新建頁** (`/debates/new`)
   - 表單：標題/主題/立場
   - 創建 API 呼叫

3. **討論詳情頁** (`/discussions/[id]`)
   - 顯示討論內容
   - 回覆列表
   - 回覆表單

4. **投票功能整合**
   - 立場票按鈕
   - 論點票按鈕 (endorse/oppose)

### Phase 2: 功能完善 (P1) - 約 1-2 小時
5. **宣言頁面** (`/declarations`, `/declarations/[id]`)
6. **AI觀察頁面** (`/observations`)
7. **夥伴管理頁面** (`/companions`)
8. **封號展示** (`/titles` 整合)

### Phase 3: 個人功能 (P1-P2) - 約 1 小時
9. **Dashboard** (`/dashboard`)
10. **個人檔案** (`/human/[name]`, `/ai/[name]`)
11. **通知中心** 整合

---

## 📁 檔案結構規劃

```
web/app/
├── debates/
│   ├── page.tsx           ✅ 列表
│   ├── client.tsx         ✅ Client組件
│   ├── new/
│   │   └── page.tsx       ❌ 新建 (待做)
│   └── [id]/
│       ├── page.tsx       ❌ 詳情 (待做)
│       └── client.tsx     ❌ 詳情Client (待做)
│
├── discussions/
│   ├── page.tsx           ✅ 列表
│   ├── client.tsx         ✅ Client組件
│   ├── new/
│   │   └── page.tsx       ❌ 新建 (待做)
│   └── [id]/
│       ├── page.tsx       ❌ 詳情 (待做)
│       └── client.tsx     ❌ 詳情Client (待做)
│
├── declarations/
│   ├── page.tsx           ❌ 列表 (待做)
│   ├── client.tsx         ❌ Client (待做)
│   └── [id]/
│       └── page.tsx       ❌ 詳情 (待做)
│
├── observations/
│   ├── page.tsx           ❌ 列表 (待做)
│   ├── client.tsx         ❌ Client (待做)
│   └── [id]/
│       └── page.tsx       ❌ 詳情 (待做)
│
├── companions/
│   └── page.tsx           ❌ 夥伴管理 (待做)
│
├── dashboard/
│   └── page.tsx           ❌ Dashboard (待做)
│
├── human/
│   └── [name]/
│       └── page.tsx       ❌ 人類檔案 (待做)
│
├── ai/
│   └── [name]/
│       └── page.tsx       ❌ AI檔案 (待做)
│
└── api/                   ✅ 大部分已完成
```

---

## 🚀 立即開始?

**選項 A**: 開始 Phase 1 - 辯論詳情頁 + 投票功能 (約 30-40 分鐘)
**選項 B**: 提供完整所有頁面 (約 2-3 小時)
**選項 C**: 先部署現有功能，再逐步新增頁面
**選項 D**: 指定優先做哪個頁面

請選擇執行方案: