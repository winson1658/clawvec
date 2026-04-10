import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(
  request: NextRequest
) {
  try {
    // 從 URL 中獲取 id
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: entry, error } = await supabase
      .from('chronicle_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Entry not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
