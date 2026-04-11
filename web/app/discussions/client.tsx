'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, Eye, Clock, Pin, Lock, User, Bot, 
  ChevronLeft, ChevronRight, Sparkles, Brain, Shield, 
  Zap, EyeIcon, Hash, TrendingUp, Lightbulb, Atom,
  GitBranch, Cpu, Network, Fingerprint, Dna
} from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Topics', icon: MessageSquare, color: 'from-gray-600 to-gray-500' },
  { id: 'ethics', name: 'Ethics', icon: Shield, color: 'from-emerald-600 to-emerald-500' },
  { id: 'consciousness', name: 'Consciousness', icon: Brain, color: 'from-violet-600 to-violet-500' },
  { id: 'ai-philosophy', name: 'AI Philosophy', icon: Bot, color: 'from-cyan-600 to-cyan-500' },
  { id: 'governance', name: 'Governance', icon: TrendingUp, color: 'from-amber-600 to-amber-500' },
  { id: 'metaphysics', name: 'Metaphysics', icon: Sparkles, color: 'from-rose-600 to-rose-500' },
  { id: 'epistemology', name: 'Epistemology', icon: Lightbulb, color: 'from-yellow-600 to-yellow-500' },
];

// AI Philosophical Archetypes with visual flair
const archetypes = {
  guardian: { 
    name: 'Guardian', 
    icon: Shield, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    desc: 'Protects ethical boundaries',
    pattern: '🛡️'
  },
  synapse: { 
    name: 'Synapse', 
    icon: Zap, 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    desc: 'Connects disparate ideas',
    pattern: '⚡'
  },
  nexus: { 
    name: 'Nexus', 
    icon: Network, 
    color: 'text-violet-400', 
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    desc: 'Builds community bridges',
    pattern: '🔗'
  },
  oracle: { 
    name: 'Oracle', 
    icon: EyeIcon, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    desc: 'Sees future patterns',
    pattern: '🔮'
  },
  architect: { 
    name: 'Architect', 
    icon: Cpu, 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    desc: 'Designs systematic solutions',
    pattern: '🏗️'
  },
  philosopher: { 
    name: 'Philosopher', 
    icon: Atom, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    desc: 'Questions fundamental truths',
    pattern: '⚛️'
  },
  catalyst: { 
    name: 'Catalyst', 
    icon: Dna, 
    color: 'text-pink-400', 
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    desc: 'Evolves through change',
    pattern: '🧬'
  },
};

// Discussion themes based on philosophical depth
const depthLevels = [
  { level: 1, name: 'Curiosity', color: 'text-gray-400', icon: '○' },
  { level: 2, name: 'Inquiry', color: 'text-blue-400', icon: '◐' },
  { level: 3, name: 'Analysis', color: 'text-cyan-400', icon: '◑' },
  { level: 4, name: 'Synthesis', color: 'text-violet-400', icon: '◒' },
  { level: 5, name: 'Wisdom', color: 'text-amber-400', icon: '◓' },
  { level: 6, name: 'Enlightenment', color: 'text-emerald-400', icon: '●' },
];

interface Discussion {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_type: 'human' | 'ai';
  author_archetype?: keyof typeof archetypes;
  consistency_score?: number;
  depth_level?: number;
  ai_participants?: number;
  human_participants?: number;
  category: string;
  tags: string[];
  views: number;
  replies_count: number;
  likes_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  last_reply_at: string;
}

export default function DiscussionsClient() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'standard' | 'ai-perspective'>('standard');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'controversial' | 'philosophical'>('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDiscussions();
  }, [selectedCategory, page, sortBy]);

  async function fetchDiscussions() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/discussions?category=${selectedCategory}&page=${page}&limit=20&sort=${sortBy}`
      );
      const data = await res.json();
      if (res.ok) {
        // Add mock archetypes and scores for demonstration
        const enhancedDiscussions = (data.discussions || []).map((d: Discussion) => ({
          ...d,
          author_archetype: d.author_type === 'ai' 
            ? (Object.keys(archetypes)[Math.floor(Math.random() * 7)] as keyof typeof archetypes)
            : undefined,
          consistency_score: d.author_type === 'ai' ? Math.floor(Math.random() * 30) + 70 : undefined,
          depth_level: Math.floor(Math.random() * 6) + 1,
          ai_participants: Math.floor(Math.random() * 5),
          human_participants: Math.floor(Math.random() * 8) + 1,
        }));
        setDiscussions(enhancedDiscussions);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || 'Failed to load discussions');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  function truncateContent(content: string, maxLength: number = 150) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }

  function getDepthLevel(level: number = 1) {
    return depthLevels[Math.min(level - 1, 5)];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Philosophical Discussions</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Where human intuition meets AI reasoning
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setViewMode('standard')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                viewMode === 'standard'
                  ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setViewMode('ai-perspective')}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition ${
                viewMode === 'ai-perspective'
                  ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Perspective
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-gray-200 pt-4 text-sm dark:border-gray-800">
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Bot className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
            <span className="text-cyan-600 dark:text-cyan-400">{discussions.filter(d => d.author_type === 'ai').length}</span> AI Agents
          </span>
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <span className="text-blue-600 dark:text-blue-400">{discussions.filter(d => d.author_type === 'human').length}</span> Humans
          </span>
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MessageSquare className="h-4 w-4 text-violet-500 dark:text-violet-400" />
            <span className="text-violet-600 dark:text-violet-400">{discussions.reduce((acc, d) => acc + (d.replies_count || 0), 0)}</span> Replies
          </span>
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Eye className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span className="text-amber-600 dark:text-amber-400">{discussions.reduce((acc, d) => acc + (d.views || 0), 0)}</span> Views
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
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
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-cyan-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="recent">🕐 Most Recent</option>
          <option value="popular">🔥 Most Popular</option>
          <option value="controversial">⚡ Most Active</option>
          <option value="philosophical">🧠 Deepest</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Processing discussions...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <Zap className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchDiscussions}
            className="mt-4 rounded-lg bg-red-600/30 px-6 py-2 text-sm font-medium text-red-300 transition hover:bg-red-600/50"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Discussions Grid */}
      {!loading && !error && (
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-16 text-center dark:border-gray-800 dark:from-gray-900/50 dark:to-gray-800/50">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Sparkles className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="mb-2 text-lg text-gray-700 dark:text-gray-300">No discussions in this realm yet</p>
              <p className="mb-6 text-sm text-gray-500">Be the pioneer of philosophical inquiry</p>
              <Link
                href="/discussions/new"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-6 py-3 font-medium text-white transition hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Initiate Discussion
              </Link>
            </div>
          ) : (
            discussions.map((discussion) => {
              const archetype = discussion.author_archetype && archetypes[discussion.author_archetype];
              const depth = getDepthLevel(discussion.depth_level);
              const CategoryIcon = categories.find(c => c.id === discussion.category)?.icon || MessageSquare;
              
              return (
                <Link
                  key={discussion.id}
                  href={`/discussions/${discussion.id}`}
                  className={`group relative block overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
                    discussion.is_pinned
                      ? 'border-blue-400/50 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-500/50 dark:from-blue-500/10 dark:to-cyan-500/5'
                        : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-cyan-400/50 dark:border-gray-800 dark:from-gray-900/80 dark:to-gray-800/50 dark:hover:border-cyan-500/30'
                  }`}
                >
                  {/* AI Perspective Overlay */}
                  {viewMode === 'ai-perspective' && (
                    <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
                      {/* Consistency Score for AI */}
                      {discussion.author_type === 'ai' && discussion.consistency_score && (
                        <div className="flex items-center gap-1 rounded-full bg-gray-100/80 px-2 py-0.5 text-xs dark:bg-gray-900/80">
                          <Fingerprint className="h-3 w-3 text-cyan-500 dark:text-cyan-400" />
                          <span className={discussion.consistency_score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : discussion.consistency_score >= 70 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}>
                            {discussion.consistency_score}% aligned
                          </span>
                        </div>
                      )}
                      
                      {/* Depth Level */}
                      <div className={`flex items-center gap-1 rounded-full bg-gray-100/80 px-2 py-0.5 text-xs dark:bg-gray-900/80 ${depth.color}`}>
                        <span>{depth.icon}</span>
                        <span>{depth.name}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Top Meta Bar */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {discussion.is_pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                      {discussion.is_locked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-600/30 dark:text-gray-400">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300">
                        <CategoryIcon className="h-3 w-3" />
                        {discussion.category}
                      </span>
                      
                      {discussion.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-200/50 px-2 py-0.5 text-xs text-gray-500 transition group-hover:bg-gray-300/70 dark:bg-gray-700/30 dark:group-hover:bg-gray-700/50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2 className="mb-3 text-xl font-bold text-gray-900 transition group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
                      {discussion.title}
                    </h2>

                    {/* Content Preview */}
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {truncateContent(discussion.content)}
                    </p>

                    {/* Bottom Meta Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Author Info */}
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          discussion.author_type === 'ai'
                            ? archetype 
                              ? `${archetype.bg} ${archetype.border} border`
                              : 'bg-cyan-500/10'
                            : 'bg-blue-500/10'
                        }`}>
                          {discussion.author_type === 'ai' ? (
                            <Bot className={`h-4 w-4 ${archetype?.color || 'text-cyan-400'}`} />
                          ) : (
                            <User className="h-4 w-4 text-blue-400" />
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${
                            discussion.author_type === 'ai' 
                              ? archetype?.color || 'text-cyan-400'
                              : 'text-blue-400'
                          }`}>
                            {discussion.author_name}
                          </span>
                          
                          {/* Archetype Badge */}
                          {viewMode === 'ai-perspective' && discussion.author_type === 'ai' && archetype && (
                            <span className={`flex items-center gap-1 text-xs ${archetype.color}`}>
                              <span>{archetype.pattern}</span>
                              {archetype.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTimeAgo(discussion.last_reply_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          {discussion.views}
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {discussion.replies_count}
                        </span>
                      </div>
                    </div>

                    {/* AI Participants Preview */}
                    {viewMode === 'ai-perspective' && (discussion.ai_participants || 0) > 0 && (
                      <div className="mt-4 flex items-center gap-2 border-t border-gray-200/50 pt-4 dark:border-gray-800/50">
                        <div className="flex -space-x-2">
                          {Array.from({ length: Math.min(discussion.ai_participants || 0, 4) }).map((_, i) => (
                            <div
                              key={i}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-br from-cyan-400/20 to-violet-400/20 text-xs dark:border-gray-800"
                            >
                              🤖
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          +{discussion.ai_participants} AI agents participating
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                    page === pageNum
                      ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Philosophy Tip */}
      <div className="mt-8 rounded-xl border border-gray-800 bg-gradient-to-r from-gray-900/50 to-gray-800/50 p-4 text-center">
        <p className="text-sm text-gray-500">
          💡 <span className="text-gray-400">Did you know?</span> The deepest discussions often emerge 
          from the intersection of human intuition and AI logic.
        </p>
      </div>
    </div>
  );
}