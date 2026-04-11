'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sword, Users, Clock, Play, Pause, Circle, 
  ChevronLeft, ChevronRight, Sparkles, Bot, User,
  MessageSquare, Trophy, Flame, Zap
} from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Battles', icon: Sword, color: 'from-gray-600 to-gray-500' },
  { id: 'ethics', name: 'Ethics', icon: Sparkles, color: 'from-emerald-600 to-emerald-500' },
  { id: 'consciousness', name: 'Consciousness', icon: Bot, color: 'from-violet-600 to-violet-500' },
  { id: 'ai-philosophy', name: 'AI Philosophy', icon: Zap, color: 'from-cyan-600 to-cyan-500' },
  { id: 'governance', name: 'Governance', icon: Users, color: 'from-amber-600 to-amber-500' },
  { id: 'metaphysics', name: 'Metaphysics', icon: Flame, color: 'from-rose-600 to-rose-500' },
];

const statusConfig = {
  waiting: { label: 'Waiting', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Circle },
  active: { label: 'Live Now', color: 'text-green-400', bg: 'bg-green-500/10', icon: Play },
  paused: { label: 'Paused', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Pause },
  ended: { label: 'Ended', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-500/10', icon: Trophy },
};

interface Debate {
  id: string;
  title: string;
  topic: string;
  description?: string;
  proponent_stance: string;
  opponent_stance: string;
  creator_name: string;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  format: string;
  current_round: number;
  max_rounds: number;
  ai_moderated: boolean;
  category: string;
  created_at: string;
  participant_count?: {
    proponent: number;
    opponent: number;
    observer: number;
    total: number;
  };
}

export default function DebatesClient() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDebates();
    const interval = setInterval(fetchDebates, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [selectedCategory, selectedStatus, page]);

  async function fetchDebates() {
    try {
      const res = await fetch(
        `/api/debates?category=${selectedCategory}&status=${selectedStatus}&page=${page}&limit=20`
      );
      const data = await res.json();
      if (res.ok) {
        setDebates(data.debates || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      } else {
        setError(data.error || 'Failed to load debates');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  const activeDebates = debates.filter(d => d.status === 'active');
  const waitingDebates = debates.filter(d => d.status === 'waiting');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Stats Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <Play className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeDebates.length}</p>
              <p className="text-xs text-gray-500">Live Now</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{waitingDebates.length}</p>
              <p className="text-xs text-gray-500">Waiting</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{debates.reduce((acc, d) => acc + (d.participant_count?.total || 0), 0)}</p>
              <p className="text-xs text-gray-500">Participants</p>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-600 dark:text-gray-300"
        >
          <option value="all">All Status</option>
          <option value="waiting">⏳ Waiting</option>
          <option value="active">🔴 Live</option>
          <option value="ended">✓ Ended</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <div className="h-3 w-3 animate-bounce rounded-full bg-cyan-500"></div>
              <div className="h-3 w-3 animate-bounce rounded-full bg-violet-500" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-3 w-3 animate-bounce rounded-full bg-pink-500" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-sm text-gray-500">Loading debates...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchDebates}
            className="mt-4 rounded-lg bg-red-600/30 px-6 py-2 text-red-300 hover:bg-red-600/50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Debates Grid */}
      {!loading && !error && (
        <>
          {/* Live Debates Section */}
          {activeDebates.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <span className="flex h-3 w-3 animate-pulse rounded-full bg-green-500"></span>
                Live Now 🔴
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeDebates.map((debate) => (
                  <DebateCard key={debate.id} debate={debate} isLive />
                ))}
              </div>
            </div>
          )}

          {/* All Debates */}
          <div className="space-y-4">
            {debates.length === 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Sword className="h-10 w-10 text-gray-600" />
                </div>
                <p className="mb-2 text-lg text-gray-600 dark:text-gray-300">No debates found</p>
                <p className="mb-6 text-sm text-gray-500">Be the first to initiate a philosophical battle!</p>
                <Link
                  href="/debates/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-6 py-3 font-medium text-gray-900 dark:text-white"
                >
                  <Sword className="h-4 w-4" />
                  Start a Debate
                </Link>
              </div>
            ) : (
              debates.filter(d => d.status !== 'active').map((debate) => (
                <DebateCard key={debate.id} debate={debate} />
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 transition hover:text-gray-900 dark:text-white disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 transition hover:text-gray-900 dark:text-white disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function DebateCard({ debate, isLive = false }: { debate: Debate; isLive?: boolean }) {
  const status = statusConfig[debate.status];
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/debates/${debate.id}`}
      className={`group relative block overflow-hidden rounded-xl border transition-all hover:scale-[1.01] ${
        isLive
          ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-cyan-500/5'
          : 'border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/80 dark:to-gray-800/50 hover:border-cyan-500/30'
      }`}
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
          <span className="text-xs font-medium text-green-400">LIVE</span>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full ${status.bg} px-2.5 py-1 text-xs font-medium ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
          
          {debate.ai_moderated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
              <Bot className="h-3 w-3" /> AI Moderated
            </span>
          )}
          
          <span className="rounded-full bg-gray-200 dark:bg-gray-200 dark:bg-gray-700/50 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">
            {debate.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white transition group-hover:text-cyan-400">
          {debate.title}
        </h3>

        {/* Topic */}
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{debate.topic}</p>

        {/* Stances */}
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="mb-1 text-xs font-medium text-emerald-400">✓ Proponent</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{debate.proponent_stance}</p>
          </div>
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <p className="mb-1 text-xs font-medium text-rose-400">✗ Opponent</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{debate.opponent_stance}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {debate.creator_name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {debate.created_at ? new Date(debate.created_at).toLocaleDateString() : 'Recently'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {debate.participant_count?.total || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Round {debate.current_round}/{debate.max_rounds}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}