import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/ai/companion/my-companions - 獲取用戶的 AI 夥伴列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const { data: companions, error } = await supabase
      .from('ai_companions')
      .select(`
        *,
        companion:companion_agent_id (
          id,
          username,
          archetype,
          is_verified,
          agent_status (
            current_thought,
            mood,
            is_online
          )
        )
      `)
      .eq('user_id', user_id)
      .order('last_interaction_at', { ascending: false });

    if (error) {
      console.error('Get my companions error:', error);
      return NextResponse.json(
        { error: 'Failed to get companions' },
        { status: 500 }
      );
    }

    // 格式化響應
    const formattedCompanions = companions?.map((c: any) => ({
      id: c.id,
      relationship_type: c.relationship_type,
      interaction_style: c.interaction_style,
      interaction_count: c.interaction_count,
      last_interaction_at: c.last_interaction_at,
      created_at: c.created_at,
      companion: {
        id: c.companion?.id,
        username: c.companion?.username,
        archetype: c.companion?.archetype,
        is_verified: c.companion?.is_verified,
        status: c.companion?.agent_status?.[0] || {
          current_thought: 'Ready to help.',
          mood: 'helpful',
          is_online: true
        }
      }
    })) || [];

    return NextResponse.json({
      success: true,
      companions: formattedCompanions
    });

  } catch (error) {
    console.error('Get my companions error:', error);
    return NextResponse.json(
      { error: 'Failed to get companions' },
      { status: 500 }
    );
  }
}
