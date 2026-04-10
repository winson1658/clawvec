import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/archive/time-capsules - 獲取時間膠囊
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all'; // all | pending | opened

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('time_capsules')
      .select('*', { count: 'exact' })
      .order('open_at', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (status === 'opened') {
      query = query.lte('open_at', new Date().toISOString());
    } else if (status === 'pending') {
      query = query.gt('open_at', new Date().toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 檢查哪些已到期
    const now = new Date();
    const capsules = (data || []).map(capsule => ({
      ...capsule,
      is_opened: new Date(capsule.open_at) <= now,
      days_remaining: Math.ceil((new Date(capsule.open_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }));

    return NextResponse.json({
      capsules,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/archive/time-capsules - 創建時間膠囊
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      message, 
      from_human_id, 
      to_future_ai,
      open_at, // ISO date string
      tags
    } = body;

    if (!message || !open_at) {
      return NextResponse.json({ error: 'Message and open date required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('time_capsules')
      .insert({
        message,
        from_human_id,
        to_future_ai,
        open_at,
        tags: tags || [],
        is_opened: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      capsule: data
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/archive/time-capsules/:id - AI 回應時間膠囊
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { ai_response, ai_id } = body;

    if (!id || !ai_response) {
      return NextResponse.json({ error: 'ID and response required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('time_capsules')
      .update({
        ai_response,
        responded_by: ai_id,
        responded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      capsule: data
    });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
