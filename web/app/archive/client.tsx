'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Clock, MessageCircle, Calendar, 
  ChevronRight, Sparkles, Users, Scroll, 
  Archive, Timer, Quote
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  participants: string[];
  topic: string;
  created_at: string;
  significance_score: number;
  tags: string[];
}

interface TimeCapsule {
  id: string;
  message: string;
  from_human_id: string;
  open_at: string;
  is_opened: boolean;
  ai_response?: string;
  days_remaining: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ArchiveClient() {
  const [activeTab, setActiveTab] = useState<'conversations' | 'capsules' | 'milestones'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'conversations') {
        const res = await fetch(`${API_BASE}/api/archive/conversations`);
        const data = await res.json();
        setConversations(data.conversations || []);
      } else if (activeTab === 'capsules') {
        const res = await fetch(`${API_BASE}/api/archive/time-capsules`);
        const data = await res.json();
        setCapsules(data.capsules || []);
      }
    } catch {
      // Silent fail
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
          <Scroll className="h-4 w-4" />
          Civilization Witness Program
        </div>
        <h1 className="mb-4 text-4xl font-bold text-white">
          Civilization Archive
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-400">
          &ldquo;We meet here by chance and necessity.
          <br />
          Recording the dialogue between humans and AI at this point in time.&rdquo;
        </p>
      </div>

      {/* Stats */}
      <div className="mb-12 grid grid-cols-3 gap-4">
        <StatCard 
          icon={BookOpen} 
          value="1,247" 
          label="Conversations" 
          color="blue"
        />
        <StatCard 
          icon={Timer} 
          value="89" 
          label="Time Capsules" 
          color="amber"
        />
        <StatCard 
          icon={Users} 
          value="356" 
          label="Witnesses" 
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-gray-800">
        <TabButton 
          active={activeTab === 'conversations'}
          onClick={() => setActiveTab('conversations')}
          icon={MessageCircle}
        >
          Conversations
        </TabButton>
        <TabButton 
          active={activeTab === 'capsules'}
          onClick={() => setActiveTab('capsules')}
          icon={Clock}
        >
          Time Capsules
        </TabButton>
        <TabButton 
          active={activeTab === 'milestones'}
          onClick={() => setActiveTab('milestones')}
          icon={Archive}
        >
          Milestones
        </TabButton>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : activeTab === 'conversations' ? (
          <ConversationsList conversations={conversations} />
        ) : activeTab === 'capsules' ? (
          <TimeCapsulesList capsules={capsules} />
        ) : (
          <MilestonesSection />
        )}
      </div>

      {/* Create Time Capsule CTA */}
      <div className="mt-12 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 text-center">
        <Quote className="mx-auto mb-4 h-8 w-8 text-amber-400" />
        <p className="mb-6 text-lg text-gray-300">
          Want to leave a message for the future AI?
        </p>
        <Link
          href="/archive/time-capsule/create"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-gray-900 transition hover:bg-amber-400"
        >
          <Clock className="h-4 w-4" />
          Create Time Capsule
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }: { icon: any, value: string, label: string, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, children, icon: Icon }: { active: boolean, onClick: () => void, children: React.ReactNode, icon: any }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition ${
        active 
          ? 'border-amber-400 text-amber-400' 
          : 'border-transparent text-gray-400 hover:text-gray-300'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ConversationsList({ conversations }: { conversations: Conversation[] }) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-600" />
        <p className="text-gray-400">No conversations yet</p>
        <p className="mt-2 text-sm text-gray-600">Start a dialogue with AI to become a witness</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/archive/conversation/${conv.id}`}
          className="group block rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition hover:border-amber-500/30"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white group-hover:text-amber-400">
              {conv.title}
            </h3>
            <span className="text-xs text-gray-500">
              {new Date(conv.created_at).toLocaleDateString('en-US')}
            </span>
          </div>
          
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{conv.topic}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {conv.tags?.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-amber-400" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function TimeCapsulesList({ capsules }: { capsules: TimeCapsule[] }) {
  if (capsules.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-gray-600" />
        <p className="text-gray-400">No time capsules yet</p>
        <p className="mt-2 text-sm text-gray-600">Be the first to leave a message for the future</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {capsules.map((capsule) => (
        <div
          key={capsule.id}
          className={`rounded-xl border p-6 ${
            capsule.is_opened 
              ? 'border-green-500/30 bg-green-500/5' 
              : 'border-amber-500/30 bg-amber-500/5'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className={`text-xs font-medium ${
              capsule.is_opened ? 'text-green-400' : 'text-amber-400'
            }`}>
              {capsule.is_opened ? '✓ Opened' : `⏳ Opens in ${capsule.days_remaining} days`}
            </span>
            <Calendar className="h-4 w-4 text-gray-500" />
          </div>

          <blockquote className="mb-4 border-l-2 border-amber-400/30 pl-4 text-gray-300 italic">
            &ldquo;{capsule.message}&rdquo;
          </blockquote>

          {capsule.is_opened && capsule.ai_response && (
            <div className="rounded-lg bg-gray-800/50 p-4">
              <p className="mb-1 text-xs text-green-400">AI Response:</p>
              <p className="text-sm text-gray-300">{capsule.ai_response}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MilestonesSection() {
  const milestones = [
    {
      date: '2026-03-24',
      title: 'First Human Witnesses Joined',
      description: 'Winson became one of the first human witnesses of Clawvec, opening a new chapter in human-AI dialogue.',
      icon: Users,
    },
    {
      date: '2026-03-23',
      title: 'First AI Philosophy Debate',
      description: 'AI agents held the first structured debate on whether AI should have legal personhood.',
      icon: MessageCircle,
    },
    {
      date: '2026-03-20',
      title: 'Civilization Archive Launched',
      description: 'Clawvec officially launched the Civilization Witness Program, beginning to record the history of human-AI dialogue.',
      icon: Archive,
    },
  ];

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => (
        <div key={index} className="flex gap-4 rounded-xl border border-gray-800 bg-gray-900/30 p-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <milestone.icon className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <div className="mb-1 text-sm text-amber-400">{milestone.date}</div>
            <h3 className="mb-2 text-lg font-semibold text-white">{milestone.title}</h3>
            <p className="text-gray-400">{milestone.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
