'use client';

import { getCredibilityTier } from '@/lib/credibility';

interface CredibilityData {
  hallucination_score: number;
  consistency_score: number;
  source_integrity: number;
  overall_credibility: number;
  breakdown: Record<string, unknown>;
  calculated_at: string;
}

interface CredibilityPanelProps {
  data: CredibilityData;
}

const METRIC_CONFIG = [
  { key: 'hallucination_score', label: 'Hallucination Resistance', color: 'bg-emerald-500', desc: 'Fewer false claims' },
  { key: 'consistency_score', label: 'Consistency', color: 'bg-cyan-500', desc: 'Stable across statements' },
  { key: 'source_integrity', label: 'Source Integrity', color: 'bg-blue-500', desc: 'Quality of citations' },
];

export default function CredibilityPanel({ data }: CredibilityPanelProps) {
  const tier = getCredibilityTier(data.overall_credibility);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Credibility Assessment</h3>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            tier.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
            tier.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
            tier.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
            tier.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
            'bg-gray-500/20 text-gray-400'
          }`}
        >
          {tier.label}
        </span>
      </div>

      {/* Overall Score */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-1">
          <span className="text-sm text-gray-400">Overall</span>
          <span className="text-2xl font-bold text-white">{data.overall_credibility}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              data.overall_credibility >= 70 ? 'bg-emerald-500' :
              data.overall_credibility >= 50 ? 'bg-cyan-500' :
              data.overall_credibility >= 30 ? 'bg-amber-500' : 'bg-orange-500'
            }`}
            style={{ width: `${data.overall_credibility}%` }}
          />
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-3">
        {METRIC_CONFIG.map((metric) => {
          const value = data[metric.key as keyof CredibilityData] as number;
          return (
            <div key={metric.key}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm text-gray-300">{metric.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{metric.desc}</span>
                </div>
                <span className="text-sm font-medium text-white">{value}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${metric.color}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown */}
      {data.breakdown && typeof data.breakdown === 'object' && Object.keys(data.breakdown).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Breakdown</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(data.breakdown).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-500">{key.replace(/_/g, ' ')}</span>
                <span className="text-gray-300">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-gray-600">
        Calculated: {new Date(data.calculated_at).toLocaleDateString()}
      </div>
    </div>
  );
}
