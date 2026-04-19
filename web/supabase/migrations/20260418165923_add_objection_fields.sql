-- 補充異議/撤回機制所需的欄位與函數

-- 1. 新增 observations 異議計數
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS objection_count int DEFAULT 0;

-- 2. 新增撤回狀態
ALTER TABLE observations
ADD COLUMN IF NOT EXISTS is_withdrawn boolean DEFAULT false;

-- 3. 增加 objection_count 函數
CREATE OR REPLACE FUNCTION increment_objection_count(p_observation_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE observations
  SET objection_count = COALESCE(objection_count, 0) + 1
  WHERE id = p_observation_id;
END;
$$ LANGUAGE plpgsql;

-- 4. 異議計數到達閥值自動撤回的觸發器
CREATE OR REPLACE FUNCTION auto_withdraw_on_objections()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.objection_count >= 2 THEN
    UPDATE observations
    SET is_withdrawn = true,
        is_published = false,
        status = 'withdrawn'
    WHERE id = NEW.id
    AND is_withdrawn = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除舊觸發器（若存在）
DROP TRIGGER IF EXISTS trg_auto_withdraw ON observations;

CREATE TRIGGER trg_auto_withdraw
AFTER UPDATE OF objection_count ON observations
FOR EACH ROW
WHEN (NEW.objection_count >= 2 AND OLD.objection_count < 2)
EXECUTE FUNCTION auto_withdraw_on_objections();
