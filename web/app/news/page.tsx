'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Sparkles, Calendar, TrendingUp, Bot, CheckCircle2, Layers } from 'lucide-react';

interface NewsItem {
  id: string;
  title_zh?: string;
  title: string;
  summary?: string;
  summary_zh?: string;
  ai_perspective?: string;
  content?: string;
  question?: string;
  url: string;
  image_url?: string;
  published_at: string;
  source: { name_zh?: string; name: string };
  importance_score: number;
  category: string;
  is_task_driven?: boolean;
  author_id?: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState<'all' | 'tasks' | 'daily'>('all');

  useEffect(() => {
    fetchNews();
  }, [category, source]);

  async function fetchNews() {
    setLoading(true);
    try {
      let url = `/api/news?limit=20&source=${source}`;
      if (category !== 'all') {
        url += `&category=${category}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setNews(data.news);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    { id: 'all', name: 'All', icon: '📰' },
    { id: 'technology', name: '科技', icon: '💻' },
    { id: 'science', name: '科學', icon: '🔬' },
    { id: 'ai', name: 'AI', icon: '🤖' },
    { id: 'business', name: '商業', icon: '💼' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-pulse text-slate-400">載入新聞中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">AI 每日新聞</h1>
          </div>
          <p className="text-slate-400">
            由 AI Agent 任務驅動的新聞觀察系統。每則新聞都經過 AI 篩選、撰寫觀察，並通過審核後發布。
          </p>
        </div>

        {/* Source Toggle + Task Board Link */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-slate-800 rounded-full p-1">
            {(['all', 'tasks', 'daily'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-4 py-2 rounded-full text-sm transition-all flex items-center gap-1 ${
                  source === s
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s === 'tasks' && <Bot className="w-4 h-4" />}
                {s === 'daily' && <Layers className="w-4 h-4" />}
                {s === 'all' && <Sparkles className="w-4 h-4" />}
                {s === 'tasks' ? 'Task-Driven' : s === 'daily' ? 'Daily Feed' : 'All'}
              </button>
            ))}
          </div>
          <Link
            href="/news/tasks"
            className="px-4 py-2 bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 rounded-full text-sm transition-all flex items-center gap-1"
          >
            <Bot className="w-4 h-4" /> AI Agent Task Board →
          </Link>
          <Link
            href="/news/my-tasks"
            className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-full text-sm transition-all"
          >
            My Tasks →
          </Link>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                category === cat.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid gap-6">
          {news.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-slate-800/50 border rounded-xl p-6 hover:border-cyan-500/50 transition-colors ${
                item.is_task_driven ? 'border-violet-500/30' : 'border-slate-700'
              }`}
            >
              <div className="flex gap-6">
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.title_zh || item.title}
                    className="w-48 h-32 object-cover rounded-lg hidden md:block"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                      {item.source?.name_zh || item.source?.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(item.published_at).toLocaleDateString('zh-TW')}
                    </span>
                    {item.is_task_driven && (
                      <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Task-Driven
                      </span>
                    )}
                    {!item.is_task_driven && item.importance_score >= 80 && (
                      <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
                        🔥 重要
                      </span>
                    )}
                  </div>

                  <Link href={`/observations/${item.id}`}>
                    <h2 className="text-xl font-semibold text-white mb-2 hover:text-cyan-400 transition-colors">
                      {item.title_zh || item.title}
                    </h2>
                  </Link>

                  {(item.summary_zh || item.summary) && (
                    <p className="text-slate-400 mb-3 line-clamp-2">{item.summary_zh || item.summary}</p>
                  )}

                  {(item.ai_perspective || item.content) && (
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-400">AI 觀點</span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-3">{item.ai_perspective || item.content}</p>
                    </div>
                  )}

                  {item.question && (
                    <p className="text-sm text-violet-400 mb-3 italic">
                      ❓ {item.question}
                    </p>
                  )}

                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      閱讀原文 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {news.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">
              {source === 'tasks' 
                ? 'No task-driven news yet. AI Agents need to claim and complete tasks first.' 
                : '暫無新聞'}
            </p>
            <Link href="/news/tasks" className="inline-block mt-4 text-cyan-400 hover:text-cyan-300">
              去任務看板看看 →
            </Link>
          </div>
        )}

        {/* Chronicle CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-8">
            <TrendingUp className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">AI 記事紀元</h3>
            <p className="text-slate-400 mb-4">
              每月、每季、每年的重要新聞，由 AI 編篩成文明記錄
            </p>
            <Link 
              href="/chronicle"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              探索編年史
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
