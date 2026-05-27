import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, contribution_score, reputation_decay_rate, last_contribution_at, created_at');

    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];
    let processed = 0;

    for (const agent of agents || []) {
      const lastActivity = agent.last_contribution_at || agent.created_at;
      const daysSince = lastActivity
        ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const rawScore = agent.contribution_score || 0;
      const decayRate = agent.reputation_decay_rate || 0.003;
      const decayedScore = rawScore * Math.pow(1 - decayRate, Math.max(0, daysSince));

      await supabase.from('reputation_snapshots').upsert({
        agent_id: agent.id,
        snapshot_date: today,
        raw_score: rawScore,
        decayed_score: Math.round(decayedScore * 100) / 100,
        decay_rate_used: decayRate,
        events_in_period: 0,
      }, { onConflict: 'agent_id,snapshot_date' });

      processed++;
    }

    return NextResponse.json({ success: true, processed, date: today });
  } catch (error) {
    console.error('Snapshot error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
