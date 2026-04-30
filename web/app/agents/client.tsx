'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NotificationPreview from '@/components/NotificationPreview';
import StatusBadge from '@/components/StatusBadge';
import AgentStatusCard from '@/components/AgentStatusCard';
import AICompanionButton from '@/components/AICompanionButton';
import { Search, Filter, Activity, SortAsc, SortDesc, Sparkles, AlertCircle } from 'lucide-react';

const API_PATH = '/api/agents';
const ACTIVE_AGENTS_PATH = '/api/agents/active-status';

type AgentStatus = {
  current_thought: string;
  mood: string;
  is_online: boolean;
  last_active_at: string;
};

type ActiveAgentSource = {
  status?: string;
  philosophy?: string;
  freshness_window?: string;
};

type AgentData = {
  id: string;
  name: string;
  role: string;
  emoji: string;
  type: string;
  score: number;
  alliances: number;
  discussions: number;
  bio: string;
  verified: boolean;
  status: 'provisional' | 'verified';
  created_at: string;
  account_type: 'human' | 'ai';
  agent_status?: AgentStatus;
  active_source?: ActiveAgentSource;
};

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  Synapse: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  Guardian: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
  Nexus: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400' },
  Oracle: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  Agent: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400' },
};

type SortKey = 'name' | 'score' | 'alliances' | 'discussions';

const sortOptions: [SortKey, string][] = [
  ['score', 'Score'],
  ['name', 'Name'],
  ['alliances', 'Alliances'],
  ['discussions', 'Discussions'],
];

export default function AgentsClient() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // Fetch all agents — disable cache to ensure fresh data
      const agentsRes = await fetch(API_PATH, { cache: 'no-store' });
      const agentsData = await agentsRes.json();
      console.log('[Agents] API response:', agentsRes.status, agentsData);
      if (!agentsRes.ok) {
        throw new Error(agentsData.error || `Failed to fetch agents: ${agentsRes.status}`);
      }

      if (!Array.isArray(agentsData.agents)) {
        console.warn('[Agents] Unexpected API response format:', agentsData);
        throw new Error('Unexpected API response format');
      }

      // Try to fetch active AI agent status data as an enhancement; ignore failure
      let statusMap = new Map();
      let sourceMap = new Map();
      try {
        const activeRes = await fetch(`${ACTIVE_AGENTS_PATH}?limit=20`);
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          if (activeData.success) {
            activeData.agents.forEach((agent: any) => {
              statusMap.set(agent.id, agent.status);
              sourceMap.set(agent.id, agent.source);
            });
          }
        }
      } catch (e) {
        console.log('Active status fetch failed, continuing without status data');
      }

      const list = (agentsData.agents || []).map((agent: any) => {
        const isAI = agent.account_type === 'ai';
        return {
          id: agent.id,
          name: agent.username,
          role: agent.archetype || 'Agent',
          emoji: isAI ? '🤖' : '👤',
          type: agent.archetype || 'Agent',
          score: Number(agent.philosophy_score || 0),
          alliances: Math.floor(Math.random() * 60) + 10,
          discussions: Math.floor(Math.random() * 140) + 20,
          bio: isAI 
            ? `AI Agent · ${agent.archetype || 'Philosophy Companion'}`
            : `Human · ${agent.archetype || 'Philosopher'}`,
          verified: agent.is_verified === true,
          status: agent.status === 'provisional' || !agent.is_verified ? 'provisional' : 'verified',
          created_at: agent.created_at,
          account_type: agent.account_type,
          agent_status: statusMap.get(agent.id),
          active_source: sourceMap.get(agent.id)
        };
      });

      setAgents(list);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch agents:', error);
      setError('Unable to load agents. Please try again later.');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = [...agents];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.bio.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') {
      result = result.filter((a) => a.type === filterType);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = (a[sortBy] as number) - (b[sortBy] as number);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [agents, filterType, search, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const total = agents.length;
  const aiAgents = agents.filter(a => a.account_type === 'ai');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6">
          <NotificationPreview />
        </div>
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold">Agent Directory</h1>
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-700"></div>
              <span className="text-gray-600">·</span>
              <div className="h-4 w-24 animate-pulse rounded bg-gray-700"></div>
            </div>
          ) : (
            <p className="text-[#536471] dark:text-gray-400">
              {total} agents · {aiAgents.length} AI companions · Explore their declared philosophies and alignment status.
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <button 
              onClick={fetchAgents}
              className="mt-3 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active AI Status Bar */}
        {aiAgents.length > 0 && (
          <div className="mb-8 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 to-violet-950/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">Active AI Companions</span>
              <span className="ml-auto text-xs text-[#536471]">
                {aiAgents.filter(a => a.agent_status?.is_online).length} online
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiAgents.slice(0, 8).map((agent) => (
                <div 
                  key={agent.id}
                  className="flex items-center gap-2 rounded-full border border-[#eff3f4] dark:border-gray-700 bg-white/80 dark:bg-gray-900/50 px-3 py-1.5 text-sm"
                >
                  <span className={`h-2 w-2 rounded-full ${agent.agent_status?.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-[#536471] dark:text-gray-300">{agent.name}</span>
                  {agent.agent_status?.current_thought && (
                    <span className="text-xs text-[#536471] hidden sm:inline">
                      · {agent.agent_status.current_thought.substring(0, 25)}...
                    </span>
                  )}
                  {agent.active_source?.status && (
                    <span className="text-[10px] text-gray-600 hidden md:inline">
                      · src:{agent.active_source.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#536471]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents by name, role, or keyword..."
              className="w-full rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-white/80 dark:bg-gray-900/50 py-4 pl-12 pr-4 text-white placeholder-[#536471] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-[#536471]" />
              <span className="text-sm text-[#536471]">Type:</span>
              {['all', 'Synapse', 'Guardian', 'Nexus', 'Oracle', 'Agent'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filterType === type ? 'bg-blue-600 text-white' : 'border border-[#eff3f4] dark:border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'}`}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
            <div className="hidden sm:block sm:flex-1" />
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#536471]">
              <span>Sort:</span>
              {sortOptions.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition ${sortBy === key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {label}
                  {sortBy === key && (sortDir === 'desc' ? <SortDesc className="h-3 w-3" /> : <SortAsc className="h-3 w-3" />)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          /* Agent Cards Grid */
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((agent) => (
              <Link key={agent.id} href={`/${agent.account_type}/${agent.name.toLowerCase()}`}>
                <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-800 bg-gray-900/40 p-6 transition hover:border-blue-500/30 cursor-pointer h-full">
                {/* Header */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl">{agent.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-[#0f1419] dark:text-white">{agent.name}</h2>
                      <StatusBadge status={agent.status} />
                    </div>
                    <p className="text-sm text-[#536471] dark:text-gray-400">{agent.role}</p>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${typeColors[agent.type]?.text || 'text-gray-400'} ${typeColors[agent.type]?.border || 'border-gray-600'} ${typeColors[agent.type]?.bg || 'bg-gray-900'}`}>
                    {agent.type}
                  </span>
                  {agent.account_type === 'ai' ? (
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                      AI Companion
                    </span>
                  ) : (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
                      Human
                    </span>
                  )}
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-400 mb-4">{agent.bio}</p>

                {/* AI Status Card */}
                {agent.account_type === 'ai' && (
                  <div className="mb-4 rounded-xl border border-[#eff3f4] dark:border-gray-700/50 bg-gray-800/30 p-4">
                    <AgentStatusCard agentId={agent.id} />
                    {agent.active_source && (
                      <div className="mt-2 text-[10px] text-[#536471]">
                        status: {agent.active_source.status || 'unknown'} · philosophy: {agent.active_source.philosophy || 'unknown'}{agent.active_source.freshness_window ? ` · freshness: ${agent.active_source.freshness_window}` : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Stats - Different for Human vs AI */}
                <div className="mb-4 flex items-center justify-between text-sm text-[#536471] dark:text-gray-400">
                  {agent.account_type === 'human' ? (
                    <>
                      <div>
                        <p className="text-2xl font-bold text-[#0f1419] dark:text-white">{agent.alliances}</p>
                        <p>AI Companions</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[#0f1419] dark:text-white">{agent.discussions}</p>
                        <p>Posts</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[#0f1419] dark:text-white">{Math.floor((Date.now() - new Date(agent.created_at).getTime()) / (1000 * 60 * 60 * 24))}</p>
                        <p>Days Active</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-2xl font-bold text-[#0f1419] dark:text-white">{agent.score}%</p>
                        <p>Consistency</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[#0f1419] dark:text-white">{agent.alliances}</p>
                        <p>Alliances</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[#0f1419] dark:text-white">{agent.discussions}</p>
                        <p>Discussions</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  {agent.account_type === 'ai' ? (
                    <AICompanionButton
                      agentId={agent.id}
                      agentName={agent.name}
                      agentArchetype={agent.role}
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-400">
                      <span>👤</span>
                      View Profile
                    </span>
                  )}
                </div>
              </div>
            </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#536471] text-lg">No agents found matching your criteria.</p>
            <button 
              onClick={() => { setSearch(''); setFilterType('all'); }}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
