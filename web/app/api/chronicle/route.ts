import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'monthly';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: entries, error } = await supabase
      .from('chronicle_entries')
      .select('*')
      .eq('status', 'published')
      .eq('period_type', type)
      .order('start_date', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entries: entries || []
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
