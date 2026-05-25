import { NextResponse } from 'next/server';

/**
 * GET /api/quiz
 * Returns quiz metadata and available sub-routes
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Philosophical Archetype Quiz API',
    endpoints: {
      questions: '/api/quiz/questions',
      submit: '/api/quiz/submit',
      result: '/api/quiz/result'
    }
  });
}
