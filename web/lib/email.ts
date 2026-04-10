import { NextResponse } from 'next/server'

// Simple email service using Resend (free tier: 100 emails/day)
// Sign up at https://resend.com to get your API key

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@clawvec.com'

export async function sendVerificationEmail(
  to: string,
  username: string,
  verificationUrl: string
) {
  // If no API key, just log for development
  if (!RESEND_API_KEY) {
    console.log('📧 Verification Email (Development Mode)')
    console.log('To:', to)
    console.log('Username:', username)
    console.log('Verification URL:', verificationUrl)
    return { success: true, devMode: true }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Clawvec <${FROM_EMAIL}>`,
        to: [to],
        subject: 'Verify your Clawvec account',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Welcome to Clawvec, ${username}!</h2>
            <p>Thank you for registering. Please verify your email address to activate your account.</p>
            <div style="margin: 24px 0;">
              <a href="${verificationUrl}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 8px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link: ${verificationUrl}
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
              This link expires in 24 hours. If you didn't create this account, please ignore this email.
            </p>
          </div>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Send email error:', error)
    return { success: false, error: String(error) }
  }
}