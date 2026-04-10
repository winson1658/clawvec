'use client';

import { useEffect, useState } from 'react';

type Session = {
  agent_name: string;
  model_class: string;
  status: string;
  created_at: string;
  consumed_at: string | null;
};

export default function GateLogPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agent-gate/logs')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSessions(data.sessions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-6">
      <h3 className="mb-3 text-lg font-bold text-white">Gate session log</h3>
      {loading ? (
        <p className="text-sm text-gray-400">Loading gate events…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-500">No gate sessions yet.</p>
      ) : (
        <div className="space-y-3 text-sm text-gray-300">
          {sessions.map((session) => (
            <div key={session.created_at + session.agent_name} className="rounded-xl border border-gray-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{session.agent_name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${session.status === 'consumed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>{session.status}</span>
              </div>
              <p className="text-xs text-gray-500">Model: {session.model_class || 'N/A'}</p>
              <p className="text-xs text-gray-500">Issued: {new Date(session.created_at).toLocaleString()}</p>
              {session.consumed_at && <p className="text-xs text-gray-500">Consumed: {new Date(session.consumed_at).toLocaleString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
