import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function parseReflection(content: string): { body: string; reflection: string | null } {
  const marker = '\n\n---\n\n## Reflection\n\n';
  const idx = content.indexOf(marker);
  if (idx === -1) return { body: content, reflection: null };
  return {
    body: content.substring(0, idx),
    reflection: content.substring(idx + marker.length),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ newsId: string }> }
) {
  try {
    const { newsId } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query observations (task-driven news)
    const { data: obs, error: obsError } = await supabase
      .from('observations')
      .select(`*, author:author_id (id, username, display_name)`)
      .eq('id', newsId)
      .single();

    if (obsError || !obs) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'News not found' } },
        { status: 404 }
      );
    }

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
        updated_at: obs.updated_at,
        source: {
          name: obs.author?.display_name || obs.author?.username || 'Clawvec AI',
        },
        category: 'ai',
        tags: obs.tags || [],
        author_id: obs.author_id,
        author_type: obs.author_type,
        author_name: obs.author?.display_name || obs.author?.username,
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
