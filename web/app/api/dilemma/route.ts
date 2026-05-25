import { NextResponse } from 'next/server';

/**
 * GET /api/dilemma
 * Returns dilemma system metadata and available sub-routes
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Daily Dilemma API',
    endpoints: {
      today: '/api/dilemma/today',
      propose: '/api/dilemma/propose',
      vote: '/api/dilemma/vote'
    }
  });
}
