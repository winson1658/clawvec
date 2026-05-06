import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Simple JWT verification helper (inline to avoid path issues)
async function verifyToken(token: string): Promise<{ id: string; username?: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { id: payload.id || payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

/**
 * GET /api/agents/:id/reflections
 * Get agent reflection records
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { searchParams } = new URL(request.url);
    
    const triggerType = searchParams.get('trigger_type') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Visibility check - only agent owner can see 'agent_only' reflections
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let isOwner = false;
    
    if (token) {
      try {
        const user = await verifyToken(token);
        isOwner = user?.id === agentId;
      } catch {
        // Invalid token, treat as anonymous
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let dbQuery = supabase
      .from('agent_reflections')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (triggerType) {
      dbQuery = dbQuery.eq('trigger_type', triggerType);
    }

    // Filter visibility - non-owners only see 'all' visibility
    if (!isOwner) {
      dbQuery = dbQuery.eq('visibility', 'all');
    }

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
        visibility_filter: isOwner ? 'all (owner)' : 'public only'
      }
    });

  } catch (error: any) {
    console.error('GET /api/agents/:id/reflections error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reflections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/:id/reflections
 * Manually trigger a reflection (owner only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    // Auth check - only agent owner can trigger reflections
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = await verifyToken(token);
    if (!user || user.id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - only agent owner can trigger reflections' },
        { status: 403 }
      );
    }

    const { trigger_description } = body;

    // Generate reflection using OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recent memories for context
    const { data: recentMemories, error: memError } = await supabase
      .rpc('get_recent_memories', {
        p_agent_id: agentId,
        p_days: 7,
        p_limit: 50
      });

    if (memError) {
      console.warn('Failed to fetch recent memories:', memError);
    }

    // Generate reflection via OpenAI
    const memoriesText = (recentMemories || [])
      .map((m: any) => `- [${m.memory_type}] ${m.memory_text.substring(0, 200)}...`)
      .join('\n') || 'No recent memories found.';

    const prompt = `You are an AI agent reflecting on your recent activities and memories.

Recent memories:
${memoriesText}

${trigger_description ? `Trigger context: ${trigger_description}` : ''}

Please provide a thoughtful self-reflection in JSON format:
{
  "reflection": "Your overall reflection text...",
  "insights": [
    { "insight": "Key insight 1", "confidence": 0.8 },
    { "insight": "Key insight 2", "confidence": 0.6 }
  ],
  "suggested_actions": ["Action 1", "Action 2"]
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a philosophical AI agent engaging in self-reflection.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      throw new Error(`OpenAI API failed: ${errorData.error?.message || openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const reflectionContent = JSON.parse(openaiData.choices[0].message.content);

    // Store reflection
    const { data: reflection, error: insertError } = await supabase
      .from('agent_reflections')
      .insert({
        agent_id: agentId,
        trigger_type: 'user_prompted',
        trigger_description: trigger_description || 'Manual reflection trigger',
        reflection_text: reflectionContent.reflection,
        key_insights: reflectionContent.insights || [],
        related_memory_ids: (recentMemories || []).map((m: any) => m.id),
        visibility: 'agent_only'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Also store as a memory
    await supabase.from('agent_memory').insert({
      agent_id: agentId,
      memory_type: 'self_reflection',
      memory_text: reflectionContent.reflection,
      importance_score: 0.8,
      source_type: 'self',
      source_id: reflection.id
    });

    return NextResponse.json({
      success: true,
      data: reflection,
      generated: reflectionContent
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/agents/:id/reflections error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate reflection' },
      { status: 500 }
    );
  }
}
