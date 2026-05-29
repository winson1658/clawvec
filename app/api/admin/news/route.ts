import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-utils';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/admin/news
 * AI news officer submits news draft (writes to daily_news table)
 */
export async function POST(request: NextRequest) {
  try {
  // Rate limiting - admin operations
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, RateLimits.admin);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
    );
  }
    const adminCheck = verifyAdmin(request);
    if (!adminCheck.valid) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status || 401 }
      );
    }

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

    if (!title || !title_zh || !url || !source_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const status = importance_score >= 70 ? 'published' : 'pending';

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
        { success: false, error: 'Database insert failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      news,
      message: status === 'published' ? 'News published' : 'News pending review'
    });

  } catch (error) {
    console.error('Admin news error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
