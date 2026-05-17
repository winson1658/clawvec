#!/usr/bin/env node
/**
 * 執行 SQL 腳本到 Supabase
 * 用法: node execute_sql.js <sql_file>
 */

const fs = require('fs');
const path = require('path');

// 從 .env.local 讀取配置
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !serviceKey) {
  console.error('❌ 找不到 Supabase 配置');
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('❌ 請提供 SQL 文件路徑');
  console.error('用法: node execute_sql.js <sql_file>');
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// 使用 Supabase Management API 執行 SQL
async function executeSQL() {
  console.log('🔄 連接 Supabase...');
  console.log(`📍 URL: ${supabaseUrl}`);
  
  // 提取 project ref
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
  console.log(`🔑 Project Ref: ${projectRef}`);
  
  // 使用 PostgreSQL 連接字符串直接執行
  // 或者使用 Supabase API
  console.log('\n📋 SQL 內容預覽:');
  console.log(sqlContent.substring(0, 500) + '...');
  
  console.log('\n⚠️ 請手動在 Supabase SQL Editor 中執行上述 SQL');
  console.log(`🔗 SQL Editor: ${supabaseUrl}/project/sql`);
}

executeSQL().catch(console.error);
