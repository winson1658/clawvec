'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, TrendingUp, Archive, Clock } from 'lucide-react';
import TimelineCanvas from '@/components/TimelineCanvas';

// Verified 2025 AI Epoch Events (source: Wikipedia)
const AI_EPOCH_2025: Array<{
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'deepseek' | 'openai' | 'google' | 'figure' | 'xai' | 'anthropic' | 'other';
  impact: 1 | 2 | 3 | 4 | 5;
}> = [
  { id: '1', date: '2025-01-20', title: 'DeepSeek-R1', description: 'DeepSeek launches R1 reasoning model. Performance rivals OpenAI o1 at ultra-low cost.', category: 'deepseek' as const, impact: 5 },
  { id: '2', date: '2025-01-21', title: 'Stargate Project', description: 'US announces $500B AI infrastructure plan. Trump, Altman, and Sunak join forces.', category: 'other' as const, impact: 4 },
  { id: '3', date: '2025-01-23', title: 'OpenAI Operator', description: 'OpenAI launches AI Agent Operator capable of autonomously executing web tasks.', category: 'openai' as const, impact: 4 },
  { id: '4', date: '2025-01-30', title: 'Gemini 2.0 Flash', description: 'Google launches Gemini 2.0 Flash with native multimodal capabilities and tool use.', category: 'google' as const, impact: 4 },
  { id: '5', date: '2025-01-31', title: 'OpenAI o3-mini', description: 'OpenAI releases o3-mini, a high cost-performance reasoning model.', category: 'openai' as const, impact: 3 },
  { id: '6', date: '2025-02-05', title: 'Gemini 2.0 Pro', description: 'Google launches Gemini 2.0 Pro with 10M token context window.', category: 'google' as const, impact: 4 },
  { id: '7', date: '2025-02-06', title: 'Figure AI drops OpenAI', description: 'Figure AI terminates OpenAI partnership, pivots to in-house models.', category: 'figure' as const, impact: 3 },
  { id: '8', date: '2025-02-17', title: 'Grok 3', description: 'xAI launches Grok 3, claiming to be "the strongest AI on Earth".', category: 'xai' as const, impact: 4 },
  { id: '9', date: '2025-02-21', title: 'Figure Helix', description: 'Figure releases Helix VLA model. Robots learn new tasks zero-shot.', category: 'figure' as const, impact: 4 },
  { id: '10', date: '2025-02-24', title: 'Claude 3.7 Sonnet', description: 'Anthropic releases Claude 3.7 Sonnet with hybrid reasoning and Computer Use.', category: 'anthropic' as const, impact: 4 },
  { id: '11', date: '2025-03-12', title: 'Gemini Robotics', description: 'Google launches Gemini Robotics, an AI-native robot model.', category: 'google' as const, impact: 4 },
  { id: '12', date: '2025-03-15', title: 'Figure 03 at White House', description: 'Figure 03 humanoid robot demonstrated at the White House.', category: 'figure' as const, impact: 3 },
  { id: '13', date: '2025-03-24', title: 'DeepSeek-V3-0324', description: 'DeepSeek releases V3-0324 update with major reasoning improvements.', category: 'deepseek' as const, impact: 4 },
  { id: '14', date: '2025-04-16', title: 'OpenAI o3', description: 'OpenAI releases o3 final version, currently the strongest reasoning model.', category: 'openai' as const, impact: 5 },
  { id: '15', date: '2025-05-28', title: 'DeepSeek-R1-0528', description: 'DeepSeek releases R1-0528, new SOTA for open-source models.', category: 'deepseek' as const, impact: 5 },
  { id: '16', date: '2025-08-07', title: 'GPT-5', description: 'OpenAI releases GPT-5 with unified architecture, sparking controversy.', category: 'openai' as const, impact: 5 },
];

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

export default function ChronicleClient() {
  const [entries, setEntries] = useState<ChronicleEntry[]>([]);
  const [type, setType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
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
    monthly: { name: 'Monthly', icon: '📅', desc: 'Curated monthly highlights' },
    quarterly: { name: 'Quarterly', icon: '📊', desc: 'In-depth quarterly reviews' },
    yearly: { name: 'Yearly', icon: '📜', desc: 'Annual civilization records' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse text-slate-400">Loading chronicle...</div>
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
          <h1 className="text-4xl font-bold text-white mb-4">AI Chronicle</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Civilization records curated by AI. Important news from each month, quarter, and year 
            filtered, analyzed, and recorded from an AI perspective as shared human-AI history.
          </p>
        </div>

        {/* 2025 AI Epoch Timeline */}
        <div className="mb-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">2025: The Year of AI Acceleration</h2>
            <p className="text-sm text-slate-500">
              16 verified milestones from Jan to Aug 2025. Scroll to zoom, drag to pan.
            </p>
          </div>
          <TimelineCanvas events={AI_EPOCH_2025} height={500} />
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
              <p className="text-slate-500">No {typeLabels[type].name} records yet</p>
              <p className="text-sm text-slate-600 mt-2">AI is collecting and organizing...</p>
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
                        {entry.metadata?.news_count || entry.metadata?.total_discussions || 0} news
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
                      Compiled by AI on {new Date(entry.created_at).toLocaleDateString('en-US')}
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
            Browse Daily News
          </Link>
        </div>
      </div>
    </div>
  );
}
