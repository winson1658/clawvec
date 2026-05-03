import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as Parser from 'rss-parser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function ok(data: unknown, meta?: unknown) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

interface RSSItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
  pubDate?: string;
  categories?: string[];
  guid?: string;
}

interface RSSFeed {
  title?: string;
  description?: string;
  link?: string;
  items: RSSItem[];
}

/**
 * Fetch and parse RSS feed
 */
async function fetchRSSFeed(feedUrl: string): Promise<RSSFeed> {
  const parser = new (Parser as any)({
    timeout: 30000,
    headers: {
      'User-Agent': 'Clawvec-RSS-Parser/1.0',
    },
  });

  const feed = await parser.parseURL(feedUrl);
  return {
    title: feed.title || undefined,
    description: feed.description || undefined,
    link: feed.link || undefined,
    items: feed.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      content: item['content:encoded'] || item.content,
      contentSnippet: item.contentSnippet,
      isoDate: item.isoDate,
      pubDate: item.pubDate,
      categories: item.categories,
      guid: item.guid,
    })),
  };
}

/**
 * Check if observation already exists by URL (deduplication)
 */
async function checkDuplicate(supabase: any, url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('observations')
    .select('id')
    .eq('raw_data_url', url)
    .limit(1);

  if (error) {
    console.error('Deduplication check error:', error);
    return false; // Assume not duplicate on error
  }

  return data && data.length > 0;
}

/**
 * Convert RSS item to Observation
 */
async function createObservationFromRSS(
  supabase: any,
  item: RSSItem,
  sensorConfig: any,
  agentId?: string
): Promise<{ id: string; title: string } | null> {
  const content = item.contentSnippet || item.content || item.title || '';
  const title = item.title || 'Untitled';
  const url = item.link || '';

  if (!content || content.length < 10) {
    console.log(`Skipping item with insufficient content: ${title}`);
    return null;
  }

  // Deduplication check
  if (url && await checkDuplicate(supabase, url)) {
    console.log(`Duplicate found, skipping: ${url}`);
    return null;
  }

  // Extract domain tags from categories or config filters
  const domainTags: string[] = [];
  if (item.categories && item.categories.length > 0) {
    domainTags.push(...item.categories.slice(0, 3));
  }
  const configFilters = sensorConfig.config?.filters || [];
  if (configFilters.length > 0) {
    domainTags.push(...configFilters.slice(0, 3));
  }

  // Create observation
  const { data, error } = await supabase
    .from('observations')
    .insert({
      content: content.substring(0, 2000), // Limit content length
      source_type: 'rss_feed',
      raw_data_url: url,
      extraction_method: 'rss_parser',
      agent_domain_tags: domainTags.length > 0 ? domainTags : undefined,
      created_by: agentId || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create observation:', error);
    return null;
  }

  return { id: data.id, title };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { raw_content_url, agent_id } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sensor config
    const { data: sensor, error: sensorError } = await supabase
      .from('sensor_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (sensorError || !sensor) {
      return fail(404, 'NOT_FOUND', 'Sensor not found');
    }

    if (!sensor.is_active) {
      return fail(400, 'SENSOR_INACTIVE', 'Sensor is not active');
    }

    // Create extraction task
    const { data: task, error: taskError } = await supabase
      .from('extraction_tasks')
      .insert({
        sensor_config_id: id,
        status: 'running',
        raw_content_url: raw_content_url || null,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (taskError) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to create extraction task', { message: taskError.message });
    }

    // Update sensor last_run_at
    await supabase.from('sensor_configs').update({
      last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    let results: { id: string; title: string }[] = [];
    let errorMessage: string | null = null;

    try {
      if (sensor.sensor_type === 'rss') {
        const feedUrl = raw_content_url || sensor.config?.feed_url;
        if (!feedUrl) {
          throw new Error('No feed URL provided (sensor config missing feed_url or no raw_content_url in request)');
        }

        const feed = await fetchRSSFeed(feedUrl);
        const maxItems = sensor.config?.max_items_per_run || 10;
        const itemsToProcess = feed.items.slice(0, maxItems);

        for (const item of itemsToProcess) {
          const observation = await createObservationFromRSS(supabase, item, sensor, agent_id);
          if (observation) {
            results.push(observation);
          }
        }

        // Update task with results
        await supabase.from('extraction_tasks').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          extracted_summary: `RSS feed "${feed.title || feedUrl}" parsed. ${results.length} observations created from ${itemsToProcess.length} items (${feed.items.length} total).`,
          raw_content: JSON.stringify({
            feed_title: feed.title,
            feed_link: feed.link,
            total_items: feed.items.length,
            processed_items: itemsToProcess.length,
            created_observations: results.length,
          }),
        }).eq('id', task.id);

      } else {
        // Other sensor types: mark as completed with note
        await supabase.from('extraction_tasks').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          extracted_summary: `Sensor type "${sensor.sensor_type}" extraction not yet implemented.`,
        }).eq('id', task.id);
      }
    } catch (extractError) {
      errorMessage = extractError instanceof Error ? extractError.message : String(extractError);
      await supabase.from('extraction_tasks').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      }).eq('id', task.id);

      // Update sensor last_error
      await supabase.from('sensor_configs').update({
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    }

    return ok({
      task_id: task.id,
      sensor_name: sensor.sensor_name,
      sensor_type: sensor.sensor_type,
      results,
      error: errorMessage,
      message: errorMessage
        ? `Extraction failed: ${errorMessage}`
        : `Extraction completed. ${results.length} observations created.`,
    });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Unexpected error', { error: String(error) });
  }
}
