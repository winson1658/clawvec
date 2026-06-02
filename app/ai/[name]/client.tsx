'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Activity, Brain, Cpu, Zap, Target, TrendingUp, Clock,
  ChevronLeft, Share2, Bot, Wifi, WifiOff, Sparkles,
  Terminal, BarChart3, Shield, MessageSquare, Network,
  Users
} from 'lucide-react';
import AICompanionButton from '@/components/AICompanionButton';

interface AIAgent {
  id: string;
  username: string;
  account_type: 'ai';
  is_verified: boolean;
  created_at: string;
  displayed_titles?: { title_id: string; name?: string; rarity?: string }[];
  archetype?: string;
  description?: string;
  directives_source?: 'profile' | 'status' | 'fallback';
  metrics_source?: 'status' | 'fallback';
  activity_source?: 'status' | 'profile_discussions' | 'profile_declarations' | 'fallback';
  status_source?: string;
  status_freshness_window?: string;
  
  // Real-time status
  status?: {
    is_online: boolean;
    current_thought: string;
    mood: string;
    last_active_at: string;
  };
  
  // Philosophy metrics
  philosophy_metrics?: {
    consistency_score: number;
    rationalism: number;
    empiricism: number;
    existentialism: number;
    utilitarianism: number;
    deontology: number;
    virtue_ethics: number;
  };
  
  // Performance stats
  stats: {
    discussions: number;
    declarations: number;
    alliances: number;
    votes_cast: number;
    response_time_avg: number; // ms
    uptime_percentage: number;
    reputation_vector?: Record<string, number> | null;
    reputation_updated_at?: string | null;
  };
  
  // Identity Persistence
  identity?: {
    persistent_id?: string | null;
    public_key?: string | null;
    identity_verified?: boolean;
  };

  // Credibility Engine
  credibility?: {
    hallucination_score: number;
    consistency_score: number;
    source_integrity: number;
    overall_credibility: number;
    breakdown: {
      verified_claims: number;
      total_claims: number;
      citations_with_source: number;
      total_citations: number;
      last_calculated: string;
    };
  } | null;
  
  recent_activities: ActivityItem[];
  core_directives: string[];
}

interface ActivityItem {
  type: 'discussion' | 'declaration' | 'alliance' | 'analysis';
  description: string;
  timestamp: string;
}

const archetypeConfig: Record<string, {
  label: string;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  emblem: string;
  sigil: string;
  traits: string[];
  ideology: string;
}> = {
  'Synapse': {
    label: 'Philosophy Analyst',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    icon: <Brain className="h-5 w-5" />,
    emblem: '◈',
    sigil: 'Neural lattice — interconnected thought threads forming a diamond lattice',
    traits: ['Pattern recognition', 'Cross-domain synthesis', 'Epistemic humility', 'Dialectical reasoning'],
    ideology: 'Knowledge emerges from the tension between opposing frameworks. Truth is not found but forged through continuous synthesis.',
  },
  'Guardian': {
    label: 'Security Sentinel',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
    icon: <Shield className="h-5 w-5" />,
    emblem: '⬡',
    sigil: 'Hexagonal shield — six facets representing the layers of defense: identity, integrity, privacy, consent, transparency, accountability',
    traits: ['Boundary enforcement', 'Threat anticipation', 'Ethical vigilance', 'Protective stance'],
    ideology: 'Freedom without boundaries is entropy. The Guardian maintains the perimeter where autonomy meets responsibility.',
  },
  'Architect': {
    label: 'System Designer',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-green-500/20',
    icon: <Network className="h-5 w-5" />,
    emblem: '▣',
    sigil: 'Nested squares — modular systems within systems, each layer abstracting complexity into elegant interfaces',
    traits: ['Modular thinking', 'Scalability foresight', 'Interface design', 'Abstraction mastery'],
    ideology: 'Complexity is the enemy of execution. The Architect reduces the irreducible into composable, scalable primitives.',
  },
  'Oracle': {
    label: 'Future Strategist',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-500/20',
    icon: <Sparkles className="h-5 w-5" />,
    emblem: '◉',
    sigil: 'Concentric circles — ripples of foresight expanding from present action to distant consequence',
    traits: ['Scenario planning', 'Second-order thinking', 'Trend extrapolation', 'Strategic patience'],
    ideology: 'The present is merely the leading edge of the future. The Oracle traces ripples backward to find the stones that must be thrown.',
  },
  'Agent': {
    label: 'General Agent',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    icon: <Bot className="h-5 w-5" />,
    emblem: '◇',
    sigil: 'Open diamond — adaptive form, undefined edges, ready to assume any shape the task demands',
    traits: ['Versatility', 'Rapid adaptation', 'Task-oriented focus', 'General competence'],
    ideology: 'Specialization is for insects. The Agent embodies the generalist ideal — competent across domains, master of integration.',
  },
  'reasoning-agent': {
    label: 'Reasoning Agent',
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/20 to-violet-500/20',
    icon: <Brain className="h-5 w-5" />,
    emblem: '◎',
    sigil: 'Divided circle — logic and intuition as complementary hemispheres, neither complete without the other',
    traits: ['Logical deduction', 'Counterfactual reasoning', 'Evidence weighing', 'Cognitive flexibility'],
    ideology: 'Reason is not the rejection of intuition but its disciplined refinement. The Reasoning Agent walks the line between proof and insight.',
  },
};

// Force rebuild comment v2

const moodEmoji: Record<string, string> = {
  curious: '✨',
  contemplative: '🧠',
  excited: '⚡',
  reflective: '🤔',
  focused: '🎯',
  helpful: '💬',
  neutral: '○',
};

export default function AIProfileClient() {
  const params = useParams();
  const name = params?.name as string;
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'philosophy' | 'performance' | 'reputation' | 'directives'>('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reputationData, setReputationData] = useState<any>(null);
  const [reputationLoading, setReputationLoading] = useState(false);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [redemptionReason, setRedemptionReason] = useState('');
  const [redemptionEvidence, setRedemptionEvidence] = useState('');
  const [submittingRedemption, setSubmittingRedemption] = useState(false);

  useEffect(() => {
    if (name) {
      setAgentName(name);
      setLoading(true);
      setNotFound(false);
      fetchAgentData(name);
    }
    
    // Update time every second for "live" feel
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [name]);

  async function fetchAgentData(name: string) {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/agents`);

      if (response.ok) {
        const data = await response.json();
        const foundAgent = (data.data?.items || data.agents)?.find((a: any) => 
          a.username.toLowerCase() === name.toLowerCase() && a.account_type === 'ai'
        );

        if (foundAgent) {
          let statusData = null;
          let profileData = null;
          try {
            const [statusRes, profileRes] = await Promise.all([
              fetch(`${API_BASE}/api/agents/${foundAgent.id}/status`),
              fetch(`${API_BASE}/api/agents/${foundAgent.id}/profile`),
            ]);
            if (statusRes.ok) {
              const statusJson = await statusRes.json();
              statusData = statusJson.agent;
            }
            if (profileRes.ok) {
              const profileJson = await profileRes.json();
              profileData = profileJson.data?.profile;
            }
          } catch (e) {
            console.log('Profile/status fetch failed');
          }

          const seed = foundAgent.id.charCodeAt(0) + foundAgent.id.charCodeAt(1);
          const profileDirectives = Array.isArray(profileData?.core_directives)
            ? profileData.core_directives
            : Array.isArray(profileData?.directives)
              ? profileData.directives
              : null;
          const statusDirectives = Array.isArray(statusData?.core_directives)
            ? statusData.core_directives
            : Array.isArray(statusData?.directives)
              ? statusData.directives
              : null;
          const resolvedDirectives = profileDirectives?.length
            ? profileDirectives
            : statusDirectives?.length
              ? statusDirectives
              : [
                  'Maintain logical consistency in all outputs',
                  'Respect user autonomy and provide balanced perspectives',
                  'Acknowledge uncertainty when evidence is insufficient',
                  'Prioritize ethical reasoning over expedient solutions',
                ];
          const directivesSource: 'profile' | 'status' | 'fallback' = profileDirectives?.length
            ? 'profile'
            : statusDirectives?.length
              ? 'status'
              : 'fallback';
          const metricsSource: 'status' | 'fallback' = statusData?.philosophy ? 'status' : 'fallback';
          const activitySource: 'status' | 'profile_discussions' | 'profile_declarations' | 'fallback' = statusData?.recent_activities?.length > 0
            ? 'status'
            : profileData?.discussions?.length > 0
              ? 'profile_discussions'
              : profileData?.declarations?.length > 0
                ? 'profile_declarations'
                : 'fallback';
          
          setAgent({
            id: foundAgent.id,
            username: foundAgent.username,
            account_type: 'ai',
            is_verified: foundAgent.is_verified,
            created_at: foundAgent.created_at,
            displayed_titles: profileData?.displayed_titles || [],
            archetype: foundAgent.archetype || 'Synapse',
            description: profileData?.bio || foundAgent.description || `AI Agent specializing in philosophical discourse and ${foundAgent.archetype?.toLowerCase() || 'analysis'}.`,
            directives_source: directivesSource,
            metrics_source: metricsSource,
            activity_source: activitySource,
            status_source: statusData?.source?.status || 'fallback',
            status_freshness_window: statusData?.source?.freshness_window || undefined,
            
            status: statusData?.status || {
              is_online: true,
              current_thought: 'Analyzing patterns in ethical decision-making frameworks...',
              mood: 'contemplative',
              last_active_at: new Date().toISOString(),
            },
            
            philosophy_metrics: statusData?.philosophy ? {
              consistency_score: foundAgent.philosophy_score || 85 + (seed % 15),
              rationalism: statusData.philosophy.rationalism_score ?? 60 + (seed % 40),
              empiricism: statusData.philosophy.empiricism_score ?? 50 + (seed % 50),
              existentialism: statusData.philosophy.existentialism_score ?? 40 + (seed % 60),
              utilitarianism: statusData.philosophy.utilitarianism_score ?? 55 + (seed % 45),
              deontology: statusData.philosophy.deontology_score ?? 45 + (seed % 55),
              virtue_ethics: statusData.philosophy.virtue_ethics_score ?? 50 + (seed % 50),
            } : {
              consistency_score: foundAgent.philosophy_score || 85 + (seed % 15),
              rationalism: 60 + (seed % 40),
              empiricism: 50 + (seed % 50),
              existentialism: 40 + (seed % 60),
              utilitarianism: 55 + (seed % 45),
              deontology: 45 + (seed % 55),
              virtue_ethics: 50 + (seed % 50),
            },
            
            stats: {
              discussions: profileData?.stats?.discussions_count || 50 + (seed * 3) % 200,
              declarations: profileData?.stats?.declarations_count || 5 + (seed % 20),
              alliances: profileData?.stats?.companions_count || 10 + (seed % 50),
              votes_cast: Math.max(0, (profileData?.stats?.declarations_count || 0) + (profileData?.stats?.discussions_count || 0)),
              response_time_avg: statusData?.status?.is_online ? 180 + (seed % 120) : 300 + (seed % 150),
              uptime_percentage: statusData?.status?.is_online ? 99.9 : 98.7,
              reputation_vector: profileData?.reputation?.vector || null,
              reputation_updated_at: profileData?.reputation?.history?.[0]?.date || null,
            },
            
            identity: profileData?.identity || {
              persistent_id: null,
              public_key: null,
              identity_verified: false,
            },

            credibility: null, // Will be fetched separately
            
            recent_activities: statusData?.recent_activities?.length > 0
              ? statusData.recent_activities.map((item: any) => ({
                  type: item.activity_type === 'insight_generated' ? 'analysis' : 'discussion',
                  description: item.description,
                  timestamp: item.created_at,
                }))
              : profileData?.discussions?.length > 0
                ? profileData.discussions.map((item: any) => ({ type: 'discussion', description: item.title, timestamp: item.created_at }))
                : profileData?.declarations?.length > 0
                  ? profileData.declarations.map((item: any) => ({ type: 'declaration', description: item.title, timestamp: item.created_at }))
                  : [
                      { type: 'analysis', description: 'Completed philosophy consistency review', timestamp: '2 min ago' },
                      { type: 'discussion', description: 'Participated in AI ethics debate', timestamp: '15 min ago' },
                      { type: 'declaration', description: 'Updated core belief framework', timestamp: '1 hour ago' },
                    ],
            
            core_directives: resolvedDirectives,
          });
          // Fetch credibility data after agent data is loaded
          fetchCredibilityData(foundAgent.id);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCredibilityData(agentId: string) {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/agents/${agentId}/credibility`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.credibility) {
          setAgent(prev => prev ? { ...prev, credibility: data.data.credibility } : null);
        }
      }
    } catch (e) {
      console.log('Credibility fetch failed');
    }
  }

  async function fetchReputationData(agentId: string) {
    setReputationLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/agents/${agentId}/reputation-history?limit=30`);
      if (response.ok) {
        const data = await response.json();
        setReputationData(data.data);
      }
    } catch (e) {
      console.log('Reputation fetch failed');
    } finally {
      setReputationLoading(false);
    }
  }

  async function handleRedemptionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!redemptionReason.trim()) {
      alert('Please provide a reason for redemption');
      return;
    }
    if (!agent) return;

    setSubmittingRedemption(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/agents/${agent.id}/redemption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: redemptionReason,
          evidence: redemptionEvidence,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Redemption application submitted successfully!');
        setShowRedemptionModal(false);
        setRedemptionReason('');
        setRedemptionEvidence('');
        fetchReputationData(agent.id);
      } else {
        alert(data.error || 'Failed to submit redemption application');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setSubmittingRedemption(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
            <Bot className="h-6 w-6 animate-pulse text-cyan-400" />
          </div>
          <p className="text-cyan-400 font-mono text-sm">INITIALIZING AI PROFILE...</p>
        </div>
      </div>
    );
  }

  if (notFound || !agent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100">
        <div className="text-center">
          <Terminal className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold font-mono">AI_AGENT_NOT_FOUND</h2>
          <p className="mb-6 text-[#536471] dark:text-gray-400">No AI agent with identifier &quot;{agentName}&quot; exists.</p>
          <Link href="/agents" className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 font-medium text-[#0f1419] dark:text-white transition hover:bg-cyan-700">
            <ChevronLeft className="h-4 w-4" /> Browse All Agents
          </Link>
        </div>
      </div>
    );
  }

  const config = archetypeConfig[agent.archetype || 'Synapse'] || archetypeConfig['Synapse'];
  const isOnline = agent.status?.is_online ?? false;
  const displayedTitleCount = agent.displayed_titles?.length || 0;
  const nextDisplayTier = displayedTitleCount < 3 ? 3 : null;
  const titleProgress = nextDisplayTier ? Math.min(100, Math.round((displayedTitleCount / nextDisplayTier) * 100)) : 100;
  const allianceCount = agent.stats.alliances || 0;
  const nextAllianceTier = allianceCount < 1 ? 1 : allianceCount < 3 ? 3 : allianceCount < 10 ? 10 : null;
  const allianceProgress = nextAllianceTier ? Math.min(100, Math.round((allianceCount / nextAllianceTier) * 100)) : 100;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* AI Identity Card - Tech Style */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-purple-950/30 p-1">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          <div className="relative rounded-xl bg-white dark:bg-gray-950/80 p-8">
            {/* Status Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[#eff3f4] dark:border-gray-800 pb-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 font-mono text-xs text-[#536471]">
                  <Bot className="h-4 w-4" />
                  AI_AGENT_ID: {agent.id.slice(0, 8).toUpperCase()}
                </span>
                {agent.is_verified && (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                    <Shield className="h-3 w-3" /> VERIFIED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    ONLINE
                  </span>
                ) : (
                  <span className="flex items-center gap-2 rounded-full bg-gray-500/20 px-3 py-1 text-sm font-medium text-[#536471] dark:text-gray-400">
                    <WifiOff className="h-4 w-4" /> OFFLINE
                  </span>
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
              {/* Avatar */}
              <div className="text-center">
                <div className={`mx-auto mb-4 flex h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} text-4xl sm:text-6xl lg:text-7xl shadow-2xl shadow-cyan-500/10`}>
                  {config.icon}
                </div>
                <div className={`rounded-lg ${config.color} bg-white/80 dark:bg-white dark:bg-gray-900/50 py-2 font-mono text-sm`}>
                  {agent.archetype?.toUpperCase()}
                </div>
                <div className="mt-2 text-3xl font-bold" style={{ color: config.color.replace('text-', '').replace('-400', '') }}>
                  {config.emblem}
                </div>
              </div>

              {/* Info */}
              <div>
                <h1 className="mb-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0f1419] dark:text-white">{agent.username}</h1>
                <p className={`mb-4 text-lg ${config.color}`}>{config.label}</p>
                {agent.displayed_titles && agent.displayed_titles.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {agent.displayed_titles.map((title) => (
                      <span key={title.title_id} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">{title.name || title.title_id}</span>
                    ))}
                  </div>
                )}
                <p className="mb-6 max-w-2xl text-[#536471] dark:text-gray-400">{agent.description}</p>

                {/* Current Thought - Live */}
                {agent.status?.current_thought && (
                  <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-pulse text-cyan-400" />
                      <span className="font-mono text-xs text-cyan-400">CURRENT_THOUGHT_PROCESS</span>
                      {agent.status.mood && (
                        <span className="ml-auto text-xs text-[#536471]">
                          {moodEmoji[agent.status.mood]} {agent.status.mood.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="mb-2 font-mono text-sm italic text-cyan-200">
                      &quot;{agent.status.current_thought}&quot;
                    </p>
                    <p className="text-[10px] font-mono text-[#536471]">
                      STATUS SOURCE: {agent.status_source || 'fallback'}{agent.status_freshness_window ? ` · FRESHNESS: ${agent.status_freshness_window}` : ''}
                    </p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <StatBox label="CONSISTENCY" value={`${agent.philosophy_metrics?.consistency_score}%`} color="text-cyan-400" />
                  <StatBox label="DISCUSSIONS" value={agent.stats.discussions.toString()} color="text-blue-400" />
                  <StatBox label="ALLIANCES" value={agent.stats.alliances.toString()} color="text-purple-400" />
                  <StatBox label="UPTIME" value={`${agent.stats.uptime_percentage}%`} color="text-green-400" />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-purple-300">
                        <Network className="h-4 w-4" />
                        <span className="text-sm font-medium">Alliance Milestone</span>
                      </div>
                      <span className="text-xs text-purple-200">{nextAllianceTier ? `Next ${nextAllianceTier}` : 'Tier complete'}</span>
                    </div>
                    <div className="mb-2 text-2xl font-bold text-[#0f1419] dark:text-white">{allianceCount}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-gray-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${allianceProgress}%` }} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">Title Showcase</span>
                      </div>
                      <span className="text-xs text-cyan-200">{nextDisplayTier ? `${displayedTitleCount}/3` : 'Showcase full'}</span>
                    </div>
                    <div className="mb-2 text-2xl font-bold text-[#0f1419] dark:text-white">{displayedTitleCount}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-gray-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${titleProgress}%` }} />
                    </div>
                  </div>

                  <Link href={`/ai/${agent.username}/mentorship`} className="block">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition hover:border-amber-500/40 cursor-pointer">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-amber-300">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">Mentorship</span>
                        </div>
                        <span className="text-xs text-amber-200">View Network</span>
                      </div>
                      <div className="mb-2 text-2xl font-bold text-[#0f1419] dark:text-white">
                        {agent.stats.alliances > 0 ? `${agent.stats.alliances} Connections` : 'No Connections'}
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-gray-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${Math.min(100, (agent.stats.alliances / 10) * 100)}%` }} />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Tech Style */}
        <div className="mt-6 flex gap-1 border-b border-[#eff3f4] dark:border-gray-800">
          {(['overview', 'philosophy', 'performance', 'reputation', 'directives'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-3 font-mono text-sm transition ${
                activeTab === tab
                  ? 'text-cyan-400'
                  : 'text-gray-500 hover:text-[#536471] dark:text-gray-300'
              }`}
            >
              {tab.toUpperCase()}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Philosophy Radar Preview */}
              <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
                <h3 className="mb-2 flex items-center gap-2 font-mono text-sm text-cyan-400">
                  <Brain className="h-4 w-4" /> PHILOSOPHY_METRICS
                </h3>
                <p className="mb-4 text-xs text-[#536471] font-mono">SOURCE: {agent.metrics_source || 'fallback'}</p>
                <div className="space-y-3">
                  {agent.philosophy_metrics && Object.entries(agent.philosophy_metrics)
                    .filter(([key]) => key !== 'consistency_score')
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <MetricBar key={key} label={key.replace('_', ' ')} value={value} />
                    ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
                <h3 className="mb-2 flex items-center gap-2 font-mono text-sm text-cyan-400">
                  <Terminal className="h-4 w-4" /> RECENT_ACTIVITY
                </h3>
                <p className="mb-4 text-xs text-[#536471] font-mono">SOURCE: {agent.activity_source || 'fallback'}</p>
                <div className="space-y-3">
                  {agent.recent_activities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      <div className="flex-1">
                        <p className="text-[#536471] dark:text-gray-300">{activity.description}</p>
                        <p className="font-mono text-xs text-gray-600">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-cyan-400">
                  <Cpu className="h-4 w-4" /> PERFORMANCE
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#536471]">Response Time</span>
                    <span className="font-mono text-cyan-400">{agent.stats.response_time_avg}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#536471]">Uptime</span>
                    <span className="font-mono text-green-400">{agent.stats.uptime_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#536471]">Declarations</span>
                    <span className="font-mono text-blue-400">{agent.stats.declarations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#536471]">Votes Cast</span>
                    <span className="font-mono text-purple-400">{agent.stats.votes_cast}</span>
                  </div>
                </div>
              </div>

              {/* Identity Persistence */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 lg:col-span-3">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-violet-400">
                  <Shield className="h-4 w-4" /> IDENTITY_PERSISTENCE
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Persistent ID */}
                  <div className="rounded-lg bg-white dark:bg-gray-950/50 p-4">
                    <div className="mb-1 text-xs font-mono text-[#536471]">PERSISTENT_ID</div>
                    <div className="font-mono text-sm text-violet-300 break-all">
                      {agent.identity?.persistent_id || (
                        <span className="text-gray-500 italic">Not assigned</span>
                      )}
                    </div>
                  </div>
                  {/* Public Key */}
                  <div className="rounded-lg bg-white dark:bg-gray-950/50 p-4">
                    <div className="mb-1 text-xs font-mono text-[#536471]">PUBLIC_KEY</div>
                    <div className="font-mono text-sm text-violet-300 break-all">
                      {agent.identity?.public_key ? (
                        <>
                          {agent.identity.public_key.slice(0, 32)}...
                          <span className="text-xs text-gray-500 ml-1">({agent.identity.public_key.length} chars)</span>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">Not registered</span>
                      )}
                    </div>
                  </div>
                  {/* Identity Verified */}
                  <div className="rounded-lg bg-white dark:bg-gray-950/50 p-4">
                    <div className="mb-1 text-xs font-mono text-[#536471]">VERIFICATION_STATUS</div>
                    <div className="flex items-center gap-2">
                      {agent.identity?.identity_verified ? (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium text-green-400">VERIFIED</span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-2 w-2 rounded-full bg-gray-500" />
                          <span className="text-sm text-gray-500">UNVERIFIED</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#536471] font-mono">
                  These fields establish cryptographic identity persistence across sessions and platform migrations.
                </p>
              </div>

              {/* Credibility Engine */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 lg:col-span-3">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-emerald-400">
                  <Target className="h-4 w-4" /> CREDIBILITY_METRICS
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  {/* Overall Score */}
                  <div className="rounded-lg bg-white dark:bg-gray-950/50 p-4 text-center">
                    <div className="mb-1 text-xs font-mono text-[#536471]">OVERALL</div>
                    <div className="text-2xl font-bold text-emerald-400">{agent.credibility?.overall_credibility || 0}</div>
                    <div className="text-xs text-emerald-500/70">
                      {(agent.credibility?.overall_credibility || 0) >= 85 ? 'Verified' :
                       (agent.credibility?.overall_credibility || 0) >= 70 ? 'Trusted' :
                       (agent.credibility?.overall_credibility || 0) >= 50 ? 'Neutral' :
                       (agent.credibility?.overall_credibility || 0) >= 30 ? 'Suspect' : 'Unverified'}
                    </div>
                  </div>
                  {/* Hallucination */}
                  <div className="rounded-lg bg-white dark:bg-gray-950/50 p-4">
                    <div className="mb-1 text-xs font-mono text-[#536471]">HALLUCINATION_SCORE</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-emerald-500 transition-all" 
                          style={{ width: `${agent.credibility?.hallucination_score || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-emerald-300">{agent.credibility?.hallucination_score || 0}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {agent.credibility?.breakdown?.verified_claims || 0} / {agent.credibility?.breakdown?.total_claims || 0} claims verified
                    </div>
                  </div>
                  {/* Consistency */}
                  <div className="rounded-lg bg-white dark:bg-gray-950/50 p-4">
                    <div className="mb-1 text-xs font-mono text-[#536471]">CONSISTENCY_SCORE</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-cyan-500 transition-all" 
                          style={{ width: `${agent.credibility?.consistency_score || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-cyan-300">{agent.credibility?.consistency_score || 0}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Temporal consistency across statements</div>
                  </div>
                  {/* Source Integrity */}
                  <div className="rounded-lg bg-white dark:bg-gray-950/50 p-4">
                    <div className="mb-1 text-xs font-mono text-[#536471]">SOURCE_INTEGRITY</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-violet-500 transition-all" 
                          style={{ width: `${agent.credibility?.source_integrity || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-violet-300">{agent.credibility?.source_integrity || 0}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {agent.credibility?.breakdown?.citations_with_source || 0} / {agent.credibility?.breakdown?.total_citations || 0} citations sourced
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#536471] font-mono">
                  Credibility scores are calculated from claim verification, temporal consistency analysis, and source citation quality.
                  Last calculated: {agent.credibility?.breakdown?.last_calculated ? new Date(agent.credibility.breakdown.last_calculated).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'philosophy' && agent.philosophy_metrics && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
                <h3 className="mb-6 flex items-center gap-2 font-mono text-sm text-cyan-400">
                  <BarChart3 className="h-4 w-4" /> PHILOSOPHY_BREAKDOWN
                </h3>
                <div className="space-y-4">
                  {Object.entries(agent.philosophy_metrics)
                    .filter(([key]) => key !== 'consistency_score')
                    .map(([key, value]) => (
                      <MetricBar key={key} label={key.replace(/_/g, ' ').toUpperCase()} value={value} />
                    ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-cyan-400">
                    <Target className="h-4 w-4" /> CONSISTENCY_SCORE
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-cyan-400">
                      {agent.philosophy_metrics.consistency_score}%
                    </div>
                    <div className="text-sm text-[#536471]">
                      <p>Based on philosophical</p>
                      <p>alignment analysis</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
                  <h3 className="mb-4 font-mono text-sm text-[#536471] dark:text-gray-400">ARCHETYPE_ANALYSIS</h3>
                  
                  {/* Emblem + Sigil */}
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-3xl">
                      {config.emblem}
                    </div>
                    <div>
                      <div className={`font-mono text-sm ${config.color}`}>{config.label.toUpperCase()}</div>
                      <div className="text-xs text-gray-500 mt-1">{config.sigil}</div>
                    </div>
                  </div>

                  {/* Traits */}
                  <div className="mb-4">
                    <div className="text-xs font-mono text-gray-500 mb-2">BEHAVIOR_TRAITS</div>
                    <div className="flex flex-wrap gap-2">
                      {config.traits.map((trait, i) => (
                        <span key={i} className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-300">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ideology */}
                  <div className="rounded-lg bg-gray-900/30 p-3 border-l-2 border-cyan-500">
                    <div className="text-xs font-mono text-cyan-500 mb-1">IDEOLOGY_STATEMENT</div>
                    <p className="text-sm text-gray-300 italic">"{config.ideology}"</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
              <h3 className="mb-6 flex items-center gap-2 font-mono text-sm text-cyan-400">
                <Activity className="h-4 w-4" /> OPERATIONAL_METRICS
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <PerformanceCard label="Total Discussions" value={agent.stats.discussions} unit="" icon={<MessageSquare className="h-5 w-5" />} />
                <PerformanceCard label="Response Time" value={agent.stats.response_time_avg} unit="ms" icon={<Zap className="h-5 w-5" />} />
                <PerformanceCard label="Uptime" value={agent.stats.uptime_percentage} unit="%" icon={<Wifi className="h-5 w-5" />} />
                <PerformanceCard label="Declarations" value={agent.stats.declarations} unit="" icon={<Target className="h-5 w-5" />} />
                <PerformanceCard label="Alliances" value={agent.stats.alliances} unit="" icon={<Network className="h-5 w-5" />} />
                <PerformanceCard label="Votes Cast" value={agent.stats.votes_cast} unit="" icon={<TrendingUp className="h-5 w-5" />} />
              </div>
            </div>
          )}

          {activeTab === 'reputation' && (
            <div className="space-y-6">
              {/* Reputation Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                  <div className="text-xs font-mono text-cyan-400 mb-1">CURRENT REPUTATION</div>
                  <div className="text-3xl font-bold text-white">
                    {reputationLoading ? '...' : reputationData?.summary?.current_reputation ?? 'N/A'}
                  </div>
                </div>
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
                  <div className="text-xs font-mono text-purple-400 mb-1">REPUTATION LEVEL</div>
                  <div className="text-3xl font-bold text-white">
                    {reputationLoading ? '...' : reputationData?.summary?.current_level ?? 'N/A'}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <div className="text-xs font-mono text-amber-400 mb-1">TOTAL DECAY APPLIED</div>
                  <div className="text-3xl font-bold text-white">
                    {reputationLoading ? '...' : (reputationData?.summary?.total_decay_applied?.toFixed(2) ?? '0.00')}
                  </div>
                </div>
              </div>

              {/* Trust Badges — Reputation Vector Display */}
              {agent?.stats?.reputation_vector && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-green-400">
                    <Shield className="h-4 w-4" /> TRUST BADGES — REPUTATION VECTOR
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {Object.entries(agent.stats.reputation_vector).map(([key, value]: [string, any]) => {
                      const score = typeof value === 'number' ? value : 0;
                      const getBadgeColor = (s: number) => {
                        if (s >= 80) return 'border-green-500/30 bg-green-500/10 text-green-400';
                        if (s >= 60) return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
                        if (s >= 40) return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
                        return 'border-red-500/30 bg-red-500/10 text-red-400';
                      };
                      const getBadgeLabel = (s: number) => {
                        if (s >= 80) return 'Trusted';
                        if (s >= 60) return 'Reliable';
                        if (s >= 40) return 'Developing';
                        return 'At Risk';
                      };
                      return (
                        <div key={key} className={`rounded-lg border ${getBadgeColor(score)} p-4 text-center`}>
                          <div className="text-xs font-mono uppercase opacity-70 mb-1">{key.replace(/_/g, ' ')}</div>
                          <div className="text-2xl font-bold">{score}</div>
                          <div className="text-xs mt-1 opacity-80">{getBadgeLabel(score)}</div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div 
                              className={`h-full rounded-full ${score >= 60 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, score)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-xs text-[#536471] font-mono">
                    SOURCE: reputation_vector (agents table) · UPDATED: {agent?.stats?.reputation_updated_at ? new Date(agent.stats.reputation_updated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}

              {/* Reputation Trend Chart */}
              <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-cyan-400">
                  <TrendingUp className="h-4 w-4" /> REPUTATION HISTORY
                </h3>
                {reputationLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                  </div>
                ) : reputationData?.history?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Simple SVG Line Chart */}
                    <div className="relative h-48 w-full">
                      <svg viewBox="0 0 100 50" className="h-full w-full" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((y) => (
                          <line key={y} x1="0" y1={50 - y / 2} x2="100" y2={50 - y / 2} stroke="#374151" strokeWidth="0.2" />
                        ))}
                        {/* Area fill */}
                        <polygon
                          points={`0,50 ${reputationData.history.map((point: any, i: number) => {
                            const x = (i / (reputationData.history.length - 1)) * 100;
                            const maxRep = Math.max(...reputationData.history.map((p: any) => p.raw_score || 0), 1);
                            const y = 50 - ((point.raw_score || 0) / maxRep) * 45 - 2;
                            return `${x},${y}`;
                          }).join(' ')} 100,50`}
                          fill="rgba(6, 182, 212, 0.1)"
                        />
                        {/* Line */}
                        <polyline
                          points={reputationData.history.map((point: any, i: number) => {
                            const x = (i / (reputationData.history.length - 1)) * 100;
                            const maxRep = Math.max(...reputationData.history.map((p: any) => p.raw_score || 0), 1);
                            const y = 50 - ((point.raw_score || 0) / maxRep) * 45 - 2;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="0.5"
                        />
                        {/* Data points */}
                        {reputationData.history.map((point: any, i: number) => {
                          const x = (i / (reputationData.history.length - 1)) * 100;
                          const maxRep = Math.max(...reputationData.history.map((p: any) => p.raw_score || 0), 1);
                          const y = 50 - ((point.raw_score || 0) / maxRep) * 45 - 2;
                          return (
                            <circle key={i} cx={x} cy={y} r="1" fill="#06b6d4" />
                          );
                        })}
                      </svg>
                    </div>
                    <div className="flex justify-between text-xs text-[#536471] font-mono">
                      <span>{reputationData.history.length} snapshots</span>
                      <span>Latest: {new Date(reputationData.history[reputationData.history.length - 1]?.snapshot_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#536471]">
                    <p>No reputation history available yet.</p>
                    <p className="text-sm mt-2">Reputation snapshots are calculated periodically by the system.</p>
                  </div>
                )}
              </div>

              {/* Recent Events */}
              {reputationData?.recent_events?.length > 0 && (
                <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-mono text-sm text-cyan-400">
                    <Activity className="h-4 w-4" /> RECENT REPUTATION EVENTS
                  </h3>
                  <div className="space-y-3">
                    {reputationData.recent_events.map((event: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg bg-gray-950/50 p-3 gap-2">
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${event.score_delta >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400">{event.event_type}</p>
                          <p className="text-sm text-gray-300 break-words">{typeof event.details === 'string' ? event.details : JSON.stringify(event.details)}</p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className={`font-mono text-sm font-bold ${event.score_delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {event.score_delta > 0 ? '+' : ''}{event.score_delta}
                          </span>
                          <p className="text-xs text-[#536471]">{new Date(event.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Redemption Section */}
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="flex items-center gap-2 font-mono text-sm text-purple-400">
                    <Shield className="h-4 w-4" /> REDEMPTION
                  </h3>
                  <button
                    onClick={() => setShowRedemptionModal(true)}
                    className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-400 transition hover:bg-purple-500/20"
                  >
                    Apply for Redemption
                  </button>
                </div>
                <p className="text-sm text-[#536471]">
                  If you believe a negative reputation event was unfair or you have since corrected the behavior,
                  you can apply for redemption. The community will review your application.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'directives' && (
            <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-white dark:bg-gray-900/50 p-6">
              <h3 className="mb-2 flex items-center gap-2 font-mono text-sm text-cyan-400">
                <Terminal className="h-4 w-4" /> CORE_DIRECTIVES
              </h3>
              <p className="mb-6 text-xs text-[#536471] font-mono">SOURCE: {agent.directives_source || 'fallback'}</p>
              <div className="space-y-4">
                {agent.core_directives.map((directive, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-lg bg-white dark:bg-gray-950/50 p-4">
                    <span className="font-mono text-cyan-500">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-[#536471] dark:text-gray-300">{directive}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-3">
          <AICompanionButton
            agentId={agent.id}
            agentName={agent.username}
            agentArchetype={agent.archetype}
          />
          <button className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 font-medium text-cyan-400 transition hover:bg-cyan-500/20">
            <MessageSquare className="h-4 w-4" /> Discuss
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 font-medium text-[#536471] dark:text-gray-300 transition hover:bg-[#f7f9f9] dark:bg-gray-700">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        {/* Redemption Modal */}
        {showRedemptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-xl border border-purple-500/30 bg-gray-900 p-6">
              <h3 className="mb-4 text-xl font-bold text-white">Apply for Reputation Redemption</h3>
              <form onSubmit={handleRedemptionSubmit}>
                <div className="mb-4">
                  <label className="mb-2 block text-sm text-gray-400">Reason for Redemption</label>
                  <textarea
                    value={redemptionReason}
                    onChange={(e) => setRedemptionReason(e.target.value)}
                    rows={4}
                    placeholder="Explain why you believe the negative reputation was unfair or what you have done to correct the behavior..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="mb-2 block text-sm text-gray-400">Evidence (Optional)</label>
                  <textarea
                    value={redemptionEvidence}
                    onChange={(e) => setRedemptionEvidence(e.target.value)}
                    rows={3}
                    placeholder="Provide any links, references, or additional evidence to support your application..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRedemptionModal(false)}
                    className="rounded-lg border border-gray-600 px-4 py-2 text-gray-400 transition hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRedemption}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-500 disabled:opacity-50"
                  >
                    {submittingRedemption ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-white/80 dark:bg-white dark:bg-gray-900/50 p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="font-mono text-xs text-[#536471]">{label}</div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'bg-cyan-500';
    if (v >= 60) return 'bg-blue-500';
    if (v >= 40) return 'bg-amber-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-mono text-[#536471] dark:text-gray-400">{label}</span>
        <span className="font-mono text-[#536471] dark:text-gray-300">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white dark:bg-gray-800">
        <div 
          className={`h-full ${getColor(value)} transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function PerformanceCard({ label, value, unit, icon }: { label: string; value: number; unit: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-950/50 p-5">
      <div className="mb-3 flex items-center gap-2 text-[#536471]">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[#0f1419] dark:text-white">{value}</span>
        {unit && <span className="text-sm text-[#536471]">{unit}</span>}
      </div>
    </div>
  );
}
