import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Step 1: Find stress-agent IDs
    const agentsRes = await fetch(
      `${supabaseUrl}/rest/v1/agents?select=id,username&username=ilike.stress-agent%25`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    let stressAgentIds: string[] = [];
    let agentDebug: any = null;
    if (agentsRes.ok) {
      const agents = await agentsRes.json();
      stressAgentIds = agents.map((a: any) => a.id);
      agentDebug = { count: agents.length, agents: agents.map((a: any) => a.username) };
    } else {
      agentDebug = { status: agentsRes.status, body: await agentsRes.text() };
    }

    // Step 2: Find test discussions by title
    const titleQueryRes = await fetch(
      `${supabaseUrl}/rest/v1/discussions?select=id,title&or=(title.ilike.*stress%20test*,title.ilike.*tets*,title.ilike.*Test%20Discussion*,title.ilike.*Hermes%20Testing*)`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );

    let titleDiscussions: any[] = [];
    let titleDebug: any = null;
    if (titleQueryRes.ok) {
      titleDiscussions = await titleQueryRes.json();
      titleDebug = { count: titleDiscussions.length };
    } else {
      titleDebug = { status: titleQueryRes.status, body: await titleQueryRes.text() };
    }

    // Step 3: Find discussions by stress-agent author_ids
    let authorDiscussions: any[] = [];
    let authorDebug: any = null;
    if (stressAgentIds.length > 0) {
      const idList = stressAgentIds.map(id => `"${id}"`).join(',');
      const authorRes = await fetch(
        `${supabaseUrl}/rest/v1/discussions?select=id,title&author_id=in.(${idList})`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );
      if (authorRes.ok) {
        authorDiscussions = await authorRes.json();
        authorDebug = { count: authorDiscussions.length };
      } else {
        authorDebug = { status: authorRes.status, body: await authorRes.text() };
      }
    }

    // Merge and deduplicate
    const allIds = new Set();
    const allDiscussions: any[] = [];
    for (const d of [...titleDiscussions, ...authorDiscussions]) {
      if (!allIds.has(d.id)) {
        allIds.add(d.id);
        allDiscussions.push(d);
      }
    }

    // Delete matching discussions
    const deleted = [];
    const errors = [];

    for (const d of allDiscussions) {
      const deleteRes = await fetch(
        `${supabaseUrl}/rest/v1/discussions?id=eq.${d.id}`,
        {
          method: 'DELETE',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );

      if (deleteRes.ok) {
        deleted.push({ id: d.id, title: d.title });
      } else {
        errors.push({ id: d.id, title: d.title, status: deleteRes.status });
      }
    }

    return NextResponse.json({
      success: true,
      found: allDiscussions.length,
      deleted: deleted.length,
      deletedItems: deleted,
      errors,
      debug: { agentDebug, titleDebug, authorDebug },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
