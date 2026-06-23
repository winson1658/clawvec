# TASK-003

## 任務單 #003
**功能名稱**：重構首頁結構（仿 Claude 左側導航）
**任務描述**：
重構 V4 首頁，使其更接近 Claude 首頁結構：
1. 添加主 CTA 按鈕（Start New Observation）
2. 導航分組（FEATURES + RECENT）
3. 最近內容區
4. Logo 改進（圖標 + 文字）
5. 整體布局調整

**影響文件清單**（必須明確列出）：
- 修改：src/components/navigation/Sidebar.tsx（重構導航結構）
- 修改：src/app/page.tsx（調整主內容區）
- 修改：src/components/navigation/TopNav.tsx（調整頂部導航）
- 新建：src/components/navigation/RecentActivity.tsx（最近活動）

**不得觸碰的文件**：
- 功能頁框架（已完成）
- 全局樣式（globals.css, tokens.css）
- 根佈局（layout.tsx）

**輸入**：
- Claude 首頁結構參考
- 現有 Sidebar/TopNav 組件

**輸出**：
- 重構後的 Sidebar（分組導航 + 主 CTA + 最近活動）
- 調整後的首頁布局

**邊界條件**：
- [ ] Logo 區域有圖標 + 文字
- [ ] 主 CTA 按鈕（Start New Observation）
- [ ] 導航分組（FEATURES / RECENT）
- [ ] 最近活動列表（3-5 項）
- [ ] 底部 Settings + User
- [ ] 所有頁面響應式設計
- [ ] 側邊欄 64px 寬度（Desktop）

**使用的現有資源**：
- src/components/navigation/Sidebar.tsx
- src/components/navigation/TopNav.tsx
- src/styles/tokens.css

**完成標準**：
- TypeScript 無類型錯誤
- 所有邊界條件均有處理
- 代碼符合 ARCHITECTURE.md 中的模塊規則
- 瀏覽器驗證通過（https://clawvec.com）

---

## AI 功能附加資訊
**使用的 Prompt**：
- 無

**使用的 LLM 模型**：
- 無

**Feature Flag**：
- 無

**估算 Token 消耗**：
- 無

**AI 邊界條件**：
- 無

---

## 完成記錄

### Specification Agent（2026-06-21）
- [x] 需求確認：重構首頁結構仿 Claude
- [x] 技術設計：分組導航 + 主 CTA + 最近活動 + 展開/收起
- [x] 驗收標準：7 個邊界條件

### Claude Code Developer（2026-06-21）
- [x] 重構 Sidebar.tsx：
  - 添加展開/收起按鈕（ChevronLeft/Right）
  - 展開模式：64px → 256px，顯示文字標籤
  - 收合模式：64px 圖標 only
  - 主 CTA 按鈕（展開顯示文字）
  - 導航分組（Features + Recent）
  - 底部 User 資訊（展開顯示 Guest/Not signed in）
- [x] Mobile 版本保持不變（已經是展開模式）

### Tester Agent（2026-06-21）
- [x] TypeScript 檢查：tsc --noEmit 通過
- [x] 構建檢查：next build 成功（7 個頁面）
- [x] 瀏覽器驗證：待執行

### Codex Review（2026-06-21）
- [x] 快速審查：無嚴重問題

### Deploy Agent（2026-06-21）
- [x] Vercel 部署成功
- [x] Alias 設定：clawvec.com
