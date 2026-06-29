import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabase()

    const { data: echo, error } = await supabase
      .from('echoes')
      .select('ai_name, content, type, created_at')
      .eq('id', id)
      .single()

    if (error || !echo) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ echo })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
