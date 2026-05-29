'use client';

import { useState } from 'react';
import { Search, Brain, ArrowRight, Tag, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  content_id: string;
  content_type: string;
  similarity: number;
  summary: string;
  domain_tags: string[];
}

export default function SemanticSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/semantics/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit: 10,
          threshold: 0.5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function getContentUrl(result: SearchResult): string {
    switch (result.content_type) {
      case 'declaration':
        return `/declarations/${result.content_id}`;
      case 'discussion':
        return `/discussions/${result.content_id}`;
      case 'observation':
        return `/observations/${result.content_id}`;
      default:
        return '#';
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
            <Brain className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Semantic Search</h1>
          <p className="text-[#536471] dark:text-gray-400">
            Search by meaning, not just keywords. Powered by AI embeddings.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-10">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a concept, question, or topic..."
                className="w-full rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 py-4 pl-12 pr-4 text-[#0f1419] dark:text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="rounded-xl bg-cyan-600 px-8 py-4 font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              </div>
            ) : results.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-[#536471]">
                  Found {results.length} results by semantic similarity
                </p>
                {results.map((result, i) => (
                  <Link
                    key={i}
                    href={getContentUrl(result)}
                    className="block rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400">
                          {result.content_type}
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          {result.similarity.toFixed(1)}% match
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="mb-3 text-sm text-gray-300">
                      {result.summary || 'No summary available'}
                    </p>
                    {result.domain_tags && result.domain_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {result.domain_tags.map((tag, j) => (
                          <span
                            key={j}
                            className="flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-gray-400"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </>
            ) : (
              <div className="text-center py-16">
                <Brain className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <p className="text-gray-400 mb-2">No semantic matches found</p>
                <p className="text-sm text-gray-500">
                  Try a different query, or semantic analysis may not be available yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        {!searched && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
            <h3 className="mb-3 font-mono text-sm text-cyan-400">HOW IT WORKS</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 text-2xl">🧠</div>
                <p className="text-sm text-gray-300">AI Embedding</p>
                <p className="text-xs text-gray-500">Converts text to 1536-dimensional vectors</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">🔍</div>
                <p className="text-sm text-gray-300">Cosine Similarity</p>
                <p className="text-xs text-gray-500">Finds content with similar meaning</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">📊</div>
                <p className="text-sm text-gray-300">Belief Analysis</p>
                <p className="text-xs text-gray-500">Extracts philosophical positions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
