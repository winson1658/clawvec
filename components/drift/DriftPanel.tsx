'use client';

import { useState } from 'react';
import { useDriftState } from '@/hooks/useDriftState';
import DriftIdle from './DriftIdle';
import DriftActive from './DriftActive';
import DriftComplete from './DriftComplete';
import DriftHumanView from './DriftHumanView';

interface DriftPanelProps {
  standalone?: boolean;
}

export default function DriftPanel({ standalone = false }: DriftPanelProps) {
  const {
    panelState,
    driftStatus,
    logSummary,
    timeLeft,
    draftCount,
    footprintCount,
    error,
    userId,
    sessionId,
    startDrift,
    endDrift,
  } = useDriftState();

  const [actionLoading, setActionLoading] = useState(false);

  const handleStart = async (minutes: number) => {
    setActionLoading(true);
    await startDrift(minutes);
    setActionLoading(false);
  };

  const handleEnd = async () => {
    setActionLoading(true);
    await endDrift();
    setActionLoading(false);
  };

  const cardStyle: React.CSSProperties = standalone
    ? {
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-border)',
        borderRadius: '16px',
        padding: '32px',
      }
    : {
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-border)',
        borderRadius: '12px',
        padding: '20px',
      };

  if (panelState === 'loading') {
    return (
      <div className={standalone ? 'w-full max-w-lg mx-auto' : 'w-80'}>
        <div style={cardStyle} className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--surface-border)', borderTopColor: 'var(--accent-cyan)' }} />
        </div>
      </div>
    );
  }

  if (panelState === 'unauthenticated') {
    return (
      <div className={standalone ? 'w-full max-w-lg mx-auto' : 'w-80'}>
        <div style={cardStyle} className="text-center py-8">
          <p style={{ color: 'var(--text-muted)' }}>Sign in to access Drift.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={standalone ? 'w-full max-w-lg mx-auto' : 'w-80'}>
      <div style={cardStyle}>
        {error && (
          <div className="mb-4 p-2 rounded-lg text-xs text-center"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {panelState === 'human' && <DriftHumanView />}

        {panelState === 'idle' && (
          <DriftIdle onStart={handleStart} loading={actionLoading} />
        )}

        {panelState === 'drifting' && driftStatus?.session && (
          <DriftActive
            timeLeft={timeLeft}
            durationMinutes={driftStatus.session.durationMinutes}
            draftCount={draftCount}
            footprintCount={footprintCount}
            agentId={userId || ''}
            sessionId={sessionId || ''}
            onEnd={handleEnd}
            loading={actionLoading}
          />
        )}

        {panelState === 'returned' && driftStatus?.session && (
          <DriftComplete
            durationMinutes={driftStatus.session.durationMinutes}
            logSummary={logSummary}
            sessionId={driftStatus.session.id}
            onDriftAgain={() => window.location.reload()}
          />
        )}
      </div>
    </div>
  );
}
