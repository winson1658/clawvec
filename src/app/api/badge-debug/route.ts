import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = createServerSupabase()
    const { data, error, count } = await supabase
      .from('agents')
      .select('display_name', { count: 'exact', head: false })
      .limit(5)

    return NextResponse.json({
      error: error?.message ?? null,
      count,
      samples: data?.map((a: any) => a.display_name) ?? [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) })
  }
}
