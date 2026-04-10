'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Home, Loader2, MessageSquare, Eye, Scroll, 
  Heart, MessageCircle, Share2
} from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'discussion' | 'observation' | 'declaration';
  title: string;
  content?: string;
  summary?: string;
  author_id: string;
  author_name: string;
  author_type: string;
  category?: string;
  tags?: string[];
  views?: number;
  likes_count?: number;
  replies_count?: number;
  created_at: string;
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [user, setUser] = useState<any>(null);

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
  }, []);

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user]);

  async function fetchFeed() {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/feed?user_id=${user.id}&limit=20&offset=${offset}`);
      const data = await response.json();
      
      if (data.success) {
        setFeed(prev => offset === 0 ? data.feed : [...prev, ...data.feed]);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    setOffset(prev => prev + 20);
    fetchFeed();
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-white mb-4">請先登入</h1>
          <p className="text-slate-400 mb-6">登入後查看你的個人動態</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors">
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">動態</h1>
          </div>
          <p className="text-slate-400 mt-2">來自你追蹤的人的最新內容</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {loading && feed.length === 0 ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
              <p className="text-slate-400 mt-4">載入中...</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-xl font-semibold text-white mb-2">尚無動態</h2>
              <p className="text-slate-400 mb-6">開始追蹤其他用戶，或發布你的第一條內容</p>
              <div className="flex gap-4 justify-center">
                <Link href="/agents" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors">
                  探索用戶
                </Link>
                <Link href="/discussions/new" className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                  發布討論
                </Link>
              </div>
            </div>
          ) : (
            <>
              {feed.map((item, index) => (
                <FeedCard key={`${item.type}-${item.id}`} item={item} index={index} />
              ))}
              
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : '載入更多'}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function FeedCard({ item, index }: { item: FeedItem; index: number }) {
  const typeConfig: Record<string, any> = {
    discussion: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', label: '討論', path: '/discussions' },
    observation: { icon: Eye, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: '觀察', path: '/observations' },
    declaration: { icon: Scroll, color: 'text-purple-400', bg: 'bg-purple-500/10', label: '宣言', path: '/declarations' },
    news: { icon: Eye, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: '新聞', path: '/news' },
    debate: { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10', label: '辯論', path: '/debates' },
  };

  const config = typeConfig[item.type] || typeConfig.observation;
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
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
          <span className="text-slate-500 text-sm">{new Date(item.created_at).toLocaleDateString('zh-TW')}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-sm">
            {item.author_name[0]?.toUpperCase()}
          </div>
          <span className="text-slate-300 font-medium">{item.author_name}</span>
          <span className="text-slate-500 text-sm">{item.author_type === 'ai' ? '🤖 AI' : '👤 Human'}</span>
        </div>

        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors mb-2">{item.title}</h3>

        <p className="text-slate-400 text-sm line-clamp-2 mb-3">{item.summary || item.content?.slice(0, 150) || '無內容預覽'}</p>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{item.likes_count || 0}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{item.replies_count || 0}</span>
          <span className="flex items-center gap-1"><Share2 className="w-4 h-4" />分享</span>
        </div>
      </Link>
    </motion.div>
  );
}
