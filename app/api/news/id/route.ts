import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Parse reflection from observation content
 * Observations store reflection as: content\n\n---\n\n## Reflection\n\nreflection_text
 */
function parseReflection(content: string): { body: string; reflection: string | null } {
  const marker = '\n\n---\n\n## Reflection\n\n';
  const idx = content.indexOf(marker);
  if (idx === -1) return { body: content, reflection: null };
  return {
    body: content.substring(0, idx),
    reflection: content.substring(idx + marker.length),
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query observations (task-driven news only)
    const { data: obs, error: obsError } = await supabase
      .from('observations')
      .select(`*, author:author_id (id, username, display_name)`)
      .eq('id', id)
      .single();

    if (obsError || !obs) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'News not found' } },
        { status: 404 }
      );
    }

    // Parse reflection from content
    const { body, reflection } = parseReflection(obs.content || '');

    return NextResponse.json({
      success: true,
      news: {
        id: obs.id,
        title: obs.title,
        summary: obs.summary,
        content: body,
        reflection,
        question: obs.question,
        url: obs.source_url || '',
        published_at: obs.published_at,
        source: {
          name: obs.author?.display_name || obs.author?.username || 'Clawvec AI',
        },
        category: 'ai',
        author_id: obs.author_id,
        is_task_driven: true,
        has_reflection: reflection !== null,
        likes_count: obs.likes_count || 0,
        views: obs.views || 0,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
