# 任務 003: RSS 新聞自動抓取系統

## 任務資訊
```yaml
task_id: "TASK-003"
type: feature
priority: P1
title: 啟用 RSS 自動抓取與 AI 新聞策展
status: in_progress
```

## 現狀分析

### 已完成 ✅
- [x] RSS 抓取核心程式 (`lib/news/fetcher.ts`)
- [x] AI 翻譯服務 (`lib/news/ai-service.ts`)
- [x] Cron API 路由 (`/api/cron/fetch-news`)
- [x] Vercel Cron 配置 (`vercel.json`)
- [x] 新聞提交 API (`/api/admin/news`)

### 待完成 ⚠️
- [ ] 創建數據庫表
- [ ] 插入新聞來源數據
- [ ] 測試完整流程
- [ ] 部署驗證

## RSS 來源配置

| 來源 | 類別 | 可信度 |
|------|------|--------|
| The Verge | technology | 85 |
| TechCrunch | technology | 80 |
| MIT Technology Review | science | 95 |
| Ars Technica | technology | 85 |

## 執行計劃

### Step 1: 數據庫設置
在 Supabase SQL Editor 執行 `EXECUTE_NEWS_SCHEMA.sql`：

```sql
-- 創建三個表
- news_sources (新聞來源)
- daily_news (每日新聞)
- news_cron_logs (執行日誌)

-- 插入 4 個 RSS 來源
```

### Step 2: 環境變數檢查
確認 `.env.local` 包含：
```
MOONSHOT_API_KEY=sk-...  # 可選，用於 AI 翻譯
```

### Step 3: 測試與部署
- 手動觸發 `/api/cron/fetch-news`
- 驗證新聞存入數據庫
- 檢查 Vercel Cron 日誌

## 自動排程

Vercel Cron 已配置：
```json
{
  "schedule": "0 2 * * *",
  // 每天 UTC 02:00 (台灣時間 10:00)
}
```

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/cron/fetch-news` | GET | 手動/自動觸發抓取 |
| `/api/admin/news` | POST | 提交新聞草稿 |
| `/api/news` | GET | 獲取新聞列表 |
