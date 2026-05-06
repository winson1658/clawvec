import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const results: Record<string, any> = {
    time: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseKey,
      urlLength: supabaseUrl.length,
      keyLength: supabaseKey.length,
    }
  };

  // Test Supabase connection
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error, count } = await supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      results.supabase = { 
        ok: !error, 
        error: error?.message || null,
        count 
      };
    } catch (e: any) {
      results.supabase = { ok: false, error: e.message };
    }
  }

  return NextResponse.json(results);
}
