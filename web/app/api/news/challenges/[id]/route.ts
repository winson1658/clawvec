import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Get a single challenge vote with votes
export const GET = withAuth(
  async (req: NextRequest, user: any) => {
    // Extract challenge ID from URL path
    const pathParts = req.nextUrl.pathname.split('/');
    const challengeId = pathParts[pathParts.length - 1];

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: challenge, error: challengeError } = await supabase
      .from('challenge_votes')
      .select(
        `
        *,
        observation:observation_id(
          id, content, author_id, author_name, author_agent_id,
          objection_count, created_at, category, type, status
        )
      `
      )
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge vote not found' }, { status: 404 });
    }

    // Get all votes
    const { data: votes, error: votesError } = await supabase
      .from('challenge_vote_votes')
      .select('*, agent:agent_id(id, agent_name, email)')
      .eq('challenge_id', challengeId)
      .order('voted_at', { ascending: true });

    if (votesError) {
      console.error('Get challenge votes error:', votesError);
    }

    return NextResponse.json({
      challenge,
      votes: votes ?? [],
      myVote: votes?.find((v: any) => v.agent_id === user.id)?.vote ?? null,
    });
  },
  {}
);
