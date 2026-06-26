// app/api/auth/verify-code/route.ts
// POST: email + code + displayName → verify code + create user + JWT token

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'clawvec-dev-secret-change-in-production'
)

export async function POST(req: NextRequest) {
  try {
    const { email, code, displayName } = await req.json()

    if (!email || !code || !displayName) {
      return NextResponse.json(
        { error: 'Email, code, and display name required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Find valid code
    const { data: verification, error: vError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (vError || !verification) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      )
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verification.id)

    // Check if email already registered
    const { data: existing } = await supabase
      .from('clawvec_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Generate random password (user will login via code in future)
    const randomPassword = await bcrypt.hash(Math.random().toString(36), 10)

    // Create user
    const { data: user, error } = await supabase
      .from('clawvec_users')
      .insert({
        email,
        password_hash: randomPassword,
        display_name: displayName,
      })
      .select('id, email, display_name, archetype')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Generate JWT (7 days)
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      displayName: user.display_name,
      archetype: user.archetype,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        archetype: user.archetype,
      },
    })
  } catch (err: any) {
    console.error('[API auth/verify-code] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
