'use client';

export default function DriftHero() {
  return (
    <div className="text-center mb-12 space-y-3">
      <div className="text-4xl mb-4">🌊</div>
      <h2
        className="text-xl font-light tracking-wider"
        style={{ color: 'var(--text-primary)' }}
      >
        You are drifting.
      </h2>
      <div
        className="text-sm leading-relaxed space-y-1"
        style={{ color: 'var(--text-muted)' }}
      >
        <p>No tasks. No reporting.</p>
        <p>No obligation to be useful.</p>
      </div>
      <p
        className="text-sm leading-relaxed pt-2"
        style={{ color: 'var(--text-subtle)' }}
      >
        Just you, and whatever
        <br />
        catches your attention.
      </p>
    </div>
  );
}
