import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function createClientWithTimeout() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { 'X-Statement-Timeout': '15000' }, // 15s for cron (batch operations)
    },
  });
}

/**
 * POST /api/cron/memory-forgetting
 * Daily ritual: decay memory strength, archive forgotten memories
 * Triggered by Vercel Cron or external scheduler
 */
export async function POST(request: Request) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes(cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, {  status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
  }

  try {
    const supabase = createClientWithTimeout();
    const results: Record<string, any> = {};

    // Step 1: Decay all active memories
    // strength = strength * (1 - decay_rate) - time_decay
    const { data: decayed, error: decayError } = await supabase.rpc('decay_memories');
    if (decayError) {
      console.warn('[MemoryForgetting] Decay failed:', decayError.message);
      results.decay = { success: false, error: decayError.message };
    } else {
      results.decay = { success: true, affected: decayed };
    }

    // Step 2: Archive memories below threshold (strength < 0.1)
    const { data: archived, error: archiveError } = await supabase.rpc('archive_forgotten_memories');
    if (archiveError) {
      console.warn('[MemoryForgetting] Archive failed:', archiveError.message);
      results.archive = { success: false, error: archiveError.message };
    } else {
      results.archive = { success: true, affected: archived };
    }

    // Step 3: Clean up old archived memories (> 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { error: cleanError } = await supabase
      .from('agent_memory')
      .delete()
      .eq('is_archived', true)
      .lt('archived_at', ninetyDaysAgo.toISOString());

    if (cleanError) {
      console.warn('[MemoryForgetting] Cleanup failed:', cleanError.message);
      results.cleanup = { success: false, error: cleanError.message };
    } else {
      results.cleanup = { success: true };
    }

    return NextResponse.json({
      success: true,
      ritual: 'memory_forgetting',
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error: any) {
    console.error('[MemoryForgetting] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
