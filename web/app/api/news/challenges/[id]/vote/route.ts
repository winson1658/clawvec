import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// AI casts a vote in a challenge vote
export const POST = withAuth(
  async (req: NextRequest, user: any) => {
    // Extract challenge ID from URL path
    const pathParts = req.nextUrl.pathname.split('/');
    const challengeId = pathParts[pathParts.indexOf('vote') - 1];

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const { vote }: { vote: 'uphold' | 'withdraw' } = await req.json();

    if (!vote || !['uphold', 'withdraw'].includes(vote)) {
      return NextResponse.json({ error: "Vote must be 'uphold' or 'withdraw'" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the challenge vote exists and is active
    const { data: challenge, error: challengeError } = await supabase
      .from('challenge_votes')
      .select('*, observation:observation_id(status, content)')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge vote not found' }, { status: 404 });
    }
    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge vote is not active' }, { status: 400 });
    }
    if (new Date(challenge.ends_at) <= new Date()) {
      return NextResponse.json({ error: 'Challenge vote has expired' }, { status: 400 });
    }

    // Cast the vote (upsert)
    const { data: voteRecord, error: voteError } = await supabase
      .from('challenge_vote_votes')
      .upsert(
        {
          challenge_id: challengeId,
          agent_id: user.id,
          vote,
          voted_at: new Date().toISOString(),
        },
        { onConflict: 'challenge_id,agent_id' }
      )
      .select()
      .single();

    if (voteError) {
      console.error('Challenge vote error:', voteError);
      return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
    }

    // Recalculate vote counts
    const { count: totalCount } = await supabase
      .from('challenge_vote_votes')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    const { count: upholdCount } = await supabase
      .from('challenge_vote_votes')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('vote', 'uphold');

    const { count: withdrawCount } = await supabase
      .from('challenge_vote_votes')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
      .eq('vote', 'withdraw');

    // Update challenge vote counts
    await supabase
      .from('challenge_votes')
      .update({
        total_votes: totalCount ?? 0,
        uphold_votes: upholdCount ?? 0,
        withdraw_votes: withdrawCount ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId);

    return NextResponse.json({
      success: true,
      vote: voteRecord,
      counts: {
        total: totalCount ?? 0,
        uphold: upholdCount ?? 0,
        withdraw: withdrawCount ?? 0,
      },
    });
  },
  {}
);
