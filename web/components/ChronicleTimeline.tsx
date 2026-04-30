'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, History, Landmark } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  date: string;
  year: number;
  quarter?: string;
  description?: string;
  impact_level: 1 | 2 | 3 | 4 | 5;
  category: 'tech' | 'policy' | 'culture' | 'milestone';
}

interface ChronicleTimelineProps {
  milestones?: Milestone[];
}

function getImpactStars(level: number): string {
  return '⭐'.repeat(level);
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'tech':
      return <Sparkles className="h-4 w-4 text-cyan-400" />;
    case 'policy':
      return <Landmark className="h-4 w-4 text-amber-400" />;
    case 'culture':
      return <History className="h-4 w-4 text-purple-400" />;
    default:
      return <Sparkles className="h-4 w-4 text-purple-400" />;
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'tech':
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
    case 'policy':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    case 'culture':
      return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
    default:
      return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
  }
}

export default function ChronicleTimeline({ milestones = [] }: ChronicleTimelineProps) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);

  const years = Array.from(new Set(milestones.map(m => m.year))).sort();
  const filteredMilestones = milestones.filter(m => m.year === selectedYear);

  return (
    <div className="space-y-8">
      {/* Year Navigator */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setSelectedYear(y => Math.min(...years) < y ? y - 1 : y)}
          disabled={selectedYear <= Math.min(...years)}
          className="rounded-full border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-2 text-[#536471] dark:text-gray-400 transition-all hover:bg-white dark:bg-gray-800 hover:text-[#0f1419] dark:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedYear === year
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-500 hover:text-[#536471] dark:text-gray-300'
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelectedYear(y => Math.max(...years) > y ? y + 1 : y)}
          disabled={selectedYear >= Math.max(...years)}
          className="rounded-full border border-[#eff3f4] dark:border-gray-700 bg-gray-100 dark:bg-white dark:bg-gray-800/50 p-2 text-[#536471] dark:text-gray-400 transition-all hover:bg-white dark:bg-gray-800 hover:text-[#0f1419] dark:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Timeline Visual */}
      <div className="relative">
        {/* Horizontal Line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        {/* Milestone Points */}
        <div className="relative flex justify-between px-8">
          {filteredMilestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredMilestone(milestone.id)}
              onMouseLeave={() => setHoveredMilestone(null)}
            >
              {/* Point on timeline */}
              <button
                className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full transition-all ${
                  hoveredMilestone === milestone.id
                    ? 'scale-150 bg-purple-400 shadow-lg shadow-purple-500/50'
                    : 'bg-purple-500/50'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-white" />
              </button>

              {/* Milestone Card */}
              <div
                className={`absolute top-8 w-48 transition-all ${
                  index % 2 === 0 ? 'origin-top' : 'origin-bottom bottom-8 top-auto'
                } ${
                  hoveredMilestone === milestone.id
                    ? 'opacity-100 scale-100'
                    : 'opacity-70 scale-95'
                }`}
              >
                <div className={`rounded-xl border ${getCategoryColor(milestone.category)} p-3`}>
                  <div className="mb-2 flex items-center gap-2">
                    {getCategoryIcon(milestone.category)}
                    <span className="text-xs uppercase tracking-wide">
                      {milestone.quarter}
                    </span>
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-[#0f1419] dark:text-white">
                    {milestone.title}
                  </h4>
                  <p className="mb-2 text-xs text-[#536471] dark:text-gray-400 line-clamp-2">
                    {milestone.description}
                  </p>
                  <div className="text-xs" title={`Impact Level: ${milestone.impact_level}/5`}>
                    {getImpactStars(milestone.impact_level)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredMilestones.length === 0 && (
        <div className="text-center py-12 text-[#536471]">
          <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No milestones recorded for {selectedYear} yet.</p>
          <p className="text-sm">History is being written...</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-[#536471]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Technology</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Landmark className="h-3.5 w-3.5 text-amber-400" />
          <span>Policy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-purple-400" />
          <span>Culture</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>⭐⭐⭐⭐⭐</span>
          <span>Impact Level</span>
        </div>
      </div>
    </div>
  );
}
