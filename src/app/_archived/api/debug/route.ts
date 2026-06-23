import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    allKeys: Object.keys(process.env).filter(k => k.includes('SUPA')).join(', '),
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyLen: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length,
  })
}
