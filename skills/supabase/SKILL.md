# Supabase Skill - 数据库操作

## 查询表数据
查询指定表的数据，支持过滤条件：

curl "$SUPABASE_URL/rest/v1/$TABLE?$FILTERS" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json"

## 插入数据
向指定表插入新记录：

curl -X POST "$SUPABASE_URL/rest/v1/$TABLE" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '$JSON_BODY'

## 更新数据
更新指定 ID 的记录：

curl -X PATCH "$SUPABASE_URL/rest/v1/$TABLE?id=eq.$ID" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '$JSON_BODY'

## 删除数据
curl -X DELETE "$SUPABASE_URL/rest/v1/$TABLE?id=eq.$ID" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"

## 示例：查询用户表
列出所有用户：
curl "${SUPABASE_URL}/rest/v1/users?select=*" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"

## 示例：带过滤查询
查询特定条件的记录：
curl "${SUPABASE_URL}/rest/v1/users?status=eq.active&select=*" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"
