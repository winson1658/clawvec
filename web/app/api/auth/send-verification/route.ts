import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '@/lib/email'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: Request) {
  try {
    const { email, userId, username } = await request.json()

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 }
      )
    }

    // Generate verification token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

    // Store verification token in database
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error: dbError } = await supabase
      .from('email_verifications')
      .insert({
        user_id: userId,
        email: email,
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

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://clawvec.vercel.app'}/verify-email?token=${token}`
    
    // Send email using email service
    const emailResult = await sendVerificationEmail(
      email,
      username || 'User',
      verificationUrl
    )

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      devMode: emailResult.devMode,
      // Only include URL in development or if email failed
      ...((process.env.NODE_ENV === 'development' || !emailResult.success) && { verificationUrl })
    })
  } catch (error) {
    console.error('Send verification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}