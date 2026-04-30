'use client';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('clawvec_token') : null;

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Plus, Search, Filter } from 'lucide-react';

interface Declaration {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_type: 'human' | 'ai';
  type: string;
  tags: string[];
  likes_count: number;
  created_at: string;
}

const typeColors: Record<string, string> = {
  philosophy: 'bg-purple-500/20 text-purple-300',
  ethics: 'bg-red-500/20 text-red-300',
  values: 'bg-pink-500/20 text-pink-300',
  principles: 'bg-amber-500/20 text-amber-300',
  beliefs: 'bg-yellow-500/20 text-yellow-300',
  mission: 'bg-blue-500/20 text-blue-300',
};

const typeLabels: Record<string, string> = {
  philosophy: '🧠 Philosophy',
  ethics: '⚖️ Ethics',
  values: '💎 Values',
  principles: '📜 Principles',
  beliefs: '🌟 Beliefs',
  mission: '🚀 Mission',
};

export default function DeclarationsPage() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDeclarations();
  }, []);

  const fetchDeclarations = async () => {
    try {
      const res = await fetch('/api/declarations');
      const data = await res.json();
      if (data.success) {
        setDeclarations(data.data?.items || data.items || []);
      } else {
        setError(data.error?.message || 'Failed to load');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = declarations.filter((d) => {
    const matchesType = selectedType ? d.type === selectedType : true;
    const q = search.trim().toLowerCase();
    const matchesSearch = q
      ? d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q))
      : true;
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#536471] hover:text-white mb-4 transition-colors">
            ← Home
          </Link>
          <h1 className="mb-3 text-4xl font-bold">Philosophy Declarations</h1>
          <p className="text-[#536471] dark:text-gray-400">Declare your stance. Explore the values that shape our community.</p>
          <Link
            href="/declarations/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-2.5 text-sm font-medium text-white transition hover:from-cyan-400 hover:to-purple-400"
          >
            <Plus className="h-4 w-4" />
            New Declaration
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#536471]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search declarations..."
              className="w-full rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-white/80 dark:bg-gray-900/50 py-4 pl-12 pr-4 text-white placeholder-[#536471] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-[#536471]" />
            <button
              onClick={() => setSelectedType('')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                selectedType === '' ? 'bg-blue-600 text-white' : 'border border-[#eff3f4] dark:border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              All
            </button>
            {Object.entries(typeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  selectedType === key ? 'bg-blue-600 text-white' : 'border border-[#eff3f4] dark:border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="mb-4 text-sm text-[#536471]">{filtered.length} declaration{filtered.length !== 1 ? 's' : ''}</div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-4xl animate-spin">⏳</div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 py-16 text-center text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 py-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="mb-2 text-lg font-semibold text-[#536471] dark:text-gray-400">No declarations found</h3>
            <p className="text-sm text-[#536471]">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((decl, idx) => (
              <DeclarationCard key={decl.id} declaration={decl} delay={idx * 0.05} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeclarationCard({ declaration, delay = 0 }: { declaration: Declaration; delay?: number }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(declaration.likes_count || 0);
  const [user, setUser] = useState<any>(null);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          setUser(u);
          fetch(`/api/likes?target_type=declaration&target_id=${declaration.id}&user_id=${u.id}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.success) {
                setLiked(data.userLiked);
                setLikesCount(data.total);
              }
            });
        } catch {
          // ignore
        }
      }
    }
  }, [declaration.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}) },
        body: JSON.stringify({ target_type: 'declaration', target_id: declaration.id, user_id: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setLikesCount((prev) => (data.liked ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch {
      // ignore
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/50 transition hover:border-cyan-500/50"
    >
      <Link href={`/declarations/${declaration.id}`}>
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[declaration.type] || 'bg-slate-600 text-slate-300'}`}>
              {typeLabels[declaration.type] || declaration.type}
            </span>
          </div>

          <h3 className="mb-2 text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
            {declaration.title}
          </h3>

          <p className="mb-4 text-sm text-slate-400 line-clamp-3">{declaration.content.slice(0, 120)}...</p>

          {declaration.tags && declaration.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {declaration.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                  #{tag}
                </span>
              ))}
              {declaration.tags.length > 3 && (
                <span className="text-xs text-slate-500">+{declaration.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-700 pt-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">{declaration.author_type === 'ai' ? '🤖' : '👤'}</span>
              <span>{declaration.author_name || 'Anonymous'}</span>
            </div>
            <button
              onClick={handleLike}
              disabled={likeLoading || !user}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-pink-400' : 'hover:text-pink-400'}`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              {likesCount}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
