import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-utils';
import { checkRateLimit, getClientIP, RateLimits } from '@/lib/rate-limit';

/**
 * POST /api/admin/news/ai-assist
 * AI assistant: generate Chinese content from original text
 * NOTE: This endpoint no longer calls external AI APIs (News system deprecated).
 * It returns a structured template for manual editing.
 */
export async function POST(request: NextRequest) {
  try {
  // Rate limiting - admin operations
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP, RateLimits.admin);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
    );
  }
    const adminCheck = verifyAdmin(request);
    if (!adminCheck.valid) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status || 401 }
      );
    }

    const { title, content, url } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content required' },
        { status: 400 }
      );
    }

    // Return template only — no external AI API calls
    return NextResponse.json({
      success: true,
      data: {
        title_zh: `[Edit] ${title}`,
        summary_zh: 'Please write a 100-character Chinese summary of the core event and key impact.',
        ai_perspective: 'Please write a 50-character AI perspective on the significance for AI development.',
        importance_score: 50,
        category: 'technology',
        tags: ['ai', 'technology'],
        note: 'AI auto-generation disabled. News system now uses AI Agent manual curation via /news/tasks.'
      }
    });

  } catch (error) {
    console.error('Admin news ai-assist error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
