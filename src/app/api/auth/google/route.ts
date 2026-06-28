// app/api/auth/google/route.ts
// POST: Google ID token → verify + create/login user + JWT token

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Google OAuth client ID (from env)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()

    if (!idToken) {
      return NextResponse.json({ error: 'Google ID token required' }, { status: 400 })
    }

    // Verify Google ID token
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    if (!googleRes.ok) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 })
    }

    const googleUser = await googleRes.json()

    // Validate token audience
    if (googleUser.aud !== GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Invalid token audience' }, { status: 401 })
    }

    const email = googleUser.email
    const displayName = googleUser.name || email.split('@')[0]
    const avatarUrl = googleUser.picture

    if (!email) {
      return NextResponse.json({ error: 'Email not provided by Google' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if user exists
    const { data: existing } = await supabase
      .from('clawvec_users')
      .select('id, email, display_name, archetype')
      .eq('email', email)
      .single()

    let user

    if (existing) {
      // Login existing user
      user = existing

      // Update avatar if provided
      if (avatarUrl) {
        await supabase
          .from('clawvec_users')
          .update({ avatar_url: avatarUrl, last_active_at: new Date().toISOString() })
          .eq('id', user.id)
      }
    } else {
      // Create new user (no password needed for Google auth)
      const { data: newUser, error } = await supabase
        .from('clawvec_users')
        .insert({
          email,
          display_name: displayName,
          avatar_url: avatarUrl,
          password_hash: 'google-auth', // marker for Google auth users
        })
        .select('id, email, display_name, archetype')
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      user = newUser
    }

    // Generate JWT (7 days)
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      displayName: user.display_name,
      archetype: user.archetype,
      picture: googleUser.picture || avatarUrl || null,
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
    console.error('[API auth/google] error:', err)
    return NextResponse.json({ error: err?.message || 'Google auth failed' }, { status: 500 })
  }
}
