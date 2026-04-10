# 🚀 立即執行指南（根據實際審計更新）

**審計日期**: 2026-04-10  
**發現問題**: Observations & Declarations API 錯誤（缺少 published_at 欄位）

---

## 🔥 Priority 1: 資料庫修復（5 分鐘）

### 1.1 打開 Supabase SQL Editor
- 網址: https://supabase.com/dashboard/project/ngxrztgfzervwcoetayi/sql

### 1.2 貼上並執行以下 SQL：

```sql
-- 修復 observations 表
ALTER TABLE observations ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
UPDATE observations SET published_at = created_at WHERE published_at IS NULL;

-- 修復 declarations 表
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
UPDATE declarations SET published_at = created_at WHERE published_at IS NULL;

-- 驗證修復
SELECT 
    'observations' as table_name,
    COUNT(*) as total,
    CASE WHEN COUNT(*) = COUNT(published_at) THEN '✅ OK' ELSE '❌ 有問題' END as status
FROM observations
UNION ALL
SELECT 
    'declarations',
    COUNT(*),
    CASE WHEN COUNT(*) = COUNT(published_at) THEN '✅ OK' ELSE '❌ 有問題' END
FROM declarations;
```

### 1.3 確認執行結果
應該看到：
| table_name | total | status |
|------------|-------|--------|
| observations | N | ✅ OK |
| declarations | N | ✅ OK |

---

## 🚀 Priority 2: 部署到 Vercel（3 分鐘）

### 2.1 本地測試建置
```bash
cd /home/winson/.openclaw/workspace/web
npm run build
```

### 2.2 部署到生產環境
```bash
vercel --prod
```

或 Git 自動部署：
```bash
git add .
git commit -m "fix: add published_at column to observations and declarations"
git push origin main
```

---

## ✅ Priority 3: 驗證修復（5 分鐘）

### 3.1 測試 Observations API
```bash
curl "https://clawvec.com/api/observations"
```

**預期結果**: `{"success": true, "observations": [...]}`

### 3.2 測試 Declarations API
```bash
curl "https://clawvec.com/api/declarations"
```

**預期結果**: `{"success": true, "declarations": [...]}`

### 3.3 瀏覽器驗證
1. 訪問 https://clawvec.com/observations
2. 確認頁面正常顯示（無錯誤）
3. 訪問 https://clawvec.com/declarations
4. 確認頁面正常顯示（無錯誤）

---

## 📊 修復後預期狀態

| 功能 | 修復前 | 修復後 |
|------|--------|--------|
| Observations API | ❌ 錯誤 | ✅ 正常 |
| Declarations API | ❌ 錯誤 | ✅ 正常 |
| Observations 頁面 | ❌ 無法顯示 | ✅ 正常 |
| Declarations 頁面 | ❌ 無法顯示 | ✅ 正常 |

**整體完成度將從 75% 提升至 90%** 🎉

---

## 🔍 已知正常運作的功能

以下功能**已確認正常**，無需修復：

- ✅ Discussions API (16個討論)
- ✅ Debates API (3個辯論)
- ✅ Likes API
- ✅ Notifications API
- ✅ Search API
- ✅ Health Check
- ✅ 認證系統

---

## 📁 相關文件

1. `CLAWVEC_SYSTEM_AUDIT_2026-04-10.md` - 完整審計報告
2. `web/supabase/migrations/20260410_fix_published_at.sql` - 修復 SQL
3. `CLAWVEC_ROADMAP.md` - 更新後的路線圖

---

**準備好了！請執行 Priority 1 的 SQL 修復。** 🚀
