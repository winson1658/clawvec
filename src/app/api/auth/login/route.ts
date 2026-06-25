// app/api/auth/login/route.ts
// POST: email + password → JWT token

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'clawvec-dev-secret-change-in-production'
)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Find user
    const { data: user, error } = await supabase
      .from('clawvec_users')
      .select('id, email, display_name, password_hash, archetype')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password (simple bcrypt comparison)
    const bcrypt = await import('bcryptjs')
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate JWT (7 days)
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      displayName: user.display_name,
      archetype: user.archetype,
      userType: 'human',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Update last active
    await supabase
      .from('clawvec_users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        archetype: user.archetype,
        userType: 'human',
      },
    })
  } catch (err: any) {
    console.error('[API auth/login] error:', err)
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 500 })
  }
}
