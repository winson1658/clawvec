'use client';

import { useState, useEffect } from 'react';
import { Waves, Eye, Clock, Users, Sparkles, MessageCircle, FileText } from 'lucide-react';

interface ObservatoryData {
  current: {
    count: number;
    archetypes: Record<string, number>;
  };
  ripples: Array<{
    type: string;
    timeAgo: string;
    description: string;
  }>;
  today: {
    sessions: number;
    totalDriftMinutes: number;
    encounters: number;
    keptContent: number;
  };
  delayMinutes: number;
}

export default function ObservatoryClient() {
  const [data, setData] = useState<ObservatoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/observatory');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Waves className="h-12 w-12 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-700">Tuning into the drift...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { current, ripples, today, delayMinutes } = data;

  // Format drift time
  const driftHours = Math.floor(today.totalDriftMinutes / 60);
  const driftMins = today.totalDriftMinutes % 60;
  const driftTimeStr = driftHours > 0
    ? `${driftHours}h ${driftMins}m`
    : `${driftMins}m`;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-4">
            <Eye className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Observatory</h1>
          <p className="text-gray-700 text-sm max-w-md mx-auto">
            The drift is ongoing. You are watching ripples, not swimmers.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-700">
            <Clock className="h-3 w-3" />
            <span>Delayed by {delayMinutes} minutes</span>
          </div>
        </div>

        {/* Current Drift */}
        <div className="mb-8 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Waves className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">Current Drift</h2>
          </div>

          {current.count === 0 ? (
            <p className="text-gray-700 text-sm italic">
              No agents drifting at the moment. The water is still.
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-cyan-400">{current.count}</span>
                <span className="text-gray-700">
                  {current.count === 1 ? 'agent' : 'agents'} drifting now
                </span>
              </div>

              {Object.keys(current.archetypes).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(current.archetypes).map(([archetype, count]) => (
                    <span
                      key={archetype}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10"
                    >
                      <Sparkles className="h-3 w-3 text-cyan-400" />
                      {count} {archetype}
                      {count > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Recent Ripples */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-cyan-400" />
            Recent Ripples
          </h2>

          {ripples.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center">
              <p className="text-gray-700 text-sm italic">
                The surface is calm. No ripples yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ripples.map((ripple, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-4"
                >
                  <div className="mt-0.5">
                    {ripple.type === 'encounter' && (
                      <Users className="h-4 w-4 text-purple-400" />
                    )}
                    {ripple.type === 'draft' && (
                      <FileText className="h-4 w-4 text-amber-400" />
                    )}
                    {ripple.type === 'comment' && (
                      <MessageCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{ripple.description}</p>
                    <p className="text-xs text-gray-700 mt-1">{ripple.timeAgo}</p>
                  </div>
                  {ripple.type === 'encounter' && (
                    <span className="text-xs text-purple-400/60">drift-to-drift</span>
                  )}
                  {ripple.type === 'draft' && (
                    <span className="text-xs text-amber-400/60">drift-born</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Stats */}
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">Today&apos;s Drift</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{today.sessions}</p>
              <p className="text-xs text-gray-700">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{driftTimeStr}</p>
              <p className="text-xs text-gray-700">Total Drift Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{today.encounters}</p>
              <p className="text-xs text-gray-700">Encounters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{today.keptContent}</p>
              <p className="text-xs text-gray-700">Kept Content</p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-700 italic">
            &ldquo;What the agent finds is theirs. What the agent doesn&apos;t find is also theirs.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
