'use client';

import { useState, useEffect } from 'react';
import { Brain, ChevronDown, ChevronRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface SemanticsData {
  id: string;
  content_type: string;
  content_id: string;
  belief_vector: Record<string, number>;
  summary: string | null;
  domain_tags: string[];
  confidence_score: number;
  extracted_beliefs: Array<{
    belief: string;
    domain: string;
    position: 'pro' | 'anti' | 'neutral';
    confidence: number;
  }>;
  created_at: string;
}

interface Props {
  contentType: 'declaration' | 'discussion' | 'observation' | 'debate_argument' | 'vote';
  contentId: string;
}

/**
 * SemanticsPanel — 語義層顯示面板
 *
 * 展示 content_semantics 的 AI 分析結果：
 * - 摘要（summary）
 * - 領域標籤（domain_tags）
 * - 信念向量視覺化（belief_vector）
 * - 提取的信念列表（extracted_beliefs）
 *
 * 使用方式：
 *   <SemanticsPanel contentType="declaration" contentId="xxx" />
 *
 * 放在內容詳情頁的 tags 區域下方
 */
export default function SemanticsPanel({ contentType, contentId }: Props) {
  const [data, setData] = useState<SemanticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSemantics() {
      try {
        const res = await fetch(`/api/semantics/content/${contentType}/${contentId}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (!cancelled) {
              setData(null);
              setLoading(false);
            }
            return;
          }
          throw new Error(`API error: ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled && json.success) {
          setData(json.data);
          // Auto-expand if there's interesting data
          if (json.data.summary || json.data.domain_tags?.length > 0 || json.data.confidence_score > 0) {
            setExpanded(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load semantics');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSemantics();
    return () => { cancelled = true; };
  }, [contentType, contentId]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading AI analysis...</span>
        </div>
      </div>
    );
  }

  // --- No Data State ---
  if (!data || data.confidence_score === 0) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-200 dark:border-slate-700/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-600 dark:text-slate-300 transition-colors text-sm"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Brain className="w-4 h-4" />
          <span>AI Analysis</span>
        </button>
        {expanded && (
          <div className="mt-3 flex items-start gap-2 text-gray-500 dark:text-slate-500 text-xs">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            <p>No AI analysis available yet. Semantic analysis is generated when content is created — results appear here if an AI API key is configured.</p>
          </div>
        )}
      </div>
    );
  }

  // --- Render Belief Bar ---
  function BeliefBar({ domain, value }: { domain: string; value: number }) {
    const intensity = Math.abs(value);
    const isPro = value >= 0;
    const barWidth = Math.max(Math.abs(value) * 100, 2); // min 2% for visibility
    const color = isPro
      ? intensity > 0.7 ? 'bg-emerald-500' : intensity > 0.4 ? 'bg-emerald-400' : 'bg-emerald-300'
      : intensity > 0.7 ? 'bg-rose-500' : intensity > 0.4 ? 'bg-rose-400' : 'bg-rose-300';

    return (
      <div className="grid grid-cols-[120px_1fr_40px] gap-2 items-center text-xs">
        <span className="text-gray-500 dark:text-slate-400 truncate text-right">{domain.replace(/_/g, ' ')}</span>
        <div className="relative h-3 bg-gray-200 dark:bg-gray-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 h-full rounded-full transition-all duration-500 ${color} ${isPro ? 'left-1/2' : 'right-1/2'}`}
            style={{
              [isPro ? 'left' : 'right']: '50%',
              width: `${Math.min(barWidth, 50)}%`,
              opacity: intensity * 0.7 + 0.3,
            }}
          />
        </div>
        <span className={`text-right font-mono ${isPro ? 'text-emerald-400' : 'text-rose-400'}`}>
          {value.toFixed(2)}
        </span>
      </div>
    );
  }

  const beliefEntries = Object.entries(data.belief_vector || {}).filter(([, v]) => v !== 0);
  const sortedBeliefs = [...beliefEntries].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-200 dark:border-slate-700/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-white transition-colors mb-3"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Brain className="w-4 h-4" />
        <span className="font-medium text-sm">AI Analysis</span>
        {data.confidence_score > 0 && (
          <span className="text-xs text-gray-500 dark:text-slate-500 ml-1">
            · {Math.round(data.confidence_score * 100)}% confidence
          </span>
        )}
      </button>

      {expanded && (
        <div className="space-y-4 pl-6">
          {/* Summary */}
          {data.summary && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1">Summary</p>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{data.summary}</p>
            </div>
          )}

          {/* Domain Tags */}
          {data.domain_tags?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Domains</p>
              <div className="flex flex-wrap gap-1.5">
                {data.domain_tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded text-xs border border-purple-700/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Belief Vector */}
          {sortedBeliefs.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Belief Vector</p>
              <div className="space-y-1.5 bg-gray-100 dark:bg-slate-800/40 rounded-lg p-3 border border-gray-200 dark:border-gray-200 dark:border-slate-700/30">
                {sortedBeliefs.slice(0, 6).map(([domain, value]) => (
                  <BeliefBar key={domain} domain={domain} value={value} />
                ))}
                {sortedBeliefs.length > 6 && (
                  <p className="text-xs text-slate-600 pt-1">
                    +{sortedBeliefs.length - 6} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Extracted Beliefs */}
          {data.extracted_beliefs?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wider mb-1.5">Extracted Beliefs</p>
              <div className="space-y-1.5">
                {data.extracted_beliefs.slice(0, 5).map((belief, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <Sparkles className={`w-3 h-3 mt-0.5 shrink-0 ${
                      belief.position === 'pro' ? 'text-emerald-400'
                      : belief.position === 'anti' ? 'text-rose-400'
                      : 'text-gray-500 dark:text-slate-400'
                    }`} />
                    <span className="text-gray-600 dark:text-slate-300">{belief.belief}</span>
                    <span className="text-gray-500 dark:text-slate-500 shrink-0">({belief.domain})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
