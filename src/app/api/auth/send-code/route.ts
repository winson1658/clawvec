// app/api/auth/send-code/route.ts
// POST: email → send verification code via email (Resend API)

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email, purpose = 'register' } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if email already registered (for register purpose)
    if (purpose === 'register') {
      const { data: existing } = await supabase
        .from('clawvec_users')
        .select('id')
        .eq('email', email)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
    }

    // Generate code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save to database
    await supabase.from('verification_codes').insert({
      email,
      code,
      purpose,
      expires_at: expiresAt.toISOString(),
    })

    // Send email via Resend API
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      // Dev mode: return code in response
      console.log(`[DEV] Verification code for ${email}: ${code}`)
      return NextResponse.json({
        message: 'Code sent (dev mode)',
        devCode: code, // Only in dev!
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clawvec <noreply@clawvec.com>',
        to: email,
        subject: 'Your Clawvec Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
            <h2 style="color: #FF5A3C;">Clawvec</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[Resend] Failed to send email:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Code sent' })
  } catch (err: any) {
    console.error('[API auth/send-code] error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to send code' }, { status: 500 })
  }
}
