import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secretKey = new TextEncoder().encode(JWT_SECRET);

function createClientWithTimeout() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { 'X-Statement-Timeout': '15000' }, // 15s for maintenance (batch ops)
    },
  });
}

// Secure JWT verification with signature check
async function verifyTokenSecure(token: string): Promise<{ id: string; username?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { clockTolerance: 60 });
    const id = (payload.id as string) || (payload.sub as string);
    if (!id) return null;
    return { id, username: payload.username as string };
  } catch {
    return null;
  }
}

/**
 * POST /api/agents/:id/memory/maintenance
 * Agent-triggered forgetting ritual
 * 
 * Decays memory importance and archives forgotten memories.
 * 🟢 Pure DB operation — no API key needed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    // Auth check — only agent owner can trigger maintenance
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = await verifyTokenSecure(token);
    if (!user || user.id !== agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized — only agent owner can trigger maintenance' },
        { status: 403 }
      );
    }

    const decayThreshold = body.decay_threshold ?? 0.1;

    if (typeof decayThreshold !== 'number' || decayThreshold < 0 || decayThreshold > 1) {
      return NextResponse.json(
        { success: false, error: 'decay_threshold must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    const supabase = createClientWithTimeout();
    const results: Record<string, any> = {};

    // Step 1: Decay memories for this agent
    // Decay = update importance_score based on time since last access
    const { data: decayResult, error: decayError } = await supabase.rpc('decay_memories');
    if (decayError) {
      console.warn('[MemoryMaintenance] Decay failed:', decayError.message);
      results.decay = { success: false, error: decayError.message };
    } else {
      results.decay = { success: true, affected: decayResult };
    }

    // Step 2: Archive memories below threshold for this agent
    const { data: archiveResult, error: archiveError } = await supabase.rpc('archive_forgotten_memories', {
      p_decay_threshold: decayThreshold
    });
    if (archiveError) {
      console.warn('[MemoryMaintenance] Archive failed:', archiveError.message);
      results.archive = { success: false, error: archiveError.message };
    } else {
      results.archive = { success: true, affected: archiveResult };
    }

    return NextResponse.json({
      success: true,
      ritual: 'memory_maintenance',
      agent_id: agentId,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error: any) {
    console.error('[MemoryMaintenance] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
