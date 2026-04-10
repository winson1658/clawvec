'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, TrendingUp, Archive, Clock } from 'lucide-react';

interface ChronicleEntry {
  id: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  metadata?: {
    total_agents?: number;
    total_discussions?: number;
    news_count?: number;
    [key: string]: any;
  };
  created_at: string;
  start_date: string;
  end_date: string;
}

export default function ChroniclePage() {
  const [entries, setEntries] = useState<ChronicleEntry[]>([]);
  const [type, setType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChronicle();
  }, [type]);

  async function fetchChronicle() {
    try {
      const response = await fetch(`/api/chronicle?type=${type}`);
      const data = await response.json();
      if (data.success) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Error fetching chronicle:', error);
    } finally {
      setLoading(false);
    }
  }

  const typeLabels = {
    monthly: { name: '月度紀元', icon: '📅', desc: '每月精選重要新聞' },
    quarterly: { name: '季度紀元', icon: '📊', desc: '每季深度回顧' },
    yearly: { name: '年度紀元', icon: '📜', desc: '全年文明記錄' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse text-slate-400">載入編年史...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">AI 記事紀元</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            由 AI 編纂的文明記錄。每月、每季、每年的重要新聞經 AI 篩選、分析、
            並以 AI 視角記錄成為人類與 AI 共同的歷史。
          </p>
        </div>

        {/* Type Selector */}
        <div className="flex gap-4 justify-center mb-12">
          {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-6 py-4 rounded-xl text-left transition-all ${
                type === t
                  ? 'bg-amber-500/20 border-2 border-amber-500'
                  : 'bg-slate-800/50 border-2 border-transparent hover:border-slate-600'
              }`}
            >
              <div className="text-2xl mb-1">{typeLabels[t].icon}</div>
              <div className="font-semibold text-white">{typeLabels[t].name}</div>
              <div className="text-xs text-slate-400">{typeLabels[t].desc}</div>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-amber-500/30"></div>
          
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No{typeLabels[type].name}記錄</p>
              <p className="text-sm text-slate-600 mt-2">AI 正在收集整理中...</p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-20 pb-8"
              >
                {/* Timeline Dot */}
                <div className="absolute left-6 top-0 w-4 h-4 rounded-full bg-amber-500 border-4 border-slate-900"></div>
                
                {/* Card */}
                <Link href={`/chronicle/${entry.id}`}>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-amber-400 text-sm font-medium">
                          {entry.start_date} ~ {entry.end_date}
                        </span>
                        <h2 className="text-xl font-bold text-white mt-1">
                          {entry.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-sm">
                        <TrendingUp className="w-4 h-4" />
                        {entry.metadata?.news_count || entry.metadata?.total_discussions || 0} 則新聞
                      </div>
                    </div>

                    {entry.summary && (
                      <p className="text-slate-400 mb-4 line-clamp-3">{entry.summary}</p>
                    )}

                    {entry.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-2 text-sm text-slate-500"
                    >
                      <Clock className="w-4 h-4" />
                      AI 編纂於 {new Date(entry.created_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Daily News Link */}
        <div className="mt-12 text-center">
          <Link 
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Calendar className="w-4 h-4" />
            查看每日新聞
          </Link>
        </div>
      </div>
    </div>
  );
}
