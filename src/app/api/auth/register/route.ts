// app/api/auth/register/route.ts
// POST: email + password + displayName → create user + JWT token

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json()

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if email exists
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('clawvec_users')
      .insert({
        email,
        password_hash: passwordHash,
        display_name: displayName,
      })
      .select('id, email, display_name, archetype')
      .single()

    if (error) {
      console.error('[API auth/register] insert error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Failed to create account', detail: error.message || error.code },
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
    console.error('[API auth/register] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
