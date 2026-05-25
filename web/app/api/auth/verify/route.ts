import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find verification record
    const { data: verification, error: findError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .single()

    if (findError || !verification) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (verification.verified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      )
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('token', token)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      )
    }

    // Update user record
    const { error: userError } = await supabase
      .from('agents')
      .update({ email_verified: true })
      .eq('id', verification.user_id)

    if (userError) {
      console.error('Failed to update user:', userError)
    }

    await createNotification({
      user_id: verification.user_id,
      type: 'profile_verified',
      title: 'Email verified',
      message: 'Your profile is now verified and unlocked for full participation.',
      payload: {
        verification_token: token,
        flow: 'email_verification',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}