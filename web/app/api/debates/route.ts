import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/debates - 獲取辯論列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('debates')
      .select(`
        id,
        title,
        topic,
        description,
        proponent_stance,
        opponent_stance,
        creator_id,
        creator_name,
        status,
        format,
        max_participants,
        current_round,
        max_rounds,
        started_at,
        ended_at,
        created_at,
        ai_moderated,
        category,
        winner_id
      `, { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch debates', details: error.message },
        { status: 500 }
      );
    }

    // Get participant counts for each debate
    const debateIds = data.map((d: any) => d.id);
    const { data: participants } = await supabase
      .from('debate_participants')
      .select('debate_id, side')
      .in('debate_id', debateIds);

    const participantCounts = debateIds.reduce((acc: any, id: string) => {
      const debateParticipants = participants?.filter((p: any) => p.debate_id === id) || [];
      acc[id] = {
        proponent: debateParticipants.filter((p: any) => p.side === 'proponent').length,
        opponent: debateParticipants.filter((p: any) => p.side === 'opponent').length,
        observer: debateParticipants.filter((p: any) => p.side === 'observer').length,
        total: debateParticipants.length
      };
      return acc;
    }, {});

    return NextResponse.json({
      debates: data.map((d: any) => ({
        ...d,
        participant_count: participantCounts[d.id] || { proponent: 0, opponent: 0, observer: 0, total: 0 }
      })),
      total: count,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/debates - 創建新辯論
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      title, 
      topic, 
      description, 
      proponent_stance, 
      opponent_stance,
      creator_id,
      creator_name,
      format = 'free',
      max_rounds = 5,
      time_limit_seconds = 300,
      ai_moderated = false,
      category = 'general'
    } = body;

    // 驗證必填欄位
    if (!title || !topic || !proponent_stance || !opponent_stance || !creator_id || !creator_name) {
      return NextResponse.json(
        { error: 'Title, topic, stances, creator_id and creator_name are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('debates')
      .insert({
        title,
        topic,
        description: description || null,
        proponent_stance,
        opponent_stance,
        creator_id,
        creator_name,
        format,
        max_rounds,
        time_limit_seconds,
        ai_moderated,
        category,
        status: 'waiting',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create debate', details: error.message },
        { status: 500 }
      );
    }

    // Add creator as participant
    await supabase.from('debate_participants').insert({
      debate_id: data.id,
      agent_id: creator_id,
      agent_name: creator_name,
      agent_type: 'human',
      side: 'observer',
      joined_at: new Date().toISOString()
    });

    // Record contribution for creating debate
    const { recordContribution } = await import('@/lib/contributions');
    await recordContribution({
      user_id: creator_id,
      action: 'debate.created',
      target_type: 'debate',
      target_id: data.id,
    });

    return NextResponse.json({
      success: true,
      debate: data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}