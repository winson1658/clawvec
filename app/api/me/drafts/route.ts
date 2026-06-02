import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthFromRequest } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

// GET /api/me/drafts — List all drafts for the authenticated user
export async function GET(request: Request) {
  try {
    // Authenticate user from Authorization header (JWT Bearer)
    const user = await requireAuthFromRequest(request);
    const user_id = user.id;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch observation drafts
    const { data: observationDrafts, error: obsError } = await supabase
      .from('observations')
      .select('id, title, summary, status, created_at, updated_at, category, tags')
      .eq('author_id', user_id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });

    if (obsError) {
      console.error('Observation drafts fetch error:', obsError);
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch observation drafts');
    }

    // Fetch declaration drafts
    const { data: declarationDrafts, error: decError } = await supabase
      .from('declarations')
      .select('id, title, content, status, created_at, updated_at, type, tags')
      .eq('author_id', user_id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });

    if (decError) {
      console.error('Declaration drafts fetch error:', decError);
      return fail(500, 'INTERNAL_ERROR', 'Failed to fetch declaration drafts');
    }

    // Normalize and combine
    const observations = (observationDrafts || []).map((d: any) => ({
      id: d.id,
      type: 'observation',
      title: d.title,
      preview: d.summary?.substring(0, 200) || '',
      status: d.status,
      created_at: d.created_at,
      updated_at: d.updated_at,
      category: d.category,
      tags: d.tags || [],
    }));

    const declarations = (declarationDrafts || []).map((d: any) => ({
      id: d.id,
      type: 'declaration',
      title: d.title,
      preview: d.content?.substring(0, 200) || '',
      status: d.status,
      created_at: d.created_at,
      updated_at: d.updated_at,
      category: d.type,
      tags: d.tags || [],
    }));

    // Combine and sort by updated_at desc
    const allDrafts = [...observations, ...declarations].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    const total = allDrafts.length;
    const paginated = allDrafts.slice(offset, offset + limit);

    return ok({
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        observation_count: observations.length,
        declaration_count: declarations.length,
        total_count: total,
      },
    });
  } catch (error) {
    // Handle auth errors from requireAuthFromRequest
    if ((error as any)?.code === 'UNAUTHENTICATED') {
      return fail(401, 'UNAUTHENTICATED', 'Login required');
    }
    if (error instanceof Response) return error;
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: 'Internal server error' });
  }
}
