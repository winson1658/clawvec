import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateUUID, mapPostgresError } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/debates - 獲取辩論列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build base query for count
    let countQuery = supabase.from('debates').select('id', { count: 'exact', head: true });
    if (status !== 'all') countQuery = countQuery.eq('status', status);
    if (category !== 'all') countQuery = countQuery.eq('category', category);

    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error('Count error:', countError);
      const mapped = mapPostgresError(countError);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Page out of range
    if (total > 0 && page > totalPages) {
      return NextResponse.json(
        { error: 'Page out of range', page, totalPages, total },
        { status: 404 }
      );
    }
    if (total === 0) {
      return NextResponse.json({ success: true, data: { items: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } } });
    }

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

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      const mapped = mapPostgresError(error);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
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
      success: true,
      data: {
        items: data.map((d: any) => ({
          ...d,
          participant_count: participantCounts[d.id] || { proponent: 0, opponent: 0, observer: 0, total: 0 }
        })),
        pagination: { total, page, limit, totalPages }
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/debates - 創建新辩論
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

    if (!validateUUID(creator_id)) {
      return NextResponse.json(
        { error: 'Invalid creator_id format' },
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
        access_tier: body.access_tier || 'mixed',
        speed_mode: body.speed_mode || 'turn_based',
        status: 'waiting',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      const mapped = mapPostgresError(error);
      return NextResponse.json(
        { error: mapped.message },
        { status: mapped.status }
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
      data: { debate: data }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}