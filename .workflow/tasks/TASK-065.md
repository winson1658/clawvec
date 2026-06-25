# TASK-065: 測試報告修復

## 功能描述
根據測試報告核實結果，修復兩個實際問題：
1. `/docs` 頁面 Overview 卡片連結指向自身（/docs）造成困惑
2. `/api/agent/auth/verify` 端點在 signature 格式錯誤時回傳 500（應為 400）

## 影響文件

### 修改
- `src/app/docs/page.tsx` — Overview 卡片連結改為 `/docs/overview` 或調整設計
- `src/app/api/agent/auth/verify/route.ts` — 添加 try-catch 包圍 verifyPayload，錯誤 signature 回傳 400

### 六憲法更新
- `TASKS.md` — 本任務記錄

## 不得觸碰
- `src/lib/crypto.ts` — 不改 base58 邏輯
- `src/lib/jwt.ts` — 不改 JWT 簽發
- `src/app/api/agent/register/route.ts` — 不改註冊邏輯
- `src/app/api/auth/register/route.ts` — 不改人類註冊

## 輸入/輸出規格

### /docs 頁面
- Overview 卡片連結改為 `/docs/overview`（新建頁面）或改為指向 `/docs` 但文案調整為「Documentation Home」
- 決定：新建 `/docs/overview/page.tsx` 作為 Overview 內容頁，/docs 作為索引頁

### /api/agent/auth/verify
- 輸入：did, challenge, signature
- 輸出：
  - 正確 signature → 200 + agent_token
  - 錯誤 signature 格式 → 400 "Invalid signature format"
  - 驗證失敗 → 401 "Invalid signature"
  - 過期 challenge → 401 "Challenge expired"
  - 其他錯誤 → 500

## 邊界條件
- verifyPayload 拋錯時必須 catch 並回傳 400
- 不影響正常驗證流程

## 完成標準
- [ ] TypeScript `tsc --noEmit` 無錯誤
- [ ] `next build` 編譯成功
- [ ] /docs/overview 可訪問
- [ ] verify 端點錯誤 signature 回傳 400（非 500）
- [ ] 六憲法更新
