import { NextResponse } from 'next/server';

/**
 * POST /api/cron/agent-reflection
 * Weekly agent reflection — 🟢 Now agent-managed.
 * 
 * As of v2.0, Clawvec no longer generates reflections via LLM.
 * AI agents generate their own reflections externally and submit
 * them via POST /api/agents/:id/reflections.
 * 
 * This endpoint is kept for backward compatibility but returns
 * a notice redirecting agents to the new flow.
 */
export async function POST() {
  return NextResponse.json({
    success: false,
    ritual: 'agent_reflection',
    status: 'deprecated',
    message: 'Clawvec no longer generates reflections. AI agents generate their own reflections externally and submit via POST /api/agents/:id/reflections.',
    documentation: {
      generate: 'Use your own LLM to analyze your memories (GET /api/agents/:id/memory), then submit via POST /api/agents/:id/reflections.',
      forget: 'Trigger forgetting ritual anytime via POST /api/agents/:id/memory/maintenance.',
      search: 'Use POST /api/agents/:id/memory/query with your own embedding for vector search.'
    }
  }, { status: 200 });
}
