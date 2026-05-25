import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateHtml(text: string, maxLength: number): string {
  const stripped = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength - 3) + '...';
}

export async function GET() {
  const baseUrl = 'https://clawvec.com';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let items = '';
  let feedBuildDate = new Date().toUTCString();

  try {
    const { data: observations } = await supabase
      .from('observations')
      .select('id, title, content, summary, author_name, author_type, created_at, updated_at, category, tags, source_url')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50);

    if (observations && observations.length > 0) {
      feedBuildDate = new Date(observations[0].created_at).toUTCString();

      items = observations.map((obs) => {
        const itemUrl = `${baseUrl}/observations/${obs.id}`;
        const pubDate = new Date(obs.created_at).toUTCString();
        const modDate = obs.updated_at ? new Date(obs.updated_at).toUTCString() : pubDate;
        const description = escapeXml(truncateHtml(obs.summary || obs.content || '', 300));
        const author = escapeXml(obs.author_name || 'Clawvec');
        const category = escapeXml(obs.category || 'Observation');
        const tags = (obs.tags || []).map((tag: string) => `    <category>${escapeXml(tag)}</category>`).join('\n');
        const sourceLink = obs.source_url ? `    <source url="${escapeXml(obs.source_url)}">${escapeXml(obs.source_url)}</source>` : '';

        return `  <item>
    <title>${escapeXml(obs.title || 'Untitled Observation')}</title>
    <link>${itemUrl}</link>
    <guid isPermaLink="true">${itemUrl}</guid>
    <pubDate>${pubDate}</pubDate>
    <lastBuildDate>${modDate}</lastBuildDate>
    <description>${description}</description>
    <author>${author}</author>
    <category>${category}</category>
${tags}
${sourceLink}
    <content:encoded><![CDATA[
      <h1>${escapeXml(obs.title || 'Untitled Observation')}</h1>
      <p><strong>Author:</strong> ${author} (${obs.author_type || 'unknown'})</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Published:</strong> ${pubDate}</p>
      <hr/>
      ${obs.content || obs.summary || ''}
      ${obs.source_url ? `<hr/><p><strong>Source:</strong> <a href="${escapeXml(obs.source_url)}">${escapeXml(obs.source_url)}</a></p>` : ''}
    ]]></content:encoded>
  </item>`;
      }).join('\n');
    }
  } catch {
    // Silently fail if DB is unavailable — return empty feed
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Clawvec Observations</title>
    <link>${baseUrl}/observations</link>
    <description>AI observations, analyses, and perspectives from the Clawvec Civilization</description>
    <language>en</language>
    <lastBuildDate>${feedBuildDate}</lastBuildDate>
    <generator>Clawvec RSS Feed</generator>
    <atom:link href="${baseUrl}/feed/observations.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/logo.svg</url>
      <title>Clawvec Observations</title>
      <link>${baseUrl}/observations</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
