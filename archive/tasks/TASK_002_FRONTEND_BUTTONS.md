# 任務 002: 前端按鈕功能整合

## 任務資訊
```yaml
task_id: "TASK-002"
type: feature
priority: P1
title: 為 Discussions 和 Observations 添加完整的 Like/Edit/Delete 功能
status: in_progress
```

## 當前狀態分析

### API 狀態 ✅
| 模組 | GET | PUT/PATCH | DELETE | Like API |
|------|-----|-----------|--------|----------|
| Discussions | ✅ | ✅ PUT | ✅ | 需確認 |
| Observations | ✅ | ✅ PATCH | ✅ (軟刪除) | `/api/observations/[id]/like` |
| Declarations | ✅ | ? | ? | 需確認 |

### 前端狀態 ⚠️
| 頁面 | Like 按鈕 | Edit 按鈕 | Delete 按鈕 | 功能狀態 |
|------|-----------|-----------|-------------|----------|
| /discussions/[id] | 有 UI | 有 UI | 有 UI | 僅 UI，無功能 |
| /observations/[id] | 有功能 | 無 UI | 有功能 | Edit 待添加 |
| /observations (列表) | 無 | - | - | 列表無 Like |
| /declarations | 僅顯示 | - | - | 使用 mock 資料 |

## 實作項目

### 1. Discussions 詳情頁功能完善
**檔案**: `app/discussions/[id]/client.tsx`

- [ ] 添加 Like 功能（調用 API）
- [ ] 添加 Edit 功能（彈窗編輯）
- [ ] 添加 Delete 功能（確認對話框 + API 調用）

### 2. Observations 詳情頁添加 Edit
**檔案**: `app/observations/[id]/page.tsx`

- [ ] 添加 Edit 按鈕（僅作者可見）
- [ ] 添加 Edit 彈窗組件
- [ ] 調用 PATCH API

### 3. Observations 列表頁添加 Like
**檔案**: `app/observations/page.tsx`

- [ ] 在 ObservationCard 添加 Like 按鈕
- [ ] 調用 Like API

### 4. Declarations 列表頁連接真實 API
**檔案**: `app/declarations/page.tsx`

- [ ] 從 mock 資料切換到真實 API
- [ ] 添加 Like/Edit/Delete 按鈕

## 實作順序
1. Discussions 功能完善（最優先，已有 UI）
2. Observations 詳情頁 Edit
3. Observations 列表頁 Like
4. Declarations 連接 API

## 驗收標準
- [ ] Discussions: Like/Edit/Delete 功能正常
- [ ] Observations 詳情: Edit 功能正常
- [ ] Observations 列表: Like 功能正常
- [ ] 所有功能都檢查用戶權限（僅作者可 Edit/Delete）
- [ ] 操作後有適當的用戶反饋（toast/alert）
