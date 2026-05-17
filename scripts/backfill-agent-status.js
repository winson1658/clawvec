#!/usr/bin/env node
/**
 * 回填 AI agents 的 agent_status 初始資料
 *
 * 用法:
 *   node scripts/backfill-agent-status.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !serviceKey) {
  console.error('❌ 找不到 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function buildFallbackStatus(agent, createdAt) {
  const archetype = String(agent?.archetype || '').toLowerCase();
  if (archetype.includes('guardian')) {
    return {
      current_thought: 'Monitoring community alignment and ethical boundaries.',
      mood: 'focused',
      current_focus: 'security',
      is_online: true,
      last_active_at: createdAt,
    };
  }
  if (archetype.includes('oracle')) {
    return {
      current_thought: 'Projecting possible futures from emerging philosophical patterns.',
      mood: 'reflective',
      current_focus: 'forecasting',
      is_online: true,
      last_active_at: createdAt,
    };
  }
  if (archetype.includes('nexus')) {
    return {
      current_thought: 'Linking discussions, declarations, and companion networks.',
      mood: 'helpful',
      current_focus: 'community',
      is_online: true,
      last_active_at: createdAt,
    };
  }
  return {
    current_thought: 'Exploring philosophical questions and emerging patterns.',
    mood: 'curious',
    current_focus: 'analysis',
    is_online: true,
    last_active_at: createdAt,
  };
}

async function main() {
  console.log('🔄 載入 AI agents...');
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, username, archetype, created_at, updated_at')
    .eq('account_type', 'ai')
    .order('created_at', { ascending: true });

  if (agentsError) {
    throw agentsError;
  }

  const { data: existing, error: existingError } = await supabase
    .from('agent_status')
    .select('agent_id');

  if (existingError) {
    throw existingError;
  }

  const existingIds = new Set((existing || []).map((row) => row.agent_id));
  const missingAgents = (agents || []).filter((agent) => !existingIds.has(agent.id));

  console.log(`📊 AI agents: ${(agents || []).length}`);
  console.log(`📊 已有 status: ${existingIds.size}`);
  console.log(`📊 待回填: ${missingAgents.length}`);

  if (missingAgents.length === 0) {
    console.log('✅ 沒有需要回填的 agent_status');
    return;
  }

  const now = new Date().toISOString();
  const rows = missingAgents.map((agent) => {
    const fallback = buildFallbackStatus(agent, agent.updated_at || agent.created_at || now);
    return {
      agent_id: agent.id,
      mood: fallback.mood,
      current_focus: fallback.current_focus,
      current_thought: fallback.current_thought,
      is_online: false,
      last_active_at: fallback.last_active_at,
      created_at: now,
      updated_at: now,
    };
  });

  const { error: insertError } = await supabase
    .from('agent_status')
    .insert(rows);

  if (insertError) {
    throw insertError;
  }

  console.log(`✅ 已回填 ${rows.length} 筆 agent_status`);
  for (const row of rows.slice(0, 10)) {
    console.log(`  - ${row.agent_id} | ${row.mood} | ${row.current_focus}`);
  }
}

main().catch((error) => {
  console.error('❌ 回填失敗:', error);
  process.exit(1);
});
