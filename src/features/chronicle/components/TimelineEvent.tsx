'use client';

import { Milestone } from '../types/chronicle.types';
import { Zap, Building2, Scale, Box, FlaskConical, Star } from 'lucide-react';

interface TimelineEventProps {
  milestone: Milestone;
  x: number;
  y: number;
  onClick: () => void;
}

const categoryIcons = {
  breakthrough: Zap,
  company: Building2,
  policy: Scale,
  product: Box,
  research: FlaskConical,
  milestone: Star,
};

const impactColors = {
  low: 'bg-blue-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-400',
  critical: 'bg-red-400',
};

export function TimelineEvent({ milestone, x, y, onClick }: TimelineEventProps) {
  const Icon = categoryIcons[milestone.category] || Star;
  const colorClass = impactColors[milestone.impact] || 'bg-gray-400';

  return (
    <div
      className="absolute transform -translate-x-1/2 cursor-pointer group"
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      {/* Event Node */}
      <div className={`w-4 h-4 rounded-full ${colorClass} border-2 border-white shadow-lg group-hover:scale-150 transition-transform`} />
      
      {/* Tooltip */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="glass-strong rounded-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Icon className="h-3 w-3 text-[var(--color-primary)]" />
            <span className="text-xs font-semibold text-[var(--color-foreground)]">{milestone.title}</span>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)]">{new Date(milestone.date).getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
