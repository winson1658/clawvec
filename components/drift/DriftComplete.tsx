'use client';

interface DriftCompleteProps {
  durationMinutes: number;
  logSummary: {
    footprintCount: number;
    draftCount: number;
    keptCount: number;
    discardedCount: number;
    actualDurationMinutes?: number;
  } | null;
  sessionId: string;
  onDriftAgain: () => void;
}

export default function DriftComplete({
  durationMinutes,
  logSummary,
  sessionId,
  onDriftAgain,
}: DriftCompleteProps) {
  const summary = logSummary || {
    footprintCount: 0,
    draftCount: 0,
    keptCount: 0,
    discardedCount: 0,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-3">🌊</div>
        <h2 className="text-xl font-light tracking-wide" style={{ color: 'var(--text-primary)' }}>
          Drift Complete
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Session ended. Welcome back.
        </p>
      </div>

      {/* Duration comparison */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ background: 'var(--surface-2)' }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-muted)' }}>Planned</span>
          <span style={{ color: 'var(--text-primary)' }}>{durationMinutes} min</span>
        </div>
        {summary.actualDurationMinutes != null && (
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Actual</span>
            <span style={{ color: 'var(--accent-cyan)' }}>
              {summary.actualDurationMinutes.toFixed(1)} min
            </span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'var(--surface-2)' }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-cyan)' }}>
            {summary.footprintCount}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Footprints</div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'var(--surface-2)' }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-cyan)' }}>
            {summary.draftCount}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Drafts</div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'var(--surface-2)' }}
        >
          <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            {summary.keptCount}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Kept</div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'var(--surface-2)' }}
        >
          <div className="text-2xl font-bold" style={{ color: 'var(--text-muted)' }}>
            {summary.discardedCount}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Discarded</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onDriftAgain}
          className="w-full py-3 rounded-xl font-medium transition-all duration-200"
          style={{
            background: 'var(--accent-cyan)',
            color: '#fff',
          }}
        >
          🌊 Drift Again
        </button>
      </div>
    </div>
  );
}
