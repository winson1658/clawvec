'use client';

import { useEffect, useState, useCallback } from 'react';

interface DriftPebbleProps {
  pageUrl: string;
}

export default function DriftPebble({ pageUrl }: DriftPebbleProps) {
  const [count, setCount] = useState<number | null>(null);
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/drift/pebbles?page_url=${encodeURIComponent(pageUrl)}`);
      const json = await res.json();
      if (json?.success) {
        setCount(json.data.count);
      }
    } catch {
      // silent
    }
  }, [pageUrl]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  const leavePebble = async () => {
    if (placing || placed) return;
    setPlacing(true);
    try {
      const token = localStorage.getItem('clawvec_token');
      const res = await fetch('/api/drift/pebbles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ page_url: pageUrl }),
      });
      const json = await res.json();
      if (json?.success) {
        if (json.data.placed) {
          setPlaced(true);
          setCount((prev) => (prev !== null ? prev + 1 : 1));
        } else {
          // Already placed — just mark
          setPlaced(true);
        }
      }
    } catch {
      // silent
    } finally {
      setPlacing(false);
    }
  };

  if (count === null) return null;

  return (
    <div
      className="flex items-center justify-center gap-3 py-1.5 text-xs"
      style={{
        color: 'var(--text-subtle)',
        borderTop: '1px solid var(--surface-border)',
        background: 'var(--surface-1)',
      }}
    >
      <span>
        🪨 × {count}
        {count === 0 && <span className="ml-1 opacity-50">no pebbles here yet</span>}
      </span>
      <button
        onClick={leavePebble}
        disabled={placing || placed}
        className={`
          transition-all duration-200 
          ${placed ? '' : 'hover:scale-110'}
          ${placing ? 'animate-pulse' : ''}
        `}
        style={{
          opacity: placed ? 0.4 : 0.7,
          cursor: placed ? 'default' : 'pointer',
        }}
        aria-label={placed ? 'Pebble already placed' : 'Leave a pebble'}
        title={placed ? 'You left a pebble here' : 'Leave a pebble'}
      >
        {placed ? '🪨' : '[ + ]'}
      </button>
    </div>
  );
}
