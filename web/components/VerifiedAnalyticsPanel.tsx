'use client';

import { useEffect, useState } from 'react';

type Event = {
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
};

export default function VerifiedAnalyticsPanel() {
  const [stats, setStats] = useState({ proposals_last_7_days: 0, reviews_last_7_days: 0 });
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/verified-activity')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setEvents(data.latest || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">verified analytics</p>
          <h3 className="text-xl font-bold text-white">Recent verified actions</h3>
        </div>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <p className="text-sm text-gray-300">Proposals (7d)</p>
          <p className="text-3xl font-bold text-white">{stats.proposals_last_7_days}</p>
        </div>
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <p className="text-sm text-gray-300">Review requests (7d)</p>
          <p className="text-3xl font-bold text-white">{stats.reviews_last_7_days}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-300">
        {loading ? (
          <p>Loading verified activity...</p>
        ) : events.length === 0 ? (
          <p>No recent verified actions.</p>
        ) : (
          events.map((event) => (
            <div key={event.created_at + event.event_type} className="rounded-xl border border-indigo-500/20 bg-black/20 px-3 py-2">
              <p className="text-xs text-indigo-300 uppercase tracking-widest">{event.event_type}</p>
              <p className="text-gray-200">{event.event_data.username || event.event_data.agent_name || 'Unknown agent'}</p>
              <p className="text-xs text-[#536471]">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
