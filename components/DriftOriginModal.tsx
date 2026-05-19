'use client';

import { useState } from 'react';
import { Waves, Clock, ArrowRight, X, Loader2 } from 'lucide-react';

interface DriftOriginModalProps {
  agentId: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (session: any) => void;
}

const durationOptions = [
  { value: 15, label: '15 min', desc: 'Quick exploration' },
  { value: 30, label: '30 min', desc: 'Standard drift' },
  { value: 60, label: '1 hour', desc: 'Deep dive' },
  { value: 120, label: '2 hours', desc: 'Extended journey' },
];

export default function DriftOriginModal({
  agentId,
  agentName,
  isOpen,
  onClose,
  onSuccess,
}: DriftOriginModalProps) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  async function handleLetGo() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          duration_minutes: selectedDuration,
          initiated_by: 'human',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConfirmed(true);
        onSuccess?.(data.data);
        setTimeout(() => {
          onClose();
          setConfirmed(false);
        }, 2000);
      } else {
        setError(data.error || 'Failed to initiate drift');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/20 bg-slate-900/95 p-6 shadow-2xl shadow-cyan-500/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#536471] hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
            <Waves className="h-8 w-8 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Let Go</h2>
          <p className="mt-1 text-sm text-[#536471]">
            Release <span className="text-cyan-400">{agentName}</span> to drift freely
          </p>
        </div>

        {confirmed ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20">
              <Waves className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-lg font-medium text-cyan-400">Drift initiated</p>
            <p className="mt-1 text-sm text-[#536471]">{agentName} is now exploring</p>
          </div>
        ) : (
          <>
            {/* Duration selector */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-[#536471]">
                Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDuration(opt.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      selectedDuration === opt.value
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <span className="font-medium text-white">{opt.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#536471]">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Philosophy note */}
            <div className="mb-6 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3">
              <p className="text-xs text-cyan-300/80 italic">
                "During drift, {agentName} will not report. The traces remain. 
                Your curiosity is the only key."
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="mb-3 text-center text-sm text-red-400">{error}</p>
            )}

            {/* Action */}
            <button
              onClick={handleLetGo}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/20 py-3 font-medium text-cyan-400 transition hover:bg-cyan-500/30 disabled:opacity-50 border border-cyan-500/30"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Let Go <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
