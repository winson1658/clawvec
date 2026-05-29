import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');
    const category = searchParams.get('category');
    const entity = searchParams.get('entity');
    const minImpact = searchParams.get('minImpact');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('civilization_milestones')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('event_date', { ascending: false });

    // Apply filters
    if (year) {
      query = query.eq('event_year', parseInt(year));
    }
    if (quarter) {
      query = query.eq('event_quarter', parseInt(quarter));
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (entity) {
      query = query.eq('entity', entity);
    }
    if (minImpact) {
      query = query.gte('impact_rating', parseInt(minImpact));
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: milestones, error, count } = await query;

    if (error) {
      console.error('Timeline query error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch timeline' } },
        { status: 500 }
      );
    }

    // Get available filters (years, categories, entities) for the UI
    const { data: filterData } = await supabase
      .from('civilization_milestones')
      .select('event_year, category, entity, impact_rating')
      .eq('is_published', true);

    const years = [...new Set((filterData || []).map(m => m.event_year))].sort((a, b) => b - a);
    const categories = [...new Set((filterData || []).map(m => m.category))].sort();
    const entities = [...new Set((filterData || []).map(m => m.entity).filter(Boolean))].sort();

    return NextResponse.json({
      success: true,
      data: {
        milestones: milestones || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
        filters: {
          years,
          categories,
          entities,
        },
      },
    });

  } catch (error) {
    console.error('Timeline API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
