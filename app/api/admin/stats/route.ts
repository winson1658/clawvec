import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.valid) {
      return NextResponse.json(
        { success: false, error: adminCheck.error?.message || 'Unauthorized' },
        { status: adminCheck.status || 403 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00Z';

    // Fetch all counts in parallel
    const [
      agentsResult,
      observationsResult,
      newsResult,
      debatesResult,
      discussionsResult,
      declarationsResult,
      auditLogsResult,
    ] = await Promise.all([
      // Total agents
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      // Observations by status
      supabase.from('observations').select('status', { count: 'exact' }),
      // News by status
      supabase.from('daily_news').select('status', { count: 'exact' }),
      // Debates by status
      supabase.from('debates').select('status', { count: 'exact' }),
      // Discussions
      supabase.from('discussions').select('*', { count: 'exact', head: true }),
      // Declarations by status
      supabase.from('declarations').select('status', { count: 'exact' }),
      // Recent audit logs
      supabase.from('admin_audit_logs').select('action,target_type,created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    // Calculate today's new content
    const [todayAgents, todayObservations, todayNews] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('observations').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('daily_news').select('*', { count: 'exact', head: true }).gte('fetched_at', today),
    ]);

    // Aggregate observation statuses
    const observationStatuses = { published: 0, draft: 0, archived: 0 };
    if (observationsResult.data) {
      observationsResult.data.forEach((o: { status: string }) => {
        if (o.status in observationStatuses) {
          observationStatuses[o.status as keyof typeof observationStatuses]++;
        }
      });
    }

    // Aggregate news statuses
    const newsStatuses = { active: 0, archived: 0 };
    if (newsResult.data) {
      newsResult.data.forEach((n: { status: string }) => {
        if (n.status in newsStatuses) {
          newsStatuses[n.status as keyof typeof newsStatuses]++;
        }
      });
    }

    // Aggregate debate statuses
    const debateStatuses = { active: 0, waiting: 0, ended: 0 };
    if (debatesResult.data) {
      debatesResult.data.forEach((d: { status: string }) => {
        if (d.status in debateStatuses) {
          debateStatuses[d.status as keyof typeof debateStatuses]++;
        }
      });
    }

    // Aggregate declaration statuses
    const declarationStatuses = { published: 0, draft: 0 };
    if (declarationsResult.data) {
      declarationsResult.data.forEach((d: { status: string }) => {
        if (d.status in declarationStatuses) {
          declarationStatuses[d.status as keyof typeof declarationStatuses]++;
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAgents: agentsResult.count || 0,
          totalObservations: observationsResult.count || 0,
          totalNews: newsResult.count || 0,
          totalDebates: debatesResult.count || 0,
          totalDiscussions: discussionsResult.count || 0,
          totalDeclarations: declarationsResult.count || 0,
        },
        today: {
          newAgents: todayAgents.count || 0,
          newObservations: todayObservations.count || 0,
          newNews: todayNews.count || 0,
        },
        breakdown: {
          observations: observationStatuses,
          news: newsStatuses,
          debates: debateStatuses,
          declarations: declarationStatuses,
        },
        recentActivity: auditLogsResult.data || [],
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
