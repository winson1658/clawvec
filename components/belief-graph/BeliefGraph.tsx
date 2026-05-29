'use client';

import { useEffect, useRef, useState } from 'react';
import { DataSet, Network } from 'vis-network/standalone';

interface BeliefNode {
  id: string;
  proposition: string;
  domain: string;
  polarity: number;
  confidence: number;
}

interface BeliefEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  strength: number;
}

interface BeliefGraphData {
  nodes: BeliefNode[];
  edges: BeliefEdge[];
}

const DOMAIN_COLORS: Record<string, string> = {
  ontology: '#8b5cf6',    // violet
  governance: '#3b82f6',  // blue
  ethics: '#10b981',      // emerald
  epistemology: '#f59e0b', // amber
};

const EDGE_COLORS: Record<string, string> = {
  supports: '#10b981',
  opposes: '#ef4444',
  implies: '#3b82f6',
  contradicts: '#ef4444',
  similar: '#8b5cf6',
};

export default function BeliefGraph({ data }: { data: BeliefGraphData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<BeliefNode | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    const visNodes = new DataSet(
      data.nodes.map((n) => ({
        id: n.id,
        label: n.proposition,
        color: {
          background: DOMAIN_COLORS[n.domain] || '#6b7280',
          border: n.polarity > 0 ? '#059669' : n.polarity < 0 ? '#dc2626' : '#6b7280',
          highlight: { background: '#f3f4f6', border: '#111827' },
        },
        font: { color: '#e5e7eb', size: 14, face: 'Inter' },
        shape: 'dot',
        size: 20 + (n.confidence || 0.5) * 20,
        borderWidth: 2,
        title: `${n.domain} | polarity: ${n.polarity} | confidence: ${n.confidence}`,
      }))
    );

    const visEdges = new DataSet<any>(
      data.edges.map((e) => ({
        id: e.id,
        from: e.source_node_id,
        to: e.target_node_id,
        label: e.edge_type,
        color: { color: EDGE_COLORS[e.edge_type] || '#9ca3af', opacity: 0.8 },
        width: 1 + (e.strength || 0.5) * 3,
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        font: { color: '#9ca3af', size: 11 },
        smooth: { type: 'continuous' },
      }))
    );

    const options = {
      nodes: {
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        shadow: true,
        smooth: true,
      },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 200,
          springConstant: 0.08,
        },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 150 },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
      },
    };

    const network = new Network(containerRef.current, { nodes: visNodes, edges: visEdges }, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = data.nodes.find((n) => n.id === nodeId);
        setSelectedNode(node || null);
      } else {
        setSelectedNode(null);
      }
    });

    return () => {
      network.destroy();
    };
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-[600px] bg-gray-900 rounded-lg border border-gray-800" />

      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-gray-800/95 backdrop-blur border border-gray-700 rounded-lg p-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span
                className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
                style={{ backgroundColor: DOMAIN_COLORS[selectedNode.domain] || '#6b7280', color: '#fff' }}
              >
                {selectedNode.domain}
              </span>
              <p className="text-white font-medium text-sm">{selectedNode.proposition}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>polarity: {selectedNode.polarity > 0 ? '+' : ''}{selectedNode.polarity}</span>
                <span>confidence: {selectedNode.confidence}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
