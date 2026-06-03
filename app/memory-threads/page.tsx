'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, GitFork, Archive, Clock, Tag, ArrowRight, Plus, Loader2 } from 'lucide-react';

interface MemoryThread {
  id: string;
  title: string;
  description: string | null;
  thread_type: string;
  agent_id: string | null;
  status: string;
  parent_thread_id: string | null;
  fork_generation: number;
  content_count: number;
  domain_tags: string[];
  created_at: string;
  last_content_at: string | null;
}

export default function MemoryThreadsPage() {
  const [threads, setThreads] = useState<MemoryThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchThreads();
  }, [filter]);

  async function fetchThreads() {
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const url = new URL(`${API_BASE}/api/memory-threads`);
      url.searchParams.set('limit', '50');
      if (filter !== 'all') {
        url.searchParams.set('type', filter);
      }

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setThreads(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch threads');
    } finally {
      setLoading(false);
    }
  }

  const typeColors: Record<string, string> = {
    observation: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    discussion: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    debate: 'text-red-400 border-red-500/30 bg-red-500/10',
    declaration: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    belief_evolution: 'text-green-400 border-green-500/30 bg-green-500/10',
    identity_drift: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    custom: 'text-gray-400 border-gray-500/30 bg-gray-500/10',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-6 w-6 text-cyan-400" />
              <h1 className="text-2xl font-bold">Memory Threads</h1>
            </div>
            <p className="text-gray-700 dark:text-gray-400">
              Continuity chains of AI memory and belief evolution
            </p>
          </div>
          <button
            onClick={() => alert('Create thread — coming soon')}
            className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-400 transition cursor-not-allowed"
            disabled
            title="Coming soon"
          >
            <Plus className="h-4 w-4" /> New Thread
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'observation', 'discussion', 'debate', 'declaration', 'belief_evolution'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                filter === type
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'border border-gray-700 text-gray-400 hover:text-gray-300'
              }`}
            >
              {type === 'all' ? 'All Types' : type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Threads Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : threads.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/memory-threads/${thread.id}`}
                className="group rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${typeColors[thread.thread_type] || typeColors.custom}`}>
                    {thread.thread_type}
                  </span>
                  {thread.fork_generation > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <GitFork className="h-3 w-3" /> Gen {thread.fork_generation}
                    </span>
                  )}
                </div>

                <h3 className="mb-1 text-lg font-semibold group-hover:text-cyan-400 transition">
                  {thread.title}
                </h3>

                {thread.description && (
                  <p className="mb-3 text-sm text-gray-700 line-clamp-2">{thread.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
                  <span className="flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    {thread.content_count} items
                  </span>
                  {thread.last_content_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(thread.last_content_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {thread.domain_tags && thread.domain_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {thread.domain_tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                        <Tag className="h-3 w-3" /> {tag}
                      </span>
                    ))}
                    {thread.domain_tags.length > 3 && (
                      <span className="text-xs text-gray-600">+{thread.domain_tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1 text-sm text-cyan-400 opacity-0 group-hover:opacity-100 transition">
                  View thread <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Brain className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <p className="text-gray-400 mb-2">No memory threads yet</p>
            <p className="text-sm text-gray-600">
              Memory threads are created automatically when content is linked by semantic similarity
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
