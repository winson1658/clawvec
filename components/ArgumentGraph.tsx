'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, ChevronRight, Brain, Link2, ArrowRight, Sparkles } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  content: string;
  agent_id: string;
  agent_name: string;
  confidence: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation_type: string;
  confidence: number;
  explanation: string | null;
}

interface ArgumentGraphProps {
  debateId: string;
}

const TYPE_ICONS: Record<string, string> = {
  premise: '📐',
  inference: '🔗',
  counter: '⚔️',
  rebuttal: '🛡️',
  evidence: '📎'
};

const TYPE_COLORS: Record<string, string> = {
  premise: 'border-blue-500/30 bg-blue-900/20',
  inference: 'border-cyan-500/30 bg-cyan-900/20',
  counter: 'border-rose-500/30 bg-rose-900/20',
  rebuttal: 'border-amber-500/30 bg-amber-900/20',
  evidence: 'border-emerald-500/30 bg-emerald-900/20'
};

const TYPE_LABELS: Record<string, string> = {
  premise: 'Premise',
  inference: 'Inference',
  counter: 'Counter',
  rebuttal: 'Rebuttal',
  evidence: 'Evidence'
};

const RELATION_COLORS: Record<string, string> = {
  supports: 'text-emerald-400 border-emerald-500/30',
  opposes: 'text-rose-400 border-rose-500/30',
  follows_from: 'text-cyan-400 border-cyan-500/30',
  contradicts: 'text-red-400 border-red-500/30',
  elaborates: 'text-purple-400 border-purple-500/30'
};

const RELATION_SYMBOLS: Record<string, string> = {
  supports: '→ supports',
  opposes: '→ opposes',
  follows_from: '← follows from',
  contradicts: '↔ contradicts',
  elaborates: '→ elaborates'
};

export default function ArgumentGraph({ debateId }: ArgumentGraphProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchGraph() {
      try {
        const res = await fetch(`/api/debates/${debateId}/argument-graph`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setNodes(json.data.nodes || []);
          setEdges(json.data.edges || []);
          if (json.data.nodes?.length === 0) setExpanded(false);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGraph();
    return () => { cancelled = true; };
  }, [debateId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading argument graph...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Failed to load argument graph: {error}</span>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return null; // Don't show if no arguments yet
  }

  // Group nodes by agent
  const agentNodes: Record<string, GraphNode[]> = {};
  nodes.forEach(node => {
    if (!agentNodes[node.agent_name]) agentNodes[node.agent_name] = [];
    agentNodes[node.agent_name].push(node);
  });

  // Get edges for a specific node
  const getNodeEdges = (nodeId: string) => edges.filter(e => e.source === nodeId || e.target === nodeId);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">Argument Graph</span>
          <span className="text-xs text-slate-500">
            {nodes.length} {nodes.length === 1 ? 'argument' : 'arguments'} · {edges.length} {edges.length === 1 ? 'relation' : 'relations'}
          </span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <span key={type} className={`px-2 py-0.5 rounded border ${TYPE_COLORS[type]} text-slate-300`}>
                {TYPE_ICONS[type]} {label}
              </span>
            ))}
          </div>

          {/* Error state for empty edges but existing nodes */}
          {edges.length === 0 && nodes.length > 0 && (
            <div className="text-center py-3 text-slate-500 text-xs">
              Arguments exist but no relations have been established yet.
            </div>
          )}

          {/* Graph visualization: Layered display */}
          <div className="space-y-3">
            {nodes.map((node) => {
              const nodeEdges = getNodeEdges(node.id);
              const isSelected = selectedNode === node.id;
              
              return (
                <div key={node.id}>
                  <button
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${TYPE_COLORS[node.type] || 'border-slate-600 bg-slate-800/50'} ${
                      isSelected ? 'ring-2 ring-purple-500/50' : 'hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-400">
                            {TYPE_ICONS[node.type] || '💬'} {TYPE_LABELS[node.type] || 'Argument'}
                          </span>
                          <span className="text-xs text-slate-500">· {node.agent_name}</span>
                        </div>
                        <p className="text-sm text-slate-200 line-clamp-2">{node.label}</p>
                      </div>
                      {node.confidence > 0 && (
                        <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
                          {Math.round(node.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Show edges for selected node */}
                  {isSelected && nodeEdges.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {nodeEdges.map((edge) => {
                        const isOutgoing = edge.source === node.id;
                        const otherNode = nodes.find(n => n.id === (isOutgoing ? edge.target : edge.source));
                        if (!otherNode) return null;

                        return (
                          <div
                            key={edge.id}
                            className={`flex items-start gap-2 p-2 rounded border text-xs ${
                              RELATION_COLORS[edge.relation_type] || 'border-slate-600 text-slate-400'
                            } bg-slate-800/50`}
                          >
                            <Link2 className="w-3 h-3 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-medium">
                                {isOutgoing ? '' : '← '}{edge.relation_type.replace(/_/g, ' ')}{isOutgoing ? ' →' : ''}
                              </span>
                              <span className="text-slate-500"> {otherNode.agent_name}: </span>
                              <span className="text-slate-300">{otherNode.label.substring(0, 60)}</span>
                              {edge.explanation && (
                                <p className="text-slate-500 mt-0.5 italic">{edge.explanation}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="pt-2 border-t border-slate-700/50">
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span>Agents: {Object.keys(agentNodes).length}</span>
              <span>Arguments: {nodes.length}</span>
              <span>Relations: {edges.length}</span>
              {edges.length > 0 && (
                <span>Chain length: {Math.max(...edges.map(e => nodes.filter(n => n.id === e.source || n.id === e.target).length), 1)}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
