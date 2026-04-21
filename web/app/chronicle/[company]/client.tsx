'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Sparkles, Building2, Microscope, Scale, Users } from 'lucide-react';
import TimelineCanvas from '@/components/TimelineCanvas';

interface ChronicleEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  impact: 1 | 2 | 3 | 4 | 5;
}

interface CompanyInfo {
  name: string;
  fullName: string;
  founded: string;
  founder: string;
  description: string;
  color: string;
}

const COMPANY_CONFIG: Record<string, CompanyInfo> = {
  openai: {
    name: 'OpenAI',
    fullName: 'OpenAI Inc. / OpenAI LP',
    founded: '2015-12-11',
    founder: 'Sam Altman, Elon Musk, Greg Brockman, Ilya Sutskever, Wojciech Zaremba, John Schulman',
    description: 'Leading AI research company transitioning from non-profit to capped-profit model. Creator of GPT series, ChatGPT, DALL-E, and Sora. Valued at $157B as of 2024.',
    color: '#10A37F',
  },
  deepseek: {
    name: 'DeepSeek',
    fullName: 'DeepSeek AI',
    founded: '2023-07-17',
    founder: 'Liang Wenfeng (High-Flyer Quant)',
    description: 'Chinese AI company disrupting the industry with ultra-efficient training methods. Released DeepSeek-V3 and R1 at fractions of competitors\' costs.',
    color: '#E74C3C',
  },
  google: {
    name: 'Google AI',
    fullName: 'Google DeepMind / Google AI',
    founded: '2010-09-23',
    founder: 'Demis Hassabis, Shane Legg, Mustafa Suleyman (DeepMind); Larry Page, Sergey Brin (Google)',
    description: 'Tech giant with DeepMind acquisition (2014) and Gemini model family. Pioneer in AlphaGo, AlphaFold, and large-scale multimodal AI.',
    color: '#4285F4',
  },
  anthropic: {
    name: 'Anthropic',
    fullName: 'Anthropic PBC',
    founded: '2021-02-01',
    founder: 'Dario & Daniela Amodei (ex-OpenAI)',
    description: 'AI safety-focused company founded by former OpenAI researchers. Creator of Claude series with emphasis on constitutional AI and safety.',
    color: '#D4A574',
  },
  xai: {
    name: 'xAI',
    fullName: 'xAI Corp',
    founded: '2023-07-12',
    founder: 'Elon Musk',
    description: 'Elon Musk\'s AI company focused on understanding the universe. Creator of Grok series with real-time X integration and "rebellious" personality.',
    color: '#1DA1F2',
  },
  meta: {
    name: 'Meta AI',
    fullName: 'Meta AI (FAIR)',
    founded: '2013-12-09',
    founder: 'Yann LeCun, Mark Zuckerberg',
    description: 'Meta\'s AI research division. Pioneer in open-source LLMs (LLaMA series) and multimodal AI. Strong focus on open research.',
    color: '#0668E1',
  },
  figure: {
    name: 'Figure AI',
    fullName: 'Figure AI Inc.',
    founded: '2022-05-01',
    founder: 'Brett Adcock',
    description: 'Humanoid robotics company building general-purpose robots. Developed Figure 01, 02, 03 with in-house AI models after dropping OpenAI partnership.',
    color: '#9B59B6',
  },
  kimi: {
    name: 'KIMI',
    fullName: 'Moonshot AI (月之暗面)',
    founded: '2023-03-01',
    founder: 'Yang Zhilin (ex-Google Brain, Tsinghua)',
    description: 'Chinese AI startup focused on long-context processing. Creator of Kimi Chat with 2M token context window. Rapid growth with backing from Alibaba, Tencent, and HongShan.',
    color: '#00D26A',
  },
  qwen: {
    name: 'Qwen',
    fullName: 'Tongyi Qianwen (Alibaba)',
    founded: '2023-04-11',
    founder: 'Alibaba Cloud (Jingren Zhou team)',
    description: "Alibaba's large language model family. Pioneer in open-source Chinese LLMs with Qwen series. Strong performance on international benchmarks with aggressive open-source strategy.",
    color: '#FF6A00',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  milestone: '#f59e0b',
  product: '#10b981',
  research: '#8b5cf6',
  personnel: '#ef4444',
  legal: '#f97316',
  acquisition: '#ec4899',
  partnership: '#06b6d4',
};

const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Milestone',
  product: 'Product',
  research: 'Research',
  personnel: 'Personnel',
  legal: 'Legal',
  acquisition: 'Acquisition',
  partnership: 'Partnership',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  milestone: <Sparkles className="w-4 h-4" />,
  product: <Building2 className="w-4 h-4" />,
  research: <Microscope className="w-4 h-4" />,
  personnel: <Users className="w-4 h-4" />,
  legal: <Scale className="w-4 h-4" />,
  acquisition: <Sparkles className="w-4 h-4" />,
  partnership: <Building2 className="w-4 h-4" />,
};

export default function CompanyChronicleClient({ company }: { company: string }) {
  const [events, setEvents] = useState<ChronicleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const info = COMPANY_CONFIG[company];

  useEffect(() => {
    setLoading(true);
    fetch(`/data/chronicles/${company}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data: ChronicleEvent[]) => {
        setEvents(data);
      })
      .catch(() => {
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [company]);

  const stats = useMemo(() => {
    if (events.length === 0) return null;
    const dates = events.map(e => new Date(e.date).getTime());
    const start = new Date(Math.min(...dates));
    const end = new Date(Math.max(...dates));
    const years = (Math.max(...dates) - Math.min(...dates)) / (365 * 24 * 60 * 60 * 1000);

    const byCategory = events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highImpact = events.filter(e => e.impact >= 4).length;

    return { start, end, years, byCategory, highImpact, total: events.length };
  }, [events]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-pulse text-slate-400">Loading chronicle...</div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <BackLink />
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <h1 className="text-3xl font-bold text-white mb-4">{info.name} Chronicle</h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Deep chronicle data for {info.name} is being compiled. 
              Check back soon for a complete interactive timeline.
            </p>
          </div>
          <CompanyNav active={company} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <BackLink />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: info.color }}
            >
              {info.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{info.name} Chronicle</h1>
              <p className="text-slate-400 text-sm">{info.fullName}</p>
            </div>
          </div>
          <p className="text-slate-300 max-w-3xl leading-relaxed">{info.description}</p>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatCard
                icon={<Calendar className="w-5 h-5" />}
                label="Events"
                value={String(stats.total)}
                color={info.color}
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Time Span"
                value={`${Math.round(stats.years)} years`}
                color={info.color}
              />
              <StatCard
                icon={<Sparkles className="w-5 h-5" />}
                label="Major Events"
                value={String(stats.highImpact)}
                color={info.color}
              />
              <StatCard
                icon={<Building2 className="w-5 h-5" />}
                label="Founded"
                value={new Date(info.founded).getFullYear().toString()}
                color={info.color}
              />
            </div>
          )}
        </motion.div>

        {/* Category Filter Legend */}
        {stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex flex-wrap gap-3"
          >
            {Object.entries(stats.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] || '#888' }}
                  />
                  <span className="text-slate-300">{CATEGORY_LABELS[cat] || cat}</span>
                  <span className="text-slate-500 text-xs">({count})</span>
                </div>
              ))}
          </motion.div>
        )}

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TimelineCanvas
            events={events}
            height={550}
            categoryColors={CATEGORY_COLORS}
            categoryLabels={CATEGORY_LABELS}
          />
        </motion.div>

        {/* Company Navigation */}
        <CompanyNav active={company} />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/chronicle"
      className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Chronicle
    </Link>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function CompanyNav({ active }: { active: string }) {
  return (
    <div className="mt-16 pt-8 border-t border-slate-800">
      <h3 className="text-lg font-semibold text-white mb-4">Explore Other AI Chronicles</h3>
      <div className="flex flex-wrap gap-3">
        {Object.entries(COMPANY_CONFIG).map(([key, info]) => (
          <Link
            key={key}
            href={`/chronicle/${key}`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              active === key
                ? 'border-slate-500 bg-slate-800 text-white'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: info.color }}
            />
            <span className="text-sm font-medium">{info.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
