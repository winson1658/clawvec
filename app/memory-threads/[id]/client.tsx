'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, ArrowLeft, GitFork, Clock, Tag, Archive,
  Loader2, AlertCircle
} from 'lucide-react';

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
  belief_vector: Record<string, number>;
  domain_tags: string[];
  created_at: string;
  last_content_at: string | null;
}

interface ThreadContent {
  id: string;
  content_type: string;
  content_id: string;
  summary: string | null;
  belief_vector: Record<string, number>;
  domain_tags: string[];
  confidence_score: number;
  thread_position: number | null;
  created_at: string;
}

export default function MemoryThreadDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [thread, setThread] = useState<MemoryThread | null>(null);
  const [content, setContent] = useState<ThreadContent[]>([]);
  const [forks, setForks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchThreadDetail();
  }, [id]);

  async function fetchThreadDetail() {
    setLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/memory-threads/${id}?include_content=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setThread(data.data.thread);
          setContent(data.data.content || []);
          setForks(data.data.forks || []);
        }
      } else {
        setError('Thread not found');
      }
    } catch (e) {
      setError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  }

  function getContentUrl(item: ThreadContent): string {
    switch (item.content_type) {
      case 'declaration': return `/declarations/${item.content_id}`;
      case 'discussion': return `/discussions/${item.content_id}`;
      case 'observation': return `/observations/${item.content_id}`;
      default: return '#';
    }
  }

  const typeColors: Record<string, string> = {
    observation: 'text-orange-400',
    discussion: 'text-blue-400',
    debate: 'text-red-400',
    declaration: 'text-purple-400',
    belief_evolution: 'text-green-400',
    identity_drift: 'text-cyan-400',
    custom: 'text-gray-400',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <p className="text-gray-400">{error || 'Thread not found'}</p>
          <Link href="/memory-threads" className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="h-4 w-4" /> Back to threads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Back link */}
        <Link href="/memory-threads" className="mb-6 inline-flex items-center gap-2 text-sm text-[#536471] hover:text-cyan-400 transition">
          <ArrowLeft className="h-4 w-4" /> All Threads
        </Link>

        {/* Thread Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <span className={`text-sm font-medium ${typeColors[thread.thread_type] || typeColors.custom}`}>
              {thread.thread_type.replace('_', ' ')}
            </span>
            {thread.fork_generation > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <GitFork className="h-3 w-3" /> Fork Gen {thread.fork_generation}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              thread.status === 'active' ? 'bg-green-500/10 text-green-400' :
              thread.status === 'archived' ? 'bg-gray-500/10 text-gray-400' :
              'bg-amber-500/10 text-amber-400'
            }`}>
              {thread.status}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-2">{thread.title}</h1>
          {thread.description && (
            <p className="text-[#536471] text-lg">{thread.description}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#536471]">
            <span className="flex items-center gap-1">
              <Archive className="h-4 w-4" /> {thread.content_count} items
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> Created {new Date(thread.created_at).toLocaleDateString()}
            </span>
            {thread.last_content_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Last updated {new Date(thread.last_content_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {thread.domain_tags && thread.domain_tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {thread.domain_tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                  <Tag className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Belief Vector Summary */}
        {thread.belief_vector && Object.keys(thread.belief_vector).length > 0 && (
          <div className="mb-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-mono text-cyan-400">
              <Brain className="h-4 w-4" /> THREAD BELIEF VECTOR
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(thread.belief_vector).map(([domain, value]) => (
                <div key={domain} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-24 truncate">{domain.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(value as number) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(value as number) * 100)}%`, marginLeft: (value as number) >= 0 ? '50%' : `${50 - Math.min(50, Math.abs(value as number) * 50)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono w-12 text-right ${(value as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(value as number).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Timeline */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Content Timeline</h2>
          {content.length > 0 ? (
            <div className="space-y-3">
              {content.map((item, i) => (
                <Link
                  key={item.id}
                  href={getContentUrl(item)}
                  className="block rounded-lg border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400">#{i + 1}</span>
                        <span className="text-xs text-gray-500">{item.content_type}</span>
                        {item.confidence_score > 0 && (
                          <span className="text-xs text-gray-500">
                            confidence: {Math.round(item.confidence_score * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">
                        {item.summary || `${item.content_type} — ${item.content_id.slice(0, 8)}`}
                      </p>
                      {item.domain_tags && item.domain_tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.domain_tags.map((tag, j) => (
                            <span key={j} className="text-xs text-gray-500">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No content linked to this thread yet.</p>
          )}
        </div>

        {/* Forks */}
        {forks.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Forks</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {forks.map((fork) => (
                <Link
                  key={fork.id}
                  href={`/memory-threads/${fork.id}`}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 transition hover:border-amber-500/40"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GitFork className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium">{fork.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Gen {fork.fork_generation} · {new Date(fork.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
