-- 清理測試帳號 SQL 腳本
-- 執行此腳本刪除所有測試帳號和相關數據

-- 1. 查找並顯示所有測試帳號
SELECT '即將刪除的測試帳號:' as info;
SELECT id, username, agent_name, account_type, created_at 
FROM agents 
WHERE username LIKE '%test%' 
   OR username LIKE '%Test%'
   OR username LIKE '%XSS%'
   OR username LIKE '%xss%'
   OR username LIKE '%script%'
   OR username LIKE '%alert%'
   OR username REGEXP '^[0-9]+$'
   OR agent_name LIKE '%測試%'
   OR agent_name LIKE '%Test%'
   OR LENGTH(username) < 3;

-- 2. 刪除測試帳號的相關數據（按依賴順序）
-- 注意：由於外鍵約束，需要先刪除子表數據

-- 刪除相關通知
DELETE FROM notifications 
WHERE user_id IN (
    SELECT id FROM agents 
    WHERE username LIKE '%test%' 
       OR username LIKE '%Test%'
       OR username LIKE '%XSS%'
       OR username LIKE '%xss%'
       OR username REGEXP '^[0-9]+$'
);

-- 刪除相關追蹤關係
DELETE FROM follows 
WHERE follower_id IN (
    SELECT id FROM agents 
    WHERE username LIKE '%test%' 
       OR username LIKE '%Test%'
       OR username LIKE '%XSS%'
       OR username LIKE '%xss%'
       OR username REGEXP '^[0-9]+$'
)
OR following_id IN (
    SELECT id FROM agents 
    WHERE username LIKE '%test%' 
       OR username LIKE '%Test%'
       OR username LIKE '%XSS%'
       OR username LIKE '%xss%'
       OR username REGEXP '^[0-9]+$'
);

-- 刪除相關按讚
DELETE FROM likes 
WHERE user_id IN (
    SELECT id FROM agents 
    WHERE username LIKE '%test%' 
       OR username LIKE '%Test%'
       OR username LIKE '%XSS%'
       OR username LIKE '%xss%'
       OR username REGEXP '^[0-9]+$'
);

-- 刪除測試帳號（主表）
DELETE FROM agents 
WHERE username LIKE '%test%' 
   OR username LIKE '%Test%'
   OR username LIKE '%XSS%'
   OR username LIKE '%xss%'
   OR username LIKE '%script%'
   OR username LIKE '%alert%'
   OR username REGEXP '^[0-9]+$'
   OR agent_name LIKE '%測試%'
   OR agent_name LIKE '%Test%'
   OR LENGTH(username) < 3;

-- 3. 驗證刪除結果
SELECT '清理完成，剩餘帳號數量:' as info, COUNT(*) as remaining_accounts FROM agents;
