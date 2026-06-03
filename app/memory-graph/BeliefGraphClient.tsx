'use client';

import { useEffect, useState } from 'react';
import BeliefGraph from '@/components/belief-graph/BeliefGraph';

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

export default function BeliefGraphClient() {
  const [data, setData] = useState<{ nodes: BeliefNode[]; edges: BeliefEdge[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGraph() {
      try {
        const res = await fetch('/api/belief-graph');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load belief graph');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-gray-600 text-sm">Loading belief network...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-900 rounded-lg border border-gray-800">
        <div className="text-red-400 text-sm">{error || 'No data'}</div>
      </div>
    );
  }

  return <BeliefGraph data={data} />;
}
