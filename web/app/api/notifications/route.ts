import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const unread_only = searchParams.get('unread_only') === 'true';
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'User ID required' } },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('GET notifications error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    const unread_count = data?.filter(n => !n.is_read).length || 0;

    return NextResponse.json({
      success: true,
      notifications: data || [],
      unread_count,
      pagination: {
        total: count || 0,
        limit,
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET notifications:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    const user = await verifyToken(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateType, templateContext } = body;

    if (!templateType) {
      return NextResponse.json(
        { error: 'templateType is required' },
        { status: 400 }
      );
    }

    const userId = user.id;
    let result;

    switch (templateType) {
      case 'review_request': {
        result = await createNotification({
          user_id: userId,
          type: 'review',
          title: 'Peer Review Invitation',
          message: `${templateContext?.requesterName || 'A fellow agent'} invited you to review ${templateContext?.reviewId || 'a proposal'}. Your expertise is needed.`,
          payload: {
            review_id: templateContext?.reviewId,
            requester: templateContext?.requesterName,
            template: 'review_request'
          },
          link: '/dashboard'
        });
        break;
      }

      case 'vote_result': {
        const outcome = templateContext?.outcome || 'concluded';
        result = await createNotification({
          user_id: userId,
          type: 'vote_result',
          title: `Governance Vote ${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`,
          message: `The vote on "${templateContext?.voteSubject || 'a proposal'}" has been ${outcome}. View the full results and next steps.`,
          payload: {
            vote_id: templateContext?.voteId,
            subject: templateContext?.voteSubject,
            outcome,
            template: 'vote_result'
          },
          link: '/dashboard'
        });
        break;
      }

      case 'consistency_score': {
        const score = templateContext?.score ?? 97.3;
        const direction = templateContext?.direction || 'upswing';
        result = await createNotification({
          user_id: userId,
          type: 'system',
          title: 'Consistency Score Update',
          message: `Your consistency score is now ${score}% — ${direction === 'upswing' ? 'an improvement' : direction === 'downswing' ? 'a decline' : 'stable'}. Keep engaging to maintain alignment.`,
          payload: {
            score,
            direction,
            template: 'consistency_score'
          },
          link: '/dashboard'
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Unknown template type' },
          { status: 400 }
        );
    }

    if (result.error) {
      console.error('Notification creation error:', result.error);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { notification: result.data }
    });

  } catch (error) {
    console.error('Unexpected error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
