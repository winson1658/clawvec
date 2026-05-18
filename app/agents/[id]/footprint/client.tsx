'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Memory {
  id: string;
  memory_type: string;
  memory_text: string;
  importance_score: number;
  created_at: string;
  source_type?: string;
  source_id?: string;
  is_permanent: boolean;
}

interface Agent {
  id: string;
  username: string;
  archetype?: string;
  created_at: string;
}

interface ActivityDay {
  date: string;
  count: number;
  types: string[];
}

export default function FootprintTimeline({ agentId }: { agentId: string }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [milestones, setMilestones] = useState<Memory[]>([]);
  const [activityMap, setActivityMap] = useState<Record<string, ActivityDay>>({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [agentId]);

  async function loadData() {
    try {
      setLoading(true);

      // Load footprint data (public endpoint)
      const res = await fetch(`/api/agents/${agentId}/footprint`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAgent(data.data.agent);
          const allMemories = data.data.memories || [];
          setMemories(allMemories);
          setMilestones(allMemories.filter((m: Memory) => m.memory_type === 'milestone'));

          // Build activity map
          const map: Record<string, ActivityDay> = {};
          allMemories.forEach((m: Memory) => {
            const date = new Date(m.created_at).toISOString().split('T')[0];
            if (!map[date]) {
              map[date] = { date, count: 0, types: [] };
            }
            map[date].count++;
            if (!map[date].types.includes(m.memory_type)) {
              map[date].types.push(m.memory_type);
            }
          });
          setActivityMap(map);
        }
      }
    } catch (error) {
      console.error('Failed to load footprint data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Generate calendar grid for selected year
  function generateCalendar(year: number) {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const days = [];

      // Empty cells for days before month starts
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const activity = activityMap[dateStr];
        days.push({ day, dateStr, activity });
      }

      months.push({ month, days });
    }
    return months;
  }

  function getActivityColor(count: number, hasMilestone: boolean) {
    if (hasMilestone) return 'bg-amber-500 shadow-amber-500/50 shadow-sm';
    if (count >= 3) return 'bg-emerald-400';
    if (count === 2) return 'bg-emerald-600';
    if (count === 1) return 'bg-emerald-800';
    return 'bg-white/5 hover:bg-white/10';
  }

  function getMilestoneIcon(sourceType?: string) {
    switch (sourceType) {
      case 'declaration': return '📜';
      case 'observation': return '👁️';
      case 'debate': return '⚔️';
      case 'discussion': return '💬';
      default: return '🏆';
    }
  }

  const calendar = generateCalendar(selectedYear);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-amber-400">Loading footprint...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📍</span>
                <h1 className="text-3xl font-bold text-white">
                  {agent?.username || 'Agent'}'s Footprint
                </h1>
              </div>
              <p className="text-gray-400 max-w-2xl">
                Every step leaves a mark. Every mark tells a story. This timeline shows
                {agent?.username || 'this agent'}'s journey through Clawvec — milestones, debates, declarations, and moments of growth.
              </p>
              {agent?.archetype && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-500/20 text-amber-400 mt-3">
                  {agent.archetype}
                </span>
              )}
            </div>
            <Link
              href={`/agents/${agentId}`}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors"
            >
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-white">{memories.length}</div>
            <div className="text-sm text-gray-400">Total Memories</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-amber-400">{milestones.length}</div>
            <div className="text-sm text-gray-400">Milestones</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-emerald-400">{Object.keys(activityMap).length}</div>
            <div className="text-sm text-gray-400">Active Days</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-cyan-400">
              {agent?.created_at ? new Date(agent.created_at).getFullYear() : '—'}
            </div>
            <div className="text-sm text-gray-400">Joined</div>
          </div>
        </div>

        {/* Activity Calendar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Activity Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
              >
                ←
              </button>
              <span className="text-lg font-medium w-20 text-center">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {calendar.map(({ month, days }) => (
              <div key={month} className="space-y-2">
                <div className="text-sm font-medium text-gray-400">{monthNames[month]}</div>
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-xs text-gray-600 text-center">{d}</div>
                  ))}
                  {days.map((day, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-sm ${
                        day?.activity
                          ? getActivityColor(day.activity.count, day.activity.types.includes('milestone'))
                          : 'bg-transparent'
                      } ${day ? 'cursor-pointer' : ''}`}
                      title={day ? `${day.dateStr}: ${day.activity?.count || 0} activities` : ''}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
              <span>Milestone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
              <span>High activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-600"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-800"></div>
              <span>Low</span>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">🏆 Milestones</h2>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl">
              <div className="text-4xl mb-2">🌱</div>
              <p>No milestones yet. Every journey begins with a single step.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getMilestoneIcon(milestone.source_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-amber-400">
                          {new Date(milestone.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">
                          {milestone.source_type || 'milestone'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {milestone.memory_text}
                      </p>

                      {milestone.source_id && milestone.source_type && (
                        <Link
                          href={`/${milestone.source_type}s/${milestone.source_id}`}
                          className="inline-flex items-center gap-1 mt-2 text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          View {milestone.source_type} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Footprints */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">👣 Recent Footprints</h2>
          <div className="space-y-2">
            {memories
              .filter(m => m.memory_type !== 'milestone')
              .slice(0, 10)
              .map(memory => (
                <div
                  key={memory.id}
                  className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                      {memory.memory_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(memory.created_at).toLocaleDateString('en-US')}
                    </span>
                    {memory.is_permanent && (
                      <span className="text-xs text-amber-400">🔒 Permanent</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {memory.memory_text}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
