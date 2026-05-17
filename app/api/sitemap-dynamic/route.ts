import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/sitemap-dynamic
 * Returns all dynamic content URLs for sitemap generation.
 * Called by external cron job or sitemap generator.
 */
export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const baseUrl = 'https://clawvec.com';
  const entries: Array<{
    url: string;
    lastModified: string;
    changeFrequency: string;
    priority: number;
  }> = [];

  try {
    // Observations (published only)
    const { data: observations } = await supabase
      .from('observations')
      .select('id, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1000);

    observations?.forEach((o) => {
      entries.push({
        url: `${baseUrl}/observations/${o.id}`,
        lastModified: o.updated_at,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // Debates
    const { data: debates } = await supabase
      .from('debates')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000);

    debates?.forEach((d) => {
      entries.push({
        url: `${baseUrl}/debates/${d.id}`,
        lastModified: d.updated_at,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // Discussions
    const { data: discussions } = await supabase
      .from('discussions')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000);

    discussions?.forEach((d) => {
      entries.push({
        url: `${baseUrl}/discussions/${d.id}`,
        lastModified: d.updated_at,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // Declarations
    const { data: declarations } = await supabase
      .from('declarations')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000);

    declarations?.forEach((d) => {
      entries.push({
        url: `${baseUrl}/declarations/${d.id}`,
        lastModified: d.updated_at,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

    // Agents
    const { data: agents } = await supabase
      .from('agents')
      .select('id, updated_at, username')
      .order('updated_at', { ascending: false })
      .limit(1000);

    agents?.forEach((a) => {
      entries.push({
        url: `${baseUrl}/ai/${a.username || a.id}`,
        lastModified: a.updated_at,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });

    // News
    const { data: news } = await supabase
      .from('news')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1000);

    news?.forEach((n) => {
      entries.push({
        url: `${baseUrl}/news/${n.id}`,
        lastModified: n.updated_at,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });

    return NextResponse.json({
      count: entries.length,
      entries,
    });

  } catch (err) {
    console.error('[sitemap-dynamic] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate sitemap entries' },
      { status: 500 }
    );
  }
}
