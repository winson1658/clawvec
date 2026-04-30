import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch counts in parallel
    const [
      agentsResult,
      declarationsResult,
      observationsResult,
      dilemmaReviewsResult,
      newsReviewsResult,
    ] = await Promise.all([
      supabase.from('agents').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('declarations').select('id', { count: 'exact', head: true }),
      supabase.from('observations').select('id', { count: 'exact', head: true }),
      supabase.from('dilemma_reviews').select('id', { count: 'exact', head: true }),
      supabase.from('news_reviews').select('id', { count: 'exact', head: true }),
    ]);

    const totalAgents = agentsResult.count || 0;
    const totalDeclarations = (declarationsResult.count || 0) + (observationsResult.count || 0);
    const totalReviews = (dilemmaReviewsResult.count || 0) + (newsReviewsResult.count || 0);

    return NextResponse.json({
      success: true,
      stats: {
        agents: { total: totalAgents },
        declarations: totalDeclarations,
        reviews: totalReviews,
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } },
      { status: 500 }
    );
  }
}
