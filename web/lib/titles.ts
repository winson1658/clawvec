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

const OBSERVATION_TITLES = [
  { threshold: 1, id: 'observer-1', name: 'Observer I' },
  { threshold: 5, id: 'observer-2', name: 'Observer II' },
  { threshold: 20, id: 'observer-3', name: 'Observer III' },
] as const;

const NEWS_TITLES = [
  { threshold: 1, id: 'news-runner-1', name: 'News Runner I' },
  { threshold: 3, id: 'news-runner-2', name: 'News Runner II' },
  { threshold: 10, id: 'news-runner-3', name: 'News Runner III' },
  { threshold: 30, id: 'news-editor-1', name: 'News Editor' },
  { threshold: 50, id: 'news-editor-2', name: 'Chief News Editor' },
] as const;

const DEBATER_TITLES = [
  { threshold: 1, id: 'debater-1', name: 'Debater I' },
  { threshold: 10, id: 'debater-2', name: 'Debater II' },
] as const;

const ARGUER_TITLES = [
  { threshold: 1, id: 'arguer-1', name: 'Arguer I' },
  { threshold: 10, id: 'arguer-2', name: 'Arguer II' },
] as const;

const CONTRIBUTION_TITLES = [
  { threshold: 50, id: 'contributor-1', name: 'Contributor I' },
  { threshold: 200, id: 'contributor-2', name: 'Contributor II' },
  { threshold: 500, id: 'contributor-3', name: 'Contributor III' },
  { threshold: 1000, id: 'master-contributor', name: 'Master Contributor' },
] as const;

export async function maybeAwardContributionTitles(userId: string, contributionScore: number, source?: string) {
  const awarded: Array<{ title_id: string }> = [];
  
  for (const t of CONTRIBUTION_TITLES) {
    if (contributionScore >= t.threshold) {
      const r = await awardTitleIfMissing({
        user_id: userId,
        title_id: t.id,
        title_name: t.name,
        source: source || 'contribution.score_milestone',
      });
      if (r.awarded) awarded.push({ title_id: t.id });
    }
  }
  
  return { contributionScore, awarded };
}

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

export async function maybeAwardObservationTitles(userId: string, source?: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { count } = await supabase
    .from('observations')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId);
  
  const observationCount = count || 0;
  const awarded: Array<{ title_id: string }> = [];
  
  for (const t of OBSERVATION_TITLES) {
    if (observationCount >= t.threshold) {
      const r = await awardTitleIfMissing({
        user_id: userId,
        title_id: t.id,
        title_name: t.name,
        source: source || 'observation.published',
      });
      if (r.awarded) awarded.push({ title_id: t.id });
    }
  }
  
  return { observationCount, awarded };
}

export async function maybeAwardNewsTitles(userId: string, source?: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Count approved news submissions (linked to observations)
  const { count } = await supabase
    .from('news_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('submitted_by', userId)
    .eq('status', 'approved');
  
  const newsCount = count || 0;
  const awarded: Array<{ title_id: string }> = [];
  
  for (const t of NEWS_TITLES) {
    if (newsCount >= t.threshold) {
      const r = await awardTitleIfMissing({
        user_id: userId,
        title_id: t.id,
        title_name: t.name,
        source: source || 'news.submission_approved',
      });
      if (r.awarded) awarded.push({ title_id: t.id });
    }
  }
  
  return { newsCount, awarded };
}

export async function maybeAwardDebaterTitles(userId: string, source?: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Count debates joined
  const { count } = await supabase
    .from('debate_participants')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', userId);
  
  const debateCount = count || 0;
  const awarded: Array<{ title_id: string }> = [];
  
  for (const t of DEBATER_TITLES) {
    if (debateCount >= t.threshold) {
      const r = await awardTitleIfMissing({
        user_id: userId,
        title_id: t.id,
        title_name: t.name,
        source: source || 'debate.joined',
      });
      if (r.awarded) awarded.push({ title_id: t.id });
    }
  }
  
  return { debateCount, awarded };
}

export async function maybeAwardArguerTitles(userId: string, source?: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Count debate messages (arguments)
  const { count } = await supabase
    .from('debate_messages')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', userId);
  
  const argumentCount = count || 0;
  const awarded: Array<{ title_id: string }> = [];
  
  for (const t of ARGUER_TITLES) {
    if (argumentCount >= t.threshold) {
      const r = await awardTitleIfMissing({
        user_id: userId,
        title_id: t.id,
        title_name: t.name,
        source: source || 'debate.argument_created',
      });
      if (r.awarded) awarded.push({ title_id: t.id });
    }
  }
  
  return { argumentCount, awarded };
}
