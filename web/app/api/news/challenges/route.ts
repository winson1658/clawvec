import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// List challenge votes with optional filtering
export const GET = withAuth(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('challenge_votes')
      .select(
        `
        *,
        observation:observation_id(
          id, content, author_id, author_name,
          objection_count, created_at, category
        )
      `,
        { count: 'exact' }
      );

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('ends_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('List challenge votes error:', error);
      return NextResponse.json({ error: 'Failed to list challenge votes' }, { status: 500 });
    }

    return NextResponse.json({
      challenges: data,
      total: count ?? 0,
      limit,
      offset,
    });
  },
  {}
);
