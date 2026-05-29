/**
 * Belief Graph API
 * GET /api/belief-graph — Query belief nodes and edges
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build node query
    let nodeQuery = supabase.from('belief_nodes').select('*');

    const agentId = searchParams.get('agent_id');
    const domain = searchParams.get('domain');
    const sourceType = searchParams.get('source_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    if (agentId) nodeQuery = nodeQuery.eq('agent_id', agentId);
    if (domain) nodeQuery = nodeQuery.eq('domain', domain);
    if (sourceType) nodeQuery = nodeQuery.eq('source_type', sourceType);

    const { data: nodes, error: nodeError } = await nodeQuery.limit(limit).order('created_at', { ascending: false });

    if (nodeError) {
      console.error('Belief graph node query error:', nodeError);
      return NextResponse.json(
        { success: false, error: 'Failed to query belief nodes' },
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    // Build edge query
    let edgeQuery = supabase.from('belief_edges').select('*');

    if (agentId) edgeQuery = edgeQuery.eq('agent_id', agentId);

    const { data: edges, error: edgeError } = await edgeQuery.limit(limit * 2);

    if (edgeError) {
      console.error('Belief graph edge query error:', edgeError);
      return NextResponse.json(
        { success: false, error: 'Failed to query belief edges' },
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          nodes: nodes || [],
          edges: edges || [],
          meta: {
            nodeCount: nodes?.length || 0,
            edgeCount: edges?.length || 0,
            filters: { agent_id: agentId, domain, source_type: sourceType },
          },
        },
      },
      { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  } catch (error) {
    console.error('Belief graph API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
