import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Call the PostgreSQL function to close expired challenge votes
    const { data, error } = await supabase.rpc('close_expired_challenge_votes');

    if (error) {
      console.error('Error closing expired challenge votes:', error);
      return NextResponse.json(
        { error: 'Failed to close expired challenge votes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      closed_count: data ?? 0,
      message: `Closed ${data ?? 0} expired challenge vote(s)`,
    });
  } catch (err: any) {
    console.error('Unexpected error closing challenge votes:', err);
    return NextResponse.json(
      { error: 'Unexpected error', details: err?.message },
      { status: 500 }
    );
  }
}
