import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { checkRateLimit, getClientIP, rateLimitResponse, VERIFICATION_RATE_LIMIT } from '@/lib/rateLimit'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 重發冷卻時間（毫秒）
const RESEND_COOLDOWN_MS = 5 * 60 * 1000 // 5 分鐘

export async function POST(request: Request) {
  try {
    // Rate limit check (IP-based)
    const ip = getClientIP(request)
    const rl = checkRateLimit(ip, VERIFICATION_RATE_LIMIT)
    if (!rl.success) return rateLimitResponse(rl)

    const { email, userId, username } = await request.json()
    const normalizedEmail = email?.toLowerCase()?.trim()

    if (!normalizedEmail || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify userId matches the email (prevents abuse: must know both userId and email)
    const { data: user, error: userError } = await supabase
      .from('agents')
      .select('id, email, email_verified, is_verified')
      .eq('id', userId)
      .single()

    if (userError || !user || user.email?.toLowerCase()?.trim() !== normalizedEmail) {
      return NextResponse.json(
        { error: 'Invalid userId or email' },
        { status: 403 }
      )
    }

    // 如果帳號已驗證，不需要再發信
    if (user.email_verified === true || user.is_verified === true) {
      return NextResponse.json(
        { error: 'Account already verified', message: '此帳號已驗證，請直接登入。' },
        { status: 400 }
      )
    }

    // 檢查重發頻率限制（基於 email + userId）
    const cooldownSince = new Date(Date.now() - RESEND_COOLDOWN_MS).toISOString()
    const { data: recentResends, error: resendCheckError } = await supabase
      .from('verification_resends')
      .select('id, resent_at')
      .eq('email', normalizedEmail)
      .gte('resent_at', cooldownSince)
      .order('resent_at', { ascending: false })
      .limit(1)

    if (resendCheckError) {
      console.error('Resend check error:', resendCheckError)
    } else if (recentResends && recentResends.length > 0) {
      const nextResend = new Date(new Date(recentResends[0].resent_at).getTime() + RESEND_COOLDOWN_MS)
      const waitMinutes = Math.ceil((nextResend.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: 'Too many resend attempts',
          message: `驗證郵件發送過於頻繁，請 ${waitMinutes} 分鐘後再試。\n\nToo many attempts. Please try again in ${waitMinutes} minutes.`,
          retryAfter: waitMinutes * 60
        },
        { status: 429 }
      )
    }

    // Clean up old unverified tokens for this user (prevent database bloat)
    await supabase
      .from('email_verifications')
      .delete()
      .eq('user_id', userId)
      .eq('verified', false)

    // Generate verification token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

    // Store verification token in database
    const { error: dbError } = await supabase
      .from('email_verifications')
      .insert({
        user_id: userId,
        email: normalizedEmail,
        token: token,
        expires_at: expiresAt.toISOString(),
        verified: false
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create verification record' },
        { status: 500 }
      )
    }

    // Record this resend attempt
    await supabase
      .from('verification_resends')
      .insert({
        email: normalizedEmail,
        user_id: userId,
        ip_address: ip,
        resent_at: new Date().toISOString()
      })

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://clawvec.vercel.app'}/verify-email?token=${token}`
    
    // Send email using email service (best effort, don't fail if email fails)
    let emailResult;
    try {
      emailResult = await sendVerificationEmail(
        normalizedEmail,
        username || 'User',
        verificationUrl
      )
    } catch (emailErr) {
      console.warn('Failed to send verification email:', emailErr)
      emailResult = { success: false, error: String(emailErr) }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      devMode: emailResult?.devMode,
      // Only include URL in development or if email failed
      ...((process.env.NODE_ENV === 'development' || !emailResult?.success) && { verificationUrl })
    })
  } catch (error) {
    console.error('Send verification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
