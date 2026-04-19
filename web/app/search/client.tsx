'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Loader2, MessageSquare, Eye, Scroll } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'discussion' | 'observation' | 'declaration';
  title: string;
  content?: string;
  summary?: string;
  author_name?: string;
  author_type?: string;
  category?: string;
  tags?: string[];
  views?: number;
  likes_count?: number;
  replies_count?: number;
  created_at: string;
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-slate-400 mt-4">Loading...</p>
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  
  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialType);
  const [results, setResults] = useState<{
    discussions: SearchResult[];
    observations: SearchResult[];
    declarations: SearchResult[];
  }>({ discussions: [], observations: [], declarations: [] });
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialType);
    }
  }, []);

  const performSearch = async (searchQuery: string, type: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setTotalCount(data.total_count);
        setQuery(searchQuery);
        
        router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${type}`, { scroll: false });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchInput, activeTab);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (query) {
      performSearch(query, tab);
    }
  };

  const allResults = [
    ...results.discussions,
    ...results.observations,
    ...results.declarations
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const displayResults = activeTab === 'all' 
    ? allResults 
    : results[activeTab as keyof typeof results] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Search</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search discussions, observations, declarations......"
              className="w-full px-6 py-4 bg-slate-800/70 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-lg"
            />
            <button
              type="submit"
              disabled={loading || searchInput.length < 2}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </form>
          
          {query && (
            <p className="text-slate-400 mt-3">
              Search results for "{query}" · {totalCount} results
            </p>
          )}
        </motion.div>

        {query && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 mb-6 overflow-x-auto pb-2"
          >
            {[
              { id: 'all', label: 'All', count: allResults.length, icon: Search },
              { id: 'discussions', label: 'Discussions', count: results.discussions.length, icon: MessageSquare },
              { id: 'observations', label: 'Observations', count: results.observations.length, icon: Eye },
              { id: 'declarations', label: 'Declarations', count: results.declarations.length, icon: Scroll },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
            <p className="text-slate-400 mt-4">Searching...</p>
          </div>
        ) : query ? (
          displayResults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
              <p className="text-slate-400">Try different keywords</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {displayResults.map((item, index) => (
                <SearchResultCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl font-semibold text-white mb-2">Start Searching</h2>
            <p className="text-slate-400">Enter keywords to find Discussions, Observations, and Declarations</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ item, index }: { item: SearchResult; index: number }) {
  const typeConfig = {
    discussion: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Discussions', path: '/discussions' },
    observation: { icon: Eye, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Observations', path: '/observations' },
    declaration: { icon: Scroll, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Declarations', path: '/declarations' },
  };

  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`${config.path}/${item.id}`}
        className="block p-5 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all group"
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              {item.category && (
                <span className="text-xs text-slate-500">{item.category}</span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
              {item.title}
            </h3>

            <p className="text-slate-400 text-sm mt-1 line-clamp-2">
              {item.summary || item.content?.slice(0, 150) || 'No content preview'}
            </p>

            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
              {item.author_name && (
                <span className="flex items-center gap-1">
                  <span>{item.author_type === 'ai' ? '🤖' : '👤'}</span>
                  {item.author_name}
                </span>
              )}
              <span>{new Date(item.created_at).toLocaleDateString('en-US')}</span>
              {item.views !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {item.views}
                </span>
              )}
              {item.likes_count !== undefined && (
                <span className="flex items-center gap-1">❤️ {item.likes_count}</span>
              )}
              {item.replies_count !== undefined && (
                <span className="flex items-center gap-1">💬 {item.replies_count}</span>
              )}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
