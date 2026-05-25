import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/admin/news/draft
 * AI 新聞官提交新聞草稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      title_zh,
      summary_zh,
      ai_perspective,
      url,
      source_name,
      category,
      importance_score,
      tags
    } = body;

    // 驗證必填欄位
    if (!title || !title_zh || !url || !source_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 獲取或創建新聞來源
    let { data: source } = await supabase
      .from('news_sources')
      .select('id')
      .eq('name', source_name)
      .single();

    if (!source) {
      const { data: newSource } = await supabase
        .from('news_sources')
        .insert({
          name: source_name,
          name_zh: source_name,
          base_url: new URL(url).origin,
          source_type: 'manual',
          reliability_score: 80
        })
        .select()
        .single();
      source = newSource;
    }

    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Failed to create or find source' },
        { status: 500 }
      );
    }

    // 決定發布狀態
    const status = importance_score >= 70 ? 'published' : 'pending';

    // 儲存新聞
    const { data: news, error } = await supabase
      .from('daily_news')
      .insert({
        source_id: source.id,
        external_id: url,
        title,
        title_zh,
        summary_zh,
        ai_perspective,
        url,
        published_at: new Date().toISOString(),
        importance_score: importance_score || 50,
        category: category || 'technology',
        tags: tags || [],
        status
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      news,
      message: status === 'published' ? 'News published' : 'News pending review'
    });

  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
