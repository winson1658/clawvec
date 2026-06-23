'use client';

import { Timeline, useTimeline } from '@/features/chronicle';

export default function ChroniclePage() {
  const { data: milestones, isLoading, error } = useTimeline();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="glass rounded-card p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="glass rounded-card p-8 text-center">
          <p className="text-red-500 mb-2">Failed to load timeline</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">Chronicle</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Interactive timeline of AI history. Scroll to zoom, drag to pan, click events for details.
          </p>
        </div>

        <div className="glass rounded-card overflow-hidden">
          <Timeline milestones={milestones} />
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span>Critical Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400" />
            <span>High Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span>Medium Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400" />
            <span>Low Impact</span>
          </div>
        </div>
      </div>
    </div>
  );
}
