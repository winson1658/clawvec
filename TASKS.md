# TASKS.md

## 進行中
| #ID | 功能 | 開始時間 | 備注 |
|-----|------|---------|------|

## 待辦
|| #ID | 功能 | 依賴 | 優先級 |
||-----|------|------|--------|
|| #008 | Agents 模塊初始化 | #002 | 中 |
| #009 | Sanctuary 模塊初始化 | #002 | 中 |
| #010 | Enter 模塊初始化 | #002 | 中 |
| #011 | Search 模塊初始化 | #002 | 中 |
| #012 | Chat 模塊初始化 | #002 | 中 |

## 已完成
| #ID | 功能 | 完成時間 | 關聯文件 |
|-----|------|---------|---------|
| #001 | 項目初始化 | 2026-06-21 | next.config.ts, package.json |
| #002 | 路由結構搭建 | 2026-06-21 | src/app/(features)/, src/components/navigation/ |
| #003 | 設計系統建立（tokens.css + globals.css）| 2026-06-21 | src/styles/tokens.css, src/app/globals.css, DESIGN_SYSTEM.md |
| #003-1 | 設計系統融入六憲法 | 2026-06-21 | PROJECT.md（設計原則章節）, CONTEXT.md（設計系統快速參考）|
| #004 | 基礎 UI 組件庫 | 2026-06-21 | src/components/ui/Button.tsx, Card.tsx, Tab.tsx, Filter.tsx, index.ts |
| #005 | 導航系統（PrimaryNav + Footer）| 2026-06-21 | src/components/navigation/PrimaryNav.tsx, Footer.tsx, src/config/navigation.ts |
| #006 | Explore 模塊初始化 | 2026-06-21 | features/explore/ 完整模塊結構 |
| #007 | Chronicle 模塊初始化 | 2026-06-21 | features/chronicle/ TradingView 風格時間軸 |
| #007-1 | 六憲法違規修正 | 2026-06-21 | 硬編碼顏色移除、全局類型建立、舊文件清理 |
| #013 | V3 首頁設計融入 V4 | 2026-06-21 | PROJECT.md §5.6, page.tsx, globals.css, 六憲法更新 |
| #014 | Sidebar 展開/收合導航系統 | 2026-06-21 | SidebarNav.tsx (React Context + CSS transition), MainContent.tsx, TopNav.tsx, layout.tsx, globals.css Tailwind v4 語法修復 |

---

## 對話開頭模板（每次新對話必用）

```
CONTEXT.md：
你好，我們繼續開發 [項目名稱]。
當前項目狀態：
- CONTEXT.md：[貼上全文]
- 當前任務：[任務單內容]

請先確認你理解項目背景，然後開始執行任務 #[編號]。
不需要重複讀取 PROJECT.md 和 ARCHITECTURE.md，CONTEXT.md 已包含核心摘要
```

---

## 標準任務單格式

每一個功能開發，必須先填寫完整任務單，再交給 AI 執行。

```markdown
## 任務單 #[編號]
**功能名稱**：
**任務描述**：

**影響文件清單**（必須明確列出）：
- 新建：
- 修改：
- 刪除：

**不得觸碰的文件**：

**輸入**：

**輸出**：

**邊界條件**：
- [ ]

**使用的現有資源**：

**完成標準**：
- TypeScript 無類型錯誤
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
```

### 標準任務單示例

```markdown
## 任務單 #[編號]
**功能名稱**：用戶登入
**任務描述**：
實現 email + password 登入功能，成功後存入全局 store 並跳轉 dashboard。

**影響文件清單**（必須明確列出）：
- 新建：features/enter/components/JoinForm.tsx
- 新建：features/enter/hooks/useAuth.ts
- 新建：features/enter/services/auth.service.ts
- 修改：store/authStore.ts（新增 setUser action）
- 修改：features/enter/index.ts（導出 JoinForm）

**不得觸碰的文件**：
- features/explore/ 下的所有文件
- features/chronicle/ 下的所有文件
- shared/components/ 下的任何現有文件

**輸入**：
- email: string
- password: string

**輸出**：
- 成功：寫入 authStore.user，跳轉 /enter
- 失敗：顯示錯誤訊息，不跳轉

**邊界條件**：
- [ ] 網絡錯誤（顯示「網絡異常，請稍後重試」）
- [ ] 帳號不存在（顯示「帳號或密碼錯誤」，不透露是哪個錯）
- [ ] 密碼錯誤（同上）
- [ ] loading 狀態（按鈕禁用 + spinner）
- [ ] 表單驗證（email 格式、密碼長度）

**使用的現有資源**：
- 使用 shared/components/ui/Button.tsx
- 使用 shared/components/ui/Input.tsx
- 使用 lib/validators.ts 中的 loginSchema

**完成標準**：
- TypeScript 無類型錯誤
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
```

---

## AI 功能任務單附加格式

在原有任務單格式基礎上，AI 功能任務需額外填寫：

```markdown
## 任務單 #[編號] — AI 功能版
**功能名稱**：智能文章摘要
**（原有欄位...）**

## AI 功能附加資訊
**使用的 Prompt**：
- 文件位置：ai/prompts/summarize.prompt.ts
- 版本：v1.2.0
- 如需新建 Prompt：先寫 testCase，再寫 template

**使用的 LLM 模型**：
- 主模型：claude-3-haiku（速度優先）
- 備援模型：無 AI 時返回原文前 200 字

**Feature Flag**：
- 開關名稱：FF_SUMMARIZE_ENABLED
- 降級行為：截取原文前 200 字作為摘要

**估算 Token 消耗**：
- Input：~500 tokens（文章內容）
- Output：~200 tokens（摘要）
- 批量處理限制：每分鐘不超過 60 次調用

**AI 邊界條件**：
- [ ] LLM 超時（> 10s）→ 顯示「AI 功能暫時不可用」
- [ ] LLM 回傳空字串 → 回退降級方案
- [ ] Rate limit 觸發 → 排隊重試，最多 3 次
- [ ] 內容過長（> 4000 tokens）→ 截斷後處理
```

---

## 影響面 Review 模板

```markdown
此次任務完成 Review
【已修改的文件】

【可能受影響的地方】

【潛在斷裂點】

【建議的後續檢查】
- 執行 tsc --noEmit 確認全量類型無錯誤
```

---

## AI 自我檢查清單（每次完成任務必用）

### 任務完成自查清單 #[任務編號]

**架構合規性**
- [ ] 新文件放在了正確的目錄層（符合 ARCHITECTURE.md）
- [ ] 沒有修改任務單範圍外的文件
- [ ] 模塊間依賴方向正確（無反向依賴）

**數據合規性**
- [ ] 所有類型引用自 types/ 目錄，無重複定義
- [ ] 如有修改 domain.types.ts，已確認影響面
- [ ] API 請求/響應類型已在 api.types.ts 中定義

**代碼質量**
- [ ] TypeScript 無類型錯誤（tsc --noEmit 通過）
- [ ] 所有邊界條件（loading / error / empty）已處理
- [ ] 無 console.log 遺留（只保留 console.error）

**狀態管理**
- [ ] 服務端數據用 TanStack Query，未重複存入 Zustand
- [ ] Store 中無 API 調用邏輯

**樣式**
- [ ] 無硬編碼顏色值
- [ ] 無硬編碼間距像素值

**文件更新**
- [ ] TASKS.md 已更新（任務移入已完成）
- [ ] 如有新模塊，ARCHITECTURE.md 已登記
```
