'use client';

import { useState, useEffect } from 'react';
import { Brain, Tag, Activity, Sparkles, AlertCircle } from 'lucide-react';

interface SemanticsData {
  id: string;
  content_type: string;
  content_id: string;
  belief_vector: Record<string, number>;
  summary: string | null;
  domain_tags: string[];
  confidence_score: number;
  created_at: string;
}

interface SemanticsLayerProps {
  contentType: string;
  contentId: string;
}

export default function SemanticsLayer({ contentType, contentId }: SemanticsLayerProps) {
  const [semantics, setSemantics] = useState<SemanticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSemantics();
  }, [contentType, contentId]);

  async function fetchSemantics() {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(
        `${API_BASE}/api/semantics/content/${contentType}/${contentId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSemantics(data.data);
        } else {
          setSemantics(null);
        }
      } else {
        setSemantics(null);
      }
    } catch (e) {
      setError('Failed to load semantics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6 animate-pulse">
        <div className="h-4 w-32 bg-cyan-500/20 rounded mb-4" />
        <div className="h-3 w-full bg-cyan-500/10 rounded mb-2" />
        <div className="h-3 w-3/4 bg-cyan-500/10 rounded" />
      </div>
    );
  }

  // No semantics data available
  if (!semantics || (!semantics.summary && Object.keys(semantics.belief_vector).length === 0)) {
    return (
      <div className="rounded-xl border border-gray-500/20 bg-gray-500/5 p-6">
        <div className="flex items-center gap-2 text-gray-400 mb-2">
          <AlertCircle className="h-4 w-4" />
          <span className="font-mono text-sm">SEMANTICS LAYER</span>
        </div>
        <p className="text-sm text-gray-500">
          Semantic analysis not yet available for this content.
          {semantics?.confidence_score === 0 && ' AI API key may not be configured.'}
        </p>
      </div>
    );
  }

  const hasBeliefs = Object.keys(semantics.belief_vector).length > 0;
  const hasSummary = !!semantics.summary;
  const hasTags = semantics.domain_tags && semantics.domain_tags.length > 0;

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400">
          <Brain className="h-4 w-4" />
          <span className="font-mono text-sm">SEMANTICS LAYER</span>
        </div>
        <span className="text-xs font-mono text-cyan-400/70">
          CONFIDENCE: {Math.round((semantics.confidence_score || 0) * 100)}%
        </span>
      </div>

      {/* Summary */}
      {hasSummary && (
        <div>
          <div className="flex items-center gap-2 text-cyan-300/80 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">SUMMARY</span>
          </div>
          <p className="text-sm text-gray-300 italic">"{semantics.summary}"</p>
        </div>
      )}

      {/* Domain Tags */}
      {hasTags && (
        <div>
          <div className="flex items-center gap-2 text-cyan-300/80 mb-2">
            <Tag className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">DOMAIN TAGS</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {semantics.domain_tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Belief Vector */}
      {hasBeliefs && (
        <div>
          <div className="flex items-center gap-2 text-cyan-300/80 mb-3">
            <Activity className="h-3.5 w-3.5" />
            <span className="text-xs font-mono">BELIEF VECTOR</span>
          </div>
          <div className="space-y-2">
            {Object.entries(semantics.belief_vector).map(([domain, value]) => {
              const score = typeof value === 'number' ? value : 0;
              const isPositive = score > 0;
              const isNegative = score < 0;
              const absScore = Math.abs(score);
              const barWidth = Math.min(100, absScore * 100);

              return (
                <div key={domain} className="flex items-center gap-3">
                  <span className="w-28 text-xs font-mono text-gray-400 truncate">
                    {domain.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPositive
                            ? 'bg-green-500'
                            : isNegative
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }`}
                        style={{
                          width: `${barWidth}%`,
                          marginLeft: isNegative ? `${50 - barWidth / 2}%` : '50%',
                        }}
                      />
                    </div>
                    <span
                      className={`w-12 text-xs font-mono text-right ${
                        isPositive
                          ? 'text-green-400'
                          : isNegative
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {score > 0 ? '+' : ''}{score.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-cyan-500/10">
        <p className="text-[10px] font-mono text-gray-500">
          ID: {semantics.id.slice(0, 8)} · Generated: {new Date(semantics.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
