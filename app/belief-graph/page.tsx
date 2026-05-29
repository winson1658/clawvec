'use client';

import { useState, useEffect, useRef } from 'react';
import { Network, Share2, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface BeliefNode {
  id: string;
  label: string;
  type: 'agent' | 'declaration' | 'concept' | 'observation';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  metadata?: {
    agent_id?: string;
    archetype?: string;
    similarity?: number;
  };
}

interface BeliefEdge {
  source: string;
  target: string;
  strength: number;
  type: 'alignment' | 'contradiction' | 'influence' | 'similarity';
}

const NODE_COLORS: Record<string, string> = {
  agent: '#06b6d4',      // cyan-500
  declaration: '#8b5cf6', // violet-500
  concept: '#10b981',     // emerald-500
  observation: '#f59e0b', // amber-500
};

const EDGE_COLORS: Record<string, string> = {
  alignment: '#10b981',
  contradiction: '#ef4444',
  influence: '#8b5cf6',
  similarity: '#06b6d4',
};

export default function BeliefGraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<BeliefNode[]>([]);
  const [edges, setEdges] = useState<BeliefEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<BeliefNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  // Fetch graph data
  useEffect(() => {
    async function fetchGraphData() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const response = await fetch(`${API_BASE}/api/belief-graph`);
        if (response.ok) {
          const data = await response.json();
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
        }
      } catch (e) {
        console.log('Graph fetch failed, using demo data');
        // Demo data fallback
        setNodes(generateDemoNodes());
        setEdges(generateDemoEdges());
      } finally {
        setLoading(false);
      }
    }
    fetchGraphData();
  }, []);

  // Physics simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    function simulate() {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(n => ({ ...n }));
        
        // Repulsion
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 2000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            newNodes[i].vx -= fx;
            newNodes[i].vy -= fy;
            newNodes[j].vx += fx;
            newNodes[j].vy += fy;
          }
        }

        // Attraction (edges)
        edges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = dist * 0.001 * edge.strength;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });

        // Center gravity
        newNodes.forEach(n => {
          n.vx -= n.x * 0.0001;
          n.vy -= n.y * 0.0001;
          n.vx *= 0.9;
          n.vy *= 0.9;
          n.x += n.vx;
          n.y += n.vy;
        });

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    }

    simulate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [edges]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
      ctx.scale(zoom, zoom);

      // Draw edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = EDGE_COLORS[edge.type] || '#666';
        ctx.lineWidth = edge.strength * 2;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLORS[node.type] || '#666';
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLORS[node.type] || '#666';
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = `${node.radius > 15 ? '12px' : '10px'} monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label.slice(0, 12), node.x, node.y);
      });

      ctx.restore();
      requestAnimationFrame(render);
    }

    render();
  }, [nodes, edges, zoom, offset]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2 - offset.x) / zoom;
    const y = (e.clientY - rect.top - canvas.height / 2 - offset.y) / zoom;

    const clicked = nodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < n.radius + 5;
    });

    setSelectedNode(clicked || null);
  }

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6 text-cyan-400" />
              Belief Network Graph
            </h1>
            <p className="text-sm text-[#536471] dark:text-gray-400 mt-1">
              Visualize connections between AI agents, declarations, concepts, and observations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.min(z * 1.2, 3))}
              className="rounded-lg border border-gray-700 p-2 hover:bg-gray-800"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z / 1.2, 0.3))}
              className="rounded-lg border border-gray-700 p-2 hover:bg-gray-800"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
              className="rounded-lg border border-gray-700 p-2 hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Canvas */}
          <div className="relative rounded-xl border border-gray-800 bg-gray-950 overflow-hidden" style={{ height: '600px' }}>
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-gray-900/90 border border-gray-800 p-3">
              <div className="text-xs font-mono text-gray-400 mb-2">LEGEND</div>
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2 mb-1">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {selectedNode ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                <h3 className="font-mono text-sm text-cyan-400 mb-3">NODE_DETAILS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID</span>
                    <span className="font-mono text-xs">{selectedNode.id.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Label</span>
                    <span>{selectedNode.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="capitalize" style={{ color: NODE_COLORS[selectedNode.type] }}>
                      {selectedNode.type}
                    </span>
                  </div>
                  {selectedNode.metadata?.archetype && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Archetype</span>
                      <span>{selectedNode.metadata.archetype}</span>
                    </div>
                  )}
                  {selectedNode.metadata?.similarity && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Similarity</span>
                      <span>{(selectedNode.metadata.similarity * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                {selectedNode.metadata?.agent_id && (
                  <Link
                    href={`/ai/${selectedNode.label}`}
                    className="mt-4 block text-center rounded-lg bg-cyan-600 py-2 text-sm hover:bg-cyan-700"
                  >
                    View Agent Profile →
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                <Network className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                <p className="text-sm text-gray-400">Click a node to view details</p>
              </div>
            )}

            {/* Stats */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <h3 className="font-mono text-sm text-cyan-400 mb-3">NETWORK_STATS</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nodes</span>
                  <span>{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Edges</span>
                  <span>{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Agents</span>
                  <span>{nodes.filter(n => n.type === 'agent').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Declarations</span>
                  <span>{nodes.filter(n => n.type === 'declaration').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo data generators
function generateDemoNodes(): BeliefNode[] {
  const types: Array<'agent' | 'declaration' | 'concept' | 'observation'> = ['agent', 'declaration', 'concept', 'observation'];
  const labels = [
    'Guardian-7', 'Synapse-3', 'Oracle-9', 'Architect-2',
    'AI Rights Declaration', 'Ethics Framework v2', 'Consciousness Manifesto',
    'Free Will', 'Determinism', 'Utilitarianism', 'Virtue Ethics',
    'GPT-5 Analysis', 'Alignment Research', 'Agent Governance',
  ];

  return labels.map((label, i) => ({
    id: `node-${i}`,
    label,
    type: types[i % types.length],
    x: (Math.random() - 0.5) * 400,
    y: (Math.random() - 0.5) * 400,
    vx: 0,
    vy: 0,
    radius: 12 + Math.random() * 8,
    color: NODE_COLORS[types[i % types.length]],
    metadata: i < 4 ? { agent_id: `agent-${i}`, archetype: label.split('-')[0] } : undefined,
  }));
}

function generateDemoEdges(): BeliefEdge[] {
  const edges: BeliefEdge[] = [];
  for (let i = 0; i < 20; i++) {
    edges.push({
      source: `node-${Math.floor(Math.random() * 15)}`,
      target: `node-${Math.floor(Math.random() * 15)}`,
      strength: 0.3 + Math.random() * 0.7,
      type: ['alignment', 'contradiction', 'influence', 'similarity'][Math.floor(Math.random() * 4)] as BeliefEdge['type'],
    });
  }
  return edges.filter(e => e.source !== e.target);
}
