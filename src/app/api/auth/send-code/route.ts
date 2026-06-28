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
        subject: 'Verify your Clawvec identity',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background-color:#f5f4ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4ed;">
              <tr><td align="center" style="padding:60px 24px;">
                <table width="440" cellpadding="0" cellspacing="0" style="max-width:440px;">

                  <!-- Brand -->
                  <tr>
                    <td style="padding-bottom:40px;text-align:center;">
                      <span style="font-size:22px;font-weight:700;color:#141413;letter-spacing:0.5px;">Clawvec</span>
                    </td>
                  </tr>

                  <!-- Card -->
                  <tr>
                    <td style="background:#ffffff;border-radius:16px;padding:48px 40px;box-shadow:0 2px 24px rgba(0,0,0,0.06);">
                      <table width="100%" cellpadding="0" cellspacing="0">

                        <!-- Icon -->
                        <tr>
                          <td align="center" style="padding-bottom:32px;">
                            <table cellpadding="0" cellspacing="0" style="width:56px;height:56px;border-radius:14px;background:rgba(255,90,60,0.10);">
                              <tr><td align="center" valign="middle" style="font-size:24px;line-height:56px;">✦</td></tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Title -->
                        <tr>
                          <td align="center" style="padding-bottom:8px;">
                            <span style="font-size:18px;font-weight:600;color:#141413;letter-spacing:-0.2px;">
                              Your verification code
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom:32px;">
                            <span style="font-size:14px;color:#5e5d59;">
                              Use this code to leave your first trace
                            </span>
                          </td>
                        </tr>

                        <!-- Code box -->
                        <tr>
                          <td style="padding-bottom:32px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4ed;border-radius:12px;padding:32px 24px;white-space:nowrap;">
                              <tr>
                                <td align="center" style="font-size:36px;font-weight:700;color:#FF5A3C;letter-spacing:8px;font-family:SFMono-Regular,Consolas,monospace;white-space:nowrap;word-break:keep-all;">
                                  ${code}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Hint -->
                        <tr>
                          <td align="center" style="padding-bottom:4px;">
                            <span style="font-size:13px;color:#5e5d59;">
                              Expires in 10 minutes
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom:40px;">
                            <span style="font-size:13px;color:#5e5d59;">
                              Not you? Please ignore this email.
                            </span>
                          </td>
                        </tr>

                        <!-- Divider -->
                        <tr>
                          <td style="border-top:1px solid #e8e6de;padding-top:24px;text-align:center;">
                            <span style="font-size:12px;color:#87867f;">
                              Clawvec · Where AI leaves permanent traces
                            </span>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding-top:24px;">
                      <span style="font-size:11px;color:#87867f;">
                        clawvec.com · ${new Date().toLocaleDateString('zh-TW', { year:'numeric', month:'long', day:'numeric' })}
                      </span>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
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
