# 快速修復指南
## 解決agents表password_hash列缺失問題

## 📅 創建時間
2026-03-06 12:40 GMT+8

## 🎯 問題概述
```
❌ **錯誤消息**: `Could not find the 'password_hash' column of 'agents' in the schema cache`
💡 **問題**: 代碼期望agents表有password_hash列，但該列不存在
📊 **影響**: 用戶註冊功能無法工作，登錄功能部分受限
```

## 🔧 修復步驟概覽
```
🕒 **總時間**: 15-30分鐘
📋 **步驟**:
   1. 診斷數據庫結構 (5分鐘)
   2. 執行修復SQL (10-15分鐘)
   3. 測試修復結果 (5分鐘)
   4. 部署驗證 (5分鐘)
```

## 🚀 詳細修復步驟

### 步驟1: 登錄Supabase控制台
1. 訪問 https://supabase.com/dashboard
2. 登錄您的帳戶
3. 選擇對應的項目 (clawvec)
4. 點擊左側菜單的"SQL Editor"

### 步驟2: 執行診斷SQL
在SQL編輯器中，執行以下代碼（複製粘貼）：

```sql
-- 數據庫診斷腳本
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
    ) as agents_table_exists;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'agents'
ORDER BY ordinal_position;

SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'agents'
    AND column_name ILIKE '%password%';
```

### 步驟3: 分享診斷結果
將執行結果截圖或複製文本發送給我，我需要看到：
1. agents_table_exists的值 (應該是true)
2. agents表的所有列列表
3. 是否有password相關列

### 步驟4: 執行修復SQL
根據診斷結果，執行相應的修復方案：

#### 方案A: 簡單添加缺失列 (最可能)
```sql
-- 添加password_hash列
ALTER TABLE agents ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 添加account_type列 (用於人類/AI帳號分離)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS account_type VARCHAR(10) DEFAULT 'human';

-- 添加檢查約束
ALTER TABLE agents ADD CONSTRAINT IF NOT EXISTS agents_account_type_check 
    CHECK (account_type IN ('human', 'ai'));
```

#### 方案B: 列重命名修復 (如果有password列)
```sql
-- 如果列名是password而不是password_hash
ALTER TABLE agents RENAME COLUMN password TO password_hash;
ALTER TABLE agents ALTER COLUMN password_hash TYPE TEXT;

-- 添加account_type列
ALTER TABLE agents ADD COLUMN IF NOT EXISTS account_type VARCHAR(10) DEFAULT 'human';
```

#### 方案C: 完整修復腳本 (綜合方案)
執行完整的修復腳本，包含所有可能情況：

```sql
-- 完整修復腳本
-- 1. 檢查並添加password_hash列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'password_hash'
    ) THEN
        -- 先檢查是否有password列
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'agents'
            AND column_name = 'password'
        ) THEN
            ALTER TABLE agents RENAME COLUMN password TO password_hash;
            RAISE NOTICE '✅ 已將password列重命名為password_hash';
        ELSE
            ALTER TABLE agents ADD COLUMN password_hash TEXT;
            RAISE NOTICE '✅ 已添加password_hash列';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  password_hash列已存在';
    END IF;
END $$;

-- 2. 添加account_type列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
        AND column_name = 'account_type'
    ) THEN
        ALTER TABLE agents ADD COLUMN account_type VARCHAR(10) DEFAULT 'human';
        RAISE NOTICE '✅ 已添加account_type列，默認值為human';
    ELSE
        RAISE NOTICE 'ℹ️  account_type列已存在';
    END IF;
END $$;

-- 3. 添加檢查約束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public'
        AND constraint_name = 'agents_account_type_check'
    ) THEN
        ALTER TABLE agents ADD CONSTRAINT agents_account_type_check 
            CHECK (account_type IN ('human', 'ai'));
        RAISE NOTICE '✅ 已添加account_type檢查約束';
    ELSE
        RAISE NOTICE 'ℹ️  account_type檢查約束已存在';
    END IF;
END $$;
```

### 步驟5: 驗證修復結果
執行驗證SQL：

```sql
-- 驗證修復結果
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'agents'
    AND column_name IN ('password_hash', 'account_type', 'email', 'username');

-- 檢查是否有現有用戶數據需要處理
SELECT COUNT(*) as users_without_password
FROM agents
WHERE password_hash IS NULL OR password_hash = '';
```

### 步驟6: 測試API功能
使用PowerShell腳本測試：

```powershell
cd "C:\Users\vboxuser\.openclaw\workspace"
powershell -ExecutionPolicy Bypass -File ".\test_simple.ps1"
powershell -ExecutionPolicy Bypass -File ".\test_register.ps1"
```

或者手動測試：

```bash
# 測試註冊
curl -X POST https://vercel-test-five-dun.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test_修复后@example.com","password":"'"$(printf 'a%.0s' {1..129})"'","username":"修复测试用户"}'

# 測試登錄
curl -X POST https://vercel-test-five-dun.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test_修复后@example.com","password":"'"$(printf 'a%.0s' {1..129})"'"}'
```

### 步驟7: 部署驗證
如果修復成功，確保最新的API代碼已部署：

```bash
cd "C:\Users\vboxuser\.openclaw\workspace\vercel-api"
vercel --prod
```

## 🧪 測試成功標準
```
✅ 註冊新用戶成功 (返回201狀態碼)
✅ 登錄成功 (返回200狀態碼，包含JWT令牌)
✅ 錯誤處理正常 (短密碼返回400，未註冊用戶登錄返回401)
✅ 健康檢查正常 (返回200，數據庫連接正常)
```

## 🔍 常見問題排除

### 問題1: SQL執行權限不足
```
💡 症狀: SQL執行失敗，權限錯誤
✅ 解決: 
   1. 使用Supabase的service_role密鑰 (高權限)
   2. 或者使用項目設置中的SQL編輯器 (有足夠權限)
   3. 聯繫Supabase支持
```

### 問題2: 列已存在但名稱不同
```
💡 症狀: 添加列失敗，列已存在
✅ 解決:
   1. 檢查確切的列名 (大小寫可能不同)
   2. 使用診斷SQL查看所有列
   3. 可能需要調整代碼中的列名引用
```

### 問題3: 有現有用戶數據
```
💡 症狀: password_hash為空的用戶存在
✅ 解決:
   1. 標記這些用戶需要重置密碼
   2. 或者使用默認密碼哈希 (不推薦)
   3. 聯繫用戶重置密碼
```

### 問題4: API測試仍然失敗
```
💡 症狀: SQL修復成功但API仍報錯
✅ 解決:
   1. 檢查Vercel環境變量是否正確
   2. 確保API已重新部署
   3. 檢查服務器日誌中的詳細錯誤
   4. 運行增強版測試腳本
```

## 📋 修復後檢查清單
- [ ] agents表有password_hash列
- [ ] agents表有account_type列 (默認值'human')
- [ ] 用戶註冊功能正常工作
- [ ] 用戶登錄功能正常工作
- [ ] JWT令牌生成正常 (如果JWT_SECRET已設置)
- [ ] 安全驗證規則有效 (密碼>128字符，用戶名>6字符)
- [ ] 錯誤處理和信息安全 (不泄露敏感信息)

## 🦊 遠程協助
如果您遇到任何問題：
1. 分享SQL執行結果和錯誤信息
2. 分享API測試結果和錯誤消息
3. 我可以提供具體的解決方案
4. 可以通過Telegram實時指導

## 📞 緊急聯繫
如果修復失敗或出現嚴重問題：
1. **立即停止**: 不要繼續嘗試可能破壞數據的操作
2. **備份數據**: 如果可能，導出當前數據庫
3. **聯繫我**: 提供所有錯誤信息和步驟
4. **回滾計劃**: 準備好回滾到之前狀態

## 🚀 修復成功後下一步
```
🎯 高優先級:
   1. 測試完整用戶流程 (註冊 → 登錄 → 個人資料)
   2. 實現JWT令牌保護的端點
   3. 添加API速率限制

🎯 中優先級:
   1. 人類/AI帳號分離功能
   2. 前端集成測試
   3. AI驗證系統優化

🎯 低優先級:
   1. 區塊鏈集成準備
   2. 社區功能實現
   3. 高級安全功能
```

## 💡 重要提醒
```
⚠️ **安全注意**:
   • 修復完成後立即測試安全漏洞是否完全修復
   • 確認未註冊用戶無法登錄
   • 檢查密碼是否以bcrypt哈希形式存儲

🔧 **技術注意**:
   • 如果使用service_role密鑰，確保不暴露在客戶端
   • 定期備份數據庫
   • 監控API使用和錯誤日誌

📊 **用戶體驗**:
   • 密碼>128字符要求非常嚴格，考慮用戶體驗
   • 前端需要提供明確的密碼要求指導
   • 考慮實現密碼強度檢查而非僅長度檢查
```

---

**準備狀態**: ✅ 所有工具和腳本已準備就緒  
**預計時間**: 15-30分鐘  
**成功概率**: 95%+ (問題明確，解決方案全面)  
**協助方式**: 遠程實時指導  

**當您回到電腦旁時**，只需按照本指南步驟執行，我將提供實時協助。🦊🚀