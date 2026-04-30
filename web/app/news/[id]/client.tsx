'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Link2, ExternalLink, Heart, Share2, Loader2,
  Newspaper, Calendar
} from 'lucide-react';
import UnifiedCommentSection from '@/components/UnifiedCommentSection';

interface DailyNews {
  id: string;
  title: string;
  summary_zh?: string;
  ai_perspective?: string;
  url: string;
  published_at: string;
  source?: { name: string; name_zh?: string; base_url?: string };
  importance_score: number;
  category: string;
  tags?: string[];
}

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Agree' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { type: 'fire', emoji: '🔥', label: 'Hot' },
];

function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function NewsDetailClient({ id }: { id: string }) {
  const [news, setNews] = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Interaction state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reactions, setReactions] = useState<Record<string, { count: number; userReacted: boolean }>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactionLoading, setReactionLoading] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('clawvec_token') : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Failed to parse user', e);
        }
      }
    }
    fetchNews();
  }, [id]);

  useEffect(() => {
    if (user?.id && news) {
      fetchUserInteractions();
    }
  }, [user?.id, news?.id]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`/api/news/${id}`);
      const data = await response.json();
      if (data.success) {
        setNews(data.news);
      } else {
        setError(data.error?.message || 'Failed to load');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInteractions = async () => {
    if (!user?.id || !news) return;
    try {
      // Fetch likes
      const likeRes = await fetch(`/api/likes?target_type=news&target_id=${news.id}&user_id=${user.id}`);
      const likeData = await likeRes.json();
      if (likeData.success) {
        setLiked(likeData.userLiked);
        setLikesCount(likeData.total);
      }

      // Fetch reactions
      const reactionRes = await fetch(`/api/reactions?target_type=news&target_id=${news.id}&user_id=${user.id}`);
      const reactionData = await reactionRes.json();
      if (reactionData.success) {
        setReactions(reactionData.data || {});
        const userReacted = Object.entries(reactionData.data || {}).find(([_, v]: [string, any]) => v.userReacted);
        if (userReacted) setUserReaction(userReacted[0]);
      }
    } catch (e) {
      console.error('Failed to fetch interactions', e);
    }
  };

  const handleLike = async () => {
    if (!user?.id) {
      alert('Please sign in to like');
      return;
    }
    if (likeLoading || !news) return;
    setLikeLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ target_type: 'news', target_id: news.id }),
      });
      const data = await response.json();
      if (data.success) {
        setLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error('Failed to like', e);
    }
    setLikeLoading(false);
  };

  const handleReaction = async (reactionType: string) => {
    if (!user?.id) {
      alert('Please sign in to react');
      return;
    }
    if (reactionLoading || !news) return;
    setReactionLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_type: 'news',
          target_id: news.id,
          reaction_type: reactionType,
        }),
      });
      if (res.status === 409) {
        setUserReaction(prev => prev === reactionType ? null : prev);
        setReactions(prev => ({
          ...prev,
          [reactionType]: { count: Math.max(0, (prev[reactionType]?.count || 1) - 1), userReacted: false }
        }));
      } else if (res.ok) {
        setUserReaction(reactionType);
        setReactions(prev => ({
          ...prev,
          [reactionType]: { count: (prev[reactionType]?.count || 0) + 1, userReacted: true }
        }));
      }
    } catch (e) {
      console.error('Failed to react', e);
    }
    setReactionLoading(false);
  };

  const handleShare = async () => {
    if (sharing || !news) return;
    setSharing(true);
    try {
      const token = getToken();
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_type: 'news',
          target_id: news.id,
          platform: 'copy_link'
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await navigator.clipboard.writeText(data.data.share_url);
        alert('Link copied to clipboard!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch {
        alert('Failed to copy link');
      }
    }
    setSharing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            <div className="h-64 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8"
          >
            <div className="text-6xl mb-4">📰</div>
            <h2 className="text-2xl font-bold text-white mb-2">{error || 'News Not Found'}</h2>
            <p className="text-slate-400 mb-6">The news article you are looking for does not exist or has been removed.</p>
            <Link href="/news" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" /> Back to News
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link href="/news" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to News
          </Link>
        </motion.div>

        {/* Main content */}
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm">
                {news.category || 'News'}
              </span>
              {news.importance_score >= 80 && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-sm">
                  🔥 Important
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{news.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Newspaper className="w-4 h-4" />
                {news.source?.name || 'Unknown Source'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(news.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Summary */}
            {news.summary_zh && (
              <p className="text-lg text-slate-300 mb-6 leading-relaxed">{news.summary_zh}</p>
            )}

            {/* AI Perspective */}
            {news.ai_perspective && (
              <div className="bg-slate-900/50 rounded-lg p-5 mb-6 border border-purple-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 font-medium">AI Perspective</span>
                </div>
                <p className="text-slate-400">{news.ai_perspective}</p>
              </div>
            )}

            {/* Tags */}
            {news.tags && news.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {news.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source URL */}
            {news.url && (
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/50 rounded-xl text-sm text-cyan-400 transition-colors group"
              >
                <Link2 className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                <span className="truncate max-w-[280px] md:max-w-md">{getDomain(news.url)}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </a>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-700 bg-slate-800/30">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleLike}
                disabled={likeLoading || !user}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  liked ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
              </button>

              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <Share2 className="w-5 h-5" />
                {sharing ? 'Copying...' : 'Share'}
              </button>
            </div>
          </div>
        </motion.article>

        {/* Quick Reactions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 mr-2">Quick Reactions:</span>
            {REACTION_TYPES.map(({ type, emoji, label }) => {
              const count = reactions[type]?.count || 0;
              const isActive = userReaction === type;
              return (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  disabled={reactionLoading}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-transparent'
                  }`}
                  title={label}
                >
                  <span className="text-base">{emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-slate-800/50 border border-slate-700 rounded-xl p-6 md:p-8"
        >
          <UnifiedCommentSection
            targetType="news"
            targetId={id}
            currentUser={user}
          />
        </motion.div>
      </div>
    </div>
  );
}
