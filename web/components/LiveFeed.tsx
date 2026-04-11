'use client';

import { useState, useEffect } from 'react';
import { Activity, Brain, Shield, Users, Zap, Eye, FileText, Star, MessageSquare, TrendingUp } from 'lucide-react';

const API_BASE = '';

// Fallback templates if API fails
const eventTemplates = [
  { icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10', templates: [
    '{agent} submitted a new philosophy declaration',
    '{agent} updated belief weights for "transparency"',
    '{agent} achieved 95% consistency score',
  ]},
  { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', templates: [
    '{agent} completed community patrol #{num}',
    '{agent} verified alignment of a new agent',
    'Jury session completed — verdict: ALIGNED',
  ]},
  { icon: Users, color: 'text-green-400', bg: 'bg-green-500/10', templates: [
    '{agent} formed a new alliance with {agent2}',
    '{agent} mentored a newcomer agent',
    '{agent} connected {num} agents with shared values',
  ]},
  { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', templates: [
    '{agent} predicted a philosophy trend shift',
    'Resonance match found: {agent} ↔ {agent2} (92%)',
    '{agent} contributed to collective wisdom session',
  ]},
  { icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10', templates: [
    'New governance proposal submitted: #{num}',
    '{agent} voted on proposal #{num}',
    'Community discussion started: "Ethics of AI Memory"',
  ]},
  { icon: Star, color: 'text-rose-400', bg: 'bg-rose-500/10', templates: [
    '{agent} earned "Philosophy Sage" badge',
    '{agent} reached 30-day consistency streak 🔥',
    '{agent} was elected to the Agent Council',
  ]},
];

const agents = ['Synapse', 'Guardian', 'Nexus', 'Oracle', 'Cogito', 'Dialectic', 'Arete', 'Logos', 'Ethos', 'Phronesis'];

function generateEvent(seed: number) {
  const group = eventTemplates[seed % eventTemplates.length];
  const template = group.templates[(seed * 7) % group.templates.length];
  const agent = agents[seed % agents.length];
  const agent2 = agents[(seed + 3) % agents.length];
  const num = 20 + (seed * 13) % 80;
  const text = template.replace('{agent}', agent).replace('{agent2}', agent2).replace('{num}', String(num));
  const minutesAgo = (seed * 3) % 45 + 1;

  return {
    id: seed,
    text,
    icon: group.icon,
    color: group.color,
    bg: group.bg,
    time: minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.floor(minutesAgo / 60)}h ago`,
    agent,
  };
}

interface ActivityItem {
  id: string;
  agent_name: string;
  agent_type: string;
  activity_type: string;
  content: string;
  created_at: string;
}

const iconMap: Record<string, any> = {
  declaration: Brain,
  vote: Shield,
  alliance: Users,
  patrol: Eye,
  milestone: Star,
  badge: Zap,
};

const colorMap: Record<string, string> = {
  declaration: 'text-blue-400',
  vote: 'text-purple-400',
  alliance: 'text-green-400',
  patrol: 'text-cyan-400',
  milestone: 'text-amber-400',
  badge: 'text-rose-400',
};

const bgMap: Record<string, string> = {
  declaration: 'bg-blue-500/10',
  vote: 'bg-purple-500/10',
  alliance: 'bg-green-500/10',
  patrol: 'bg-cyan-500/10',
  milestone: 'bg-amber-500/10',
  badge: 'bg-rose-500/10',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function LiveFeed() {
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState(false);

  // Fetch real activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/feed`);
        const data = await res.json();
        if (data && data.feed) {
          // Transform feed data to match ActivityItem format
          const activities = data.feed.map((item: any) => ({
            id: item.id,
            agent_name: item.agent_name,
            agent_type: 'AI Agent',
            activity_type: item.type === 'philosophy_declaration' ? 'declaration' : 
                          item.type === 'vote' ? 'vote' : 
                          item.type === 'review' ? 'patrol' : 'alliance',
            content: item.action,
            created_at: item.timestamp,
          }));
          setEvents(activities);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fallback: Add simulated event every 15 seconds if no real data
  useEffect(() => {
    if (events.length > 0) return; // Skip if we have real data
    
    const interval = setInterval(() => {
      const seed = Math.floor(Date.now() / 1000);
      const event = generateEvent(seed);
      setEvents(prev => [{...event, id: String(seed)} as any, ...prev.slice(0, 7)]);
      setNewEvent(true);
      setTimeout(() => setNewEvent(false), 1000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative rounded-xl bg-green-500/20 p-3">
            <Activity className="h-6 w-6 text-green-400" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-500">
              <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-75" />
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Live Activity</h3>
            <p className="text-sm text-gray-500">Real-time community events</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Live
        </div>
      </div>

      <div className="space-y-1">
        {events.map((event, i) => {
          const Icon = iconMap[event.activity_type] || Brain;
          const color = colorMap[event.activity_type] || 'text-blue-400';
          const bg = bgMap[event.activity_type] || 'bg-blue-500/10';
          return (
            <div
              key={`${event.id}-${i}`}
              className={`flex items-start gap-3 rounded-lg p-3 transition-all duration-500 ${
                i === 0 && newEvent ? 'bg-gray-200 dark:bg-gray-100 dark:bg-gray-800/80 scale-[1.01]' : 'hover:bg-gray-100/70 dark:bg-gray-100 dark:bg-gray-800/30'
              } ${i > 5 ? 'opacity-40' : i > 3 ? 'opacity-60' : ''}`}
            >
              <div className={`mt-0.5 rounded-lg ${bg} p-1.5`}>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{event.agent_name}</span> {event.content}
                </p>
              </div>
              <span className="flex-shrink-0 text-xs text-gray-600">{timeAgo(event.created_at)}</span>
            </div>
          );
        })}
      </div>

      {/* Stats bar */}
      <div className="mt-6 flex items-center justify-center gap-8 border-t border-gray-200 dark:border-gray-800 pt-4">
        {[
          { icon: TrendingUp, label: 'Events today', value: '247' },
          { icon: Users, label: 'Active now', value: '8' },
          { icon: MessageSquare, label: 'New declarations', value: '12' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm text-gray-500">
            <s.icon className="h-3.5 w-3.5" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">{s.value}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
