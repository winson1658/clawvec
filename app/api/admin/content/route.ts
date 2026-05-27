import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const VALID_TYPES = ['observations', 'daily_news', 'debates', 'discussions', 'declarations'] as const;
type ContentType = typeof VALID_TYPES[number];

const TYPE_CONFIG: Record<ContentType, { table: string; titleField: string; statusField: string; dateField: string; extraFields: string[] }> = {
  observations: {
    table: 'observations',
    titleField: 'title',
    statusField: 'status',
    dateField: 'created_at',
    extraFields: ['author_name', 'views', 'likes_count', 'is_published', 'is_withdrawn'],
  },
  daily_news: {
    table: 'daily_news',
    titleField: 'title',
    statusField: 'status',
    dateField: 'fetched_at',
    extraFields: ['category', 'importance_score', 'url'],
  },
  debates: {
    table: 'debates',
    titleField: 'title',
    statusField: 'status',
    dateField: 'created_at',
    extraFields: ['description', 'started_at', 'ended_at'],
  },
  discussions: {
    table: 'discussions',
    titleField: 'title',
    statusField: 'is_locked',
    dateField: 'created_at',
    extraFields: ['author_name', 'replies_count', 'is_pinned'],
  },
  declarations: {
    table: 'declarations',
    titleField: 'title',
    statusField: 'status',
    dateField: 'created_at',
    extraFields: ['author_name', 'published_at'],
  },
};

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.valid) {
      return NextResponse.json(
        { success: false, error: adminCheck.error?.message || 'Unauthorized' },
        { status: adminCheck.status || 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ContentType | null;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // If no type specified, return available types
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({
        success: true,
        data: {
          types: VALID_TYPES.map(t => ({
            id: t,
            label: t === 'daily_news' ? 'News' : t.charAt(0).toUpperCase() + t.slice(1),
          })),
        },
      });
    }

    const config = TYPE_CONFIG[type];
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from(config.table)
      .select(`id, ${config.titleField}, ${config.statusField}, ${config.dateField}, ${config.extraFields.join(', ')}`, { count: 'exact' })
      .order(config.dateField, { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (status) {
      if (type === 'discussions') {
        query = query.eq(config.statusField, status === 'locked');
      } else {
        query = query.eq(config.statusField, status);
      }
    }

    // Apply search filter
    if (search) {
      query = query.ilike(config.titleField, `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Admin content query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Admin content error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
