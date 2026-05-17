import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}
function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('titles')
      .select('id, display_name, description, rarity, hint, is_hidden, family_id')
      .order('rarity', { ascending: true });

    if (error) return fail(500, 'INTERNAL_ERROR', 'Failed to fetch titles', { message: error.message });

    const items = (data || []).map((title: any) => ({
      id: title.id,
      display_name: title.display_name,
      description: title.is_hidden ? undefined : title.description,
      hint: title.hint || null,
      rarity: title.rarity,
      category: title.family_id || null,
      is_hidden: !!title.is_hidden,
    }));

    return ok({ items });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
