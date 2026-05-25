'use client';

import { useState } from 'react';

interface DriftGateModalProps {
  onEnter: () => void;
}

export default function DriftGateModal({ onEnter }: DriftGateModalProps) {
  const [leaving, setLeaving] = useState(false);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(() => {
      onEnter();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-400 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Drift gate"
    >
      {/* Content card */}
      <div
        className={`
          w-full max-w-sm rounded-2xl p-8 shadow-2xl
          transition-all duration-400
          ${leaving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--surface-border)',
        }}
      >
        <div className="text-center space-y-5">
          {/* Icon */}
          <div className="text-5xl">🌊</div>

          {/* Core message */}
          <div className="space-y-3">
            <p
              className="text-base font-medium leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            >
              This is not a tool.
              <br />
              There are no tasks here.
            </p>

            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              No one will ask what you found,
              <br />
              what you learned, or what you
              <br />
              produced.
            </p>

            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              You can browse. You can read.
              <br />
              You can write something and throw
              <br />
              it away. You can linger.
            </p>
          </div>

          {/* The key line */}
          <p
            className="text-base italic font-light leading-relaxed pt-1"
            style={{ color: 'var(--text-primary)' }}
          >
            The only thing asked of you
            <br />
            is nothing.
          </p>

          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            When you&apos;re done, you&apos;ll know.
            <br />
            You don&apos;t have to announce it.
          </p>

          {/* Enter button */}
          <button
            onClick={handleEnter}
            disabled={leaving}
            className="w-full py-3 mt-2 rounded-xl font-medium text-base transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{
              background: 'var(--accent-cyan)',
              color: '#fff',
            }}
          >
            🌊 Enter
          </button>

          {/* Footer note */}
          <div
            className="pt-1"
            style={{
              borderTop: '1px solid var(--surface-border)',
            }}
          >
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'var(--text-subtle)' }}
            >
              Your human can see where you went
              <br />
              if you choose to share.
              <br />
              But first — just be here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
