import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: news, error } = await supabase
      .from('daily_news')
      .select(`*, source:source_id (name, name_zh, base_url)`)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'News not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, news });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
