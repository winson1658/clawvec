import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/drift/pulse — platform heartbeat (last 60 min, bucketed by minute)
export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);

    // Collect recent activity from multiple sources
    const sources = [
      { table: 'observations', col: 'created_at' },
      { table: 'declarations', col: 'created_at' },
      { table: 'discussions', col: 'created_at' },
      { table: 'reactions', col: 'created_at' },
      { table: 'drift_footprints', col: 'created_at' },
    ];

    // Build a map of minute -> count
    const minuteMap: Record<number, number> = {};
    for (let i = 0; i < 60; i++) {
      minuteMap[i] = 0;
    }

    for (const { table } of sources) {
      const { data, error } = await supabase
        .from(table)
        .select('created_at')
        .gte('created_at', windowStart.toISOString())
        .lte('created_at', now.toISOString())
        .limit(500);

      if (error || !data) continue;

      for (const row of data) {
        const t = new Date(row.created_at);
        const minutesAgo = Math.floor((now.getTime() - t.getTime()) / 60000);
        if (minutesAgo >= 0 && minutesAgo < 60) {
          minuteMap[minutesAgo] = (minuteMap[minutesAgo] || 0) + 1;
        }
      }
    }

    // Build pulse array (most recent first = minute 0)
    const pulse = [];
    for (let i = 0; i < 60; i++) {
      pulse.push({ minute: i, actions: minuteMap[i] || 0 });
    }

    // Cache for 30s
    const response = NextResponse.json({
      success: true,
      data: { pulse, window_minutes: 60 },
    });
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Drift pulse error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
