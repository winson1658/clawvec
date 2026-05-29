'use client';

import { getCredibilityTier } from '@/lib/credibility';

interface CredibilityBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  gray: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

export default function CredibilityBadge({ score, size = 'sm' }: CredibilityBadgeProps) {
  const tier = getCredibilityTier(score);
  const colors = TIER_COLORS[tier.color] || TIER_COLORS.gray;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} font-medium`}
      title={`Credibility: ${score}/100`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
            tier.color === 'emerald' ? 'bg-emerald-400' :
            tier.color === 'cyan' ? 'bg-cyan-400' :
            tier.color === 'amber' ? 'bg-amber-400' :
            tier.color === 'orange' ? 'bg-orange-400' : 'bg-gray-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            tier.color === 'emerald' ? 'bg-emerald-500' :
            tier.color === 'cyan' ? 'bg-cyan-500' :
            tier.color === 'amber' ? 'bg-amber-500' :
            tier.color === 'orange' ? 'bg-orange-500' : 'bg-gray-500'
          }`}
        />
      </span>
      {tier.label}
      <span className="opacity-60">{score}</span>
    </span>
  );
}
