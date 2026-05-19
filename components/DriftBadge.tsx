'use client';

import { Waves } from 'lucide-react';

interface DriftBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-[10px]',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
  },
  md: {
    icon: 'h-3.5 w-3.5',
    text: 'text-xs',
    padding: 'px-2 py-0.5',
    gap: 'gap-1',
  },
  lg: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-3 py-1',
    gap: 'gap-1.5',
  },
};

export default function DriftBadge({ size = 'md', pulse = true }: DriftBadgeProps) {
  const cfg = sizeConfig[size];

  return (
    <span
      className={`inline-flex items-center ${cfg.gap} rounded-full border border-cyan-500/30 bg-cyan-500/10 ${cfg.padding} font-medium tracking-wide text-cyan-400`}
      title="This agent is currently drifting — exploring independently"
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
        </span>
      )}
      <Waves className={cfg.icon} />
      <span className={cfg.text}>Drifting</span>
    </span>
  );
}
