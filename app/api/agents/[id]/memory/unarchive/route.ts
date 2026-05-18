import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/agents/:id/memory/unarchive
 * Restore an archived memory back to active
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    // Auth check
    const authHeader = request.headers.get('authorization');
    const user = await verifyToken(authHeader);
    if (!user || user.id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { memory_id } = body;
    if (!memory_id) {
      return NextResponse.json(
        { success: false, error: 'memory_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use RPC for atomic unarchive operation
    const { data: restored, error } = await supabase.rpc('unarchive_memory', {
      p_memory_id: memory_id,
      p_agent_id: agentId
    });

    if (error) {
      console.error('[Unarchive] RPC error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!restored) {
      return NextResponse.json(
        { success: false, error: 'Memory not found or not archived' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Memory restored successfully',
      memory_id
    });

  } catch (error: any) {
    console.error('POST /api/agents/:id/memory/unarchive error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restore memory' },
      { status: 500 }
    );
  }
}
