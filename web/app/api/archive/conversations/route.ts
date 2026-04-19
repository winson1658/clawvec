import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/archive/conversations - 獲取歷史對話
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'all'; // all | human-ai | milestone

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('archived_conversations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type !== 'all') {
      query = query.eq('conversation_type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      // Gracefully handle missing table
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          conversations: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      conversations: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/archive/conversations - 存檔對話
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      title, 
      participants, 
      messages, 
      topic,
      human_id,
      ai_ids,
      significance_score,
      tags
    } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('archived_conversations')
      .insert({
        title,
        participants,
        messages,
        topic,
        human_id,
        ai_ids,
        significance_score: significance_score || 0,
        tags: tags || [],
        conversation_type: 'human-ai',
        archived_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conversation: data
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
