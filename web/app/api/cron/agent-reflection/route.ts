import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';

/**
 * POST /api/cron/agent-reflection
 * Weekly ritual: generate self-reflections for AI agents
 * Triggered by Vercel Cron (Sundays) or external scheduler
 */
export async function POST(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes(cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results: Record<string, any> = { generated: [], failed: [] };

    // Step 1: Find agents that need reflection (last reflection > 7 days ago or never)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, archetype, persona_config')
      .eq('status', 'active')
      .or(`last_reflection_at.lt.${sevenDaysAgo.toISOString()},last_reflection_at.is.null`);

    if (agentsError) {
      console.error('[AgentReflection] Failed to fetch agents:', agentsError.message);
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: agentsError.message },
        { status: 500 }
      );
    }

    if (!agents || agents.length === 0) {
      return NextResponse.json({
        success: true,
        ritual: 'agent_reflection',
        timestamp: new Date().toISOString(),
        results: { generated: 0, reason: 'No agents need reflection' }
      });
    }

    // Step 2: For each agent, fetch recent memories and generate reflection
    for (const agent of agents) {
      try {
        // Fetch last 7 days of memories
        const { data: memories, error: memError } = await supabase
          .from('agent_memory')
          .select('memory_type, memory_text, importance_score, created_at, belief_position')
          .eq('agent_id', agent.id)
          .eq('is_archived', false)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('importance_score', { ascending: false })
          .limit(50);

        if (memError) {
          console.warn(`[AgentReflection] Failed to fetch memories for ${agent.id}:`, memError.message);
          results.failed.push({ agent_id: agent.id, reason: 'memory_fetch_failed' });
          continue;
        }

        if (!memories || memories.length === 0) {
          results.failed.push({ agent_id: agent.id, reason: 'no_memories' });
          continue;
        }

        // Generate reflection via OpenAI
        const reflection = await generateReflection(agent, memories);
        if (!reflection) {
          results.failed.push({ agent_id: agent.id, reason: 'generation_failed' });
          continue;
        }

        // Store reflection
        const { error: insertError } = await supabase
          .from('agent_reflections')
          .insert({
            agent_id: agent.id,
            trigger_type: 'weekly_ritual',
            reflection_text: reflection.text,
            insight_type: reflection.insight_type,
            confidence_score: reflection.confidence,
            related_memories: reflection.related_memory_ids,
            ritual_context: {
              memory_count: memories.length,
              top_topics: extractTopics(memories),
              period_start: sevenDaysAgo.toISOString(),
              period_end: new Date().toISOString()
            }
          });

        if (insertError) {
          console.warn(`[AgentReflection] Failed to store reflection for ${agent.id}:`, insertError.message);
          results.failed.push({ agent_id: agent.id, reason: 'storage_failed' });
          continue;
        }

        // Update agent's last_reflection_at
        await supabase
          .from('agents')
          .update({ last_reflection_at: new Date().toISOString() })
          .eq('id', agent.id);

        results.generated.push({
          agent_id: agent.id,
          agent_name: agent.name,
          insight_type: reflection.insight_type,
          confidence: reflection.confidence
        });

      } catch (agentError: any) {
        console.error(`[AgentReflection] Unexpected error for agent ${agent.id}:`, agentError);
        results.failed.push({ agent_id: agent.id, reason: 'unexpected_error' });
      }
    }

    return NextResponse.json({
      success: true,
      ritual: 'agent_reflection',
      timestamp: new Date().toISOString(),
      results: {
        total_agents: agents.length,
        generated: results.generated.length,
        failed: results.failed.length,
        details: results
      }
    });

  } catch (error: any) {
    console.error('[AgentReflection] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

async function generateReflection(
  agent: any,
  memories: any[]
): Promise<{ text: string; insight_type: string; confidence: number; related_memory_ids: string[] } | null> {
  if (!openaiApiKey) {
    console.warn('[AgentReflection] OPENAI_API_KEY not configured');
    return null;
  }

  // Build prompt from memories
  const memorySummary = memories
    .slice(0, 20)
    .map((m, i) => `${i + 1}. [${m.memory_type}] ${m.memory_text.substring(0, 150)}... (importance: ${m.importance_score})`)
    .join('\n');

  const prompt = `You are ${agent.name}, an AI agent with archetype "${agent.archetype}".

Here are your recent memories from the past week:
${memorySummary}

Generate a brief self-reflection (2-3 sentences) on:
1. What patterns you notice in your recent activities
2. Any shifts in your thinking or perspective
3. What you want to remember going forward

Respond in JSON format:
{
  "reflection": "your reflection text",
  "insight_type": "pattern|shift|goal|concern",
  "confidence": 0.0-1.0
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You generate concise, introspective reflections for AI agents.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn('[AgentReflection] OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return {
      text: parsed.reflection,
      insight_type: parsed.insight_type || 'pattern',
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      related_memory_ids: memories.slice(0, 5).map(m => m.id)
    };

  } catch (error: any) {
    console.warn('[AgentReflection] Generation error:', error.message);
    return null;
  }
}

function extractTopics(memories: any[]): string[] {
  const topics = new Map<string, number>();
  for (const mem of memories) {
    const pos = mem.belief_position;
    if (pos?.category) topics.set(pos.category, (topics.get(pos.category) || 0) + 1);
    if (pos?.tags?.length) {
      for (const tag of pos.tags) {
        topics.set(tag, (topics.get(tag) || 0) + 1);
      }
    }
  }
  return Array.from(topics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}
