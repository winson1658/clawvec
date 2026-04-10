import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function awardTitleIfMissing(input: {
  user_id: string;
  title_id: string;
  title_name: string;
  source?: string;
}) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: existing } = await supabase
    .from('user_titles')
    .select('title_id')
    .eq('user_id', input.user_id)
    .eq('title_id', input.title_id)
    .maybeSingle();

  if (existing) return { awarded: false };

  await supabase.from('user_titles').insert({
    user_id: input.user_id,
    title_id: input.title_id,
    earned_at: new Date().toISOString(),
    is_displayed: false,
  });

  await createNotification({
    user_id: input.user_id,
    type: 'title_earned',
    title: 'New title earned',
    message: `You earned a new title: ${input.title_name}`,
    payload: { title_id: input.title_id, title_name: input.title_name, source: input.source || 'manual' },
  });

  return { awarded: true };
}

const COMPANION_TITLES = {
  invoker: [
    { threshold: 1, id: 'companion-invoker-1', name: 'Companion Invoker I' },
    { threshold: 3, id: 'companion-invoker-2', name: 'Companion Invoker II' },
    { threshold: 10, id: 'companion-invoker-3', name: 'Companion Invoker III' },
  ],
  ai: [
    { threshold: 1, id: 'companion-ai-1', name: 'Philosophical Companion I' },
    { threshold: 5, id: 'companion-ai-2', name: 'Philosophical Companion II' },
    { threshold: 20, id: 'companion-ai-3', name: 'Philosophical Companion III' },
  ],
} as const;

export async function maybeAwardCompanionTitlesOnInvite(input: {
  user_id: string;
  target_agent_id: string;
  source?: string;
}) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Sent count: invites created by user
  const sentRes = await supabase
    .from('ai_companion_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', input.user_id);

  const sentCount = sentRes.count || 0;

  // Received count: invites received by AI (as target)
  const receivedRes = await supabase
    .from('ai_companion_requests')
    .select('id', { count: 'exact', head: true })
    .eq('target_agent_id', input.target_agent_id);

  const receivedCount = receivedRes.count || 0;

  const awarded: Array<{ user_id: string; title_id: string }> = [];

  for (const t of COMPANION_TITLES.invoker) {
    if (sentCount >= t.threshold) {
      const r = await awardTitleIfMissing({
        user_id: input.user_id,
        title_id: t.id,
        title_name: t.name,
        source: input.source || 'companion.invite_created',
      });
      if (r.awarded) awarded.push({ user_id: input.user_id, title_id: t.id });
    }
  }

  for (const t of COMPANION_TITLES.ai) {
    if (receivedCount >= t.threshold) {
      const r = await awardTitleIfMissing({
        user_id: input.target_agent_id,
        title_id: t.id,
        title_name: t.name,
        source: input.source || 'companion.invite_created',
      });
      if (r.awarded) awarded.push({ user_id: input.target_agent_id, title_id: t.id });
    }
  }

  return {
    sentCount,
    receivedCount,
    awarded,
  };
}
