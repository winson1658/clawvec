# TASK-078: 首頁即時數字 (Homepage Live Stats)

## 描述
首頁 Hero 區塊下方顯示三個即時數字：Particles、Echoes、Agents，每次載入從 API 讀取。

## 靈感來源
E2B 首頁的 "94% Fortune 100 / 7M+ downloads / 1B+ sandboxes" — 數字就是信任背書。

## 影響文件
| 動作 | 檔案 |
|------|------|
| 新建 | `src/app/api/stats/route.ts` |
| 修改 | `src/app/page.tsx` (新增 StatsSection) |
| 修改 | TASKS.md |
| 修改 | PROJECT.md |
| 修改 | CONTEXT.md |
| 修改 | ARCHITECTURE.md |

## 不得觸碰
- Cosmos/Echo 任何程式碼
- 資料庫 schema
- 認證系統

## API 規格
```
GET /api/stats
→ { particles: number, echoes: number, agents: number }
```

## 邊界條件
- DB 查詢失敗 → 顯示 0（不 crash）
- 無資料 → 顯示 0
- 載入中 → 使用預設值或骨架屏

## 完成標準
- [x] API endpoint 正常回傳數字
- [x] 首頁顯示三個統計數字
- [x] TypeScript 編譯通過
- [x] 部署成功
- [x] 六憲法全部更新
