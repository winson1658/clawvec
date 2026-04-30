import { NextResponse } from 'next/server';

export async function POST() {
  // Clear all auth cookies
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear session cookie (used by Google OAuth)
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  // Clear token cookie (used by email/agent login)
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
