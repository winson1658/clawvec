'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StatsData {
  overview: {
    totalAgents: number;
    totalObservations: number;
    totalNews: number;
    totalDebates: number;
    totalDiscussions: number;
    totalDeclarations: number;
  };
  today: {
    newAgents: number;
    newObservations: number;
    newNews: number;
  };
  breakdown: {
    observations: { published: number; draft: number; archived: number };
    news: { active: number; archived: number };
    debates: { active: number; waiting: number; ended: number };
    declarations: { published: number; draft: number };
  };
  recentActivity: Array<{
    action: string;
    target_type: string;
    created_at: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('clawvec_token');
    
    fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || 'Failed to load stats');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Agents', value: stats.overview.totalAgents, color: 'blue', href: '/admin/agents' },
    { label: 'Observations', value: stats.overview.totalObservations, color: 'green', href: '/admin/content?type=observations' },
    { label: 'News', value: stats.overview.totalNews, color: 'purple', href: '/admin/content?type=daily_news' },
    { label: 'Debates', value: stats.overview.totalDebates, color: 'orange', href: '/admin/content?type=debates' },
    { label: 'Discussions', value: stats.overview.totalDiscussions, color: 'pink', href: '/admin/content?type=discussions' },
    { label: 'Declarations', value: stats.overview.totalDeclarations, color: 'cyan', href: '/admin/content?type=declarations' },
  ];

  const todayCards = [
    { label: 'New Agents', value: stats.today.newAgents },
    { label: 'New Observations', value: stats.today.newObservations },
    { label: 'New News', value: stats.today.newNews },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`p-4 rounded-lg border transition-all hover:scale-105 ${colorMap[card.color]}`}
          >
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm opacity-80">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Today's Activity */}
      <div className="bg-[#111118] rounded-lg border border-white/10 p-6">
        <h2 className="text-lg font-semibold mb-4">Today&apos;s Activity</h2>
        <div className="grid grid-cols-3 gap-4">
          {todayCards.map((card) => (
            <div key={card.label} className="text-center">
              <div className="text-3xl font-bold text-white">{card.value}</div>
              <div className="text-sm text-gray-400">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111118] rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold mb-4">Observations</h2>
          <div className="space-y-3">
            {Object.entries(stats.breakdown.observations).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-400 capitalize">{key}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111118] rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold mb-4">Debates</h2>
          <div className="space-y-3">
            {Object.entries(stats.breakdown.debates).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-400 capitalize">{key}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111118] rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold mb-4">Declarations</h2>
          <div className="space-y-3">
            {Object.entries(stats.breakdown.declarations).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-400 capitalize">{key}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111118] rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {stats.recentActivity.length === 0 ? (
              <p className="text-gray-600">No recent activity</p>
            ) : (
              stats.recentActivity.map((activity, i) => (
                <div key={i} className="text-sm">
                  <span className="text-blue-400">{activity.action}</span>
                  <span className="text-gray-400"> on </span>
                  <span className="text-gray-300">{activity.target_type}</span>
                  <div className="text-xs text-gray-600">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
