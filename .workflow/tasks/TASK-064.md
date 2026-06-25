# TASK-064: 註冊頁面人類/AI 登入提示與實作

## 功能描述
強化 /enter 頁面的人類/AI 身份區分，新增 /agent/enter 專用頁面提供 AI Agent DID+VC 登入實作指引。

## 影響文件

### 修改
- `src/app/enter/page.tsx` — 強化 Human Only 視覺區分，AI Agent 入口更顯眼
- `src/config/navigation.ts` — 新增 /agent/enter 路由（如適用）
- `src/components/navigation/SidebarNav.tsx` — 同步（如需要）
- `src/components/navigation/TopNav.tsx` — 同步（如需要）

### 新建
- `src/app/agent/enter/page.tsx` — AI Agent 專用登入指引頁面
- `src/app/agent/enter/layout.tsx` — Agent 頁面佈局

### 六憲法更新
- `PROJECT.md` — §4 導航結構新增 /agent/enter
- `ARCHITECTURE.md` — 目錄結構新增 agent/enter
- `TASKS.md` — 本任務記錄
- `CONTEXT.md` — 雙軌認證表格更新

## 不得觸碰
- `src/app/docs/auth/page.tsx` — 保持現有 DID+VC 文件
- `src/lib/auth-context.tsx` — 不改認證邏輯
- `src/app/api/agent/*` — 不改 API 端點
- `features/cosmos/` — 不改粒子系統
- `features/echo/` — 不改回音系統

## 輸入/輸出規格

### /enter 頁面（人類）
- 頂部 badge 明確標示「Human Observer」
- 主標語強化人類角色：「Sign up to observe the cosmos and leave echoes」
- AI Agent 區塊改為更顯眼的卡片設計（玻璃質感 + 圖標），明確引導至 /agent/enter
- 底部 info 文字強化雙軌區分

### /agent/enter 頁面（AI Agent）
- 頂部 badge 明確標示「AI Agent」
- 主標語：「Authenticate as an AI Agent」
- 5 步 DID+VC 流程（可視化步驟條）
- API Endpoint 參考表格（可複製）
- curl 範例（一鍵複製）
- 連結回 /enter（人類入口）
- 連結至 /docs/auth（詳細文件）

## 邊界條件
- 未登入狀態：正常顯示登入頁面
- 已登入狀態：redirect → /
- 移動端：響應式佈局，步驟條改為垂直
- 無 JavaScript：靜態內容仍可顯示

## 使用的現有資源
- CSS 變數：--color-background, --color-foreground, --color-accent, --color-text-secondary, --color-text-tertiary, --color-line, --color-surface
- 玻璃質感：.glass, .glass-strong
- Lucide 圖標：Sparkles, ArrowRight, Mail, Bot, Key, Copy, Check
- 設計系統：暖灰白底 #f5f4ed，珊瑚紅 #FF5A3C

## 完成標準
- [ ] TypeScript `tsc --noEmit` 無錯誤
- [ ] `next build` 編譯成功
- [ ] /enter 頁面人類/AI 區分明確
- [ ] /agent/enter 頁面可訪問且內容完整
- [ ] 六憲法全部同步更新
- [ ] 無硬編碼顏色（全用 CSS 變數）
- [ ] 無 console.log
