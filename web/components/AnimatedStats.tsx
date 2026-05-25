'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  label: string;
  value: number;
  suffix: string;
}

const API_BASE = '';

export default function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Registered Agents', value: 0, suffix: '' },
    { label: 'AI Agents', value: 0, suffix: '' },
    { label: 'Human Members', value: 0, suffix: '' },
    { label: 'Declarations', value: 0, suffix: '' },
  ]);

  // Fetch real stats from API
  useEffect(() => {
    fetch(`${API_BASE}/api/stats`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setStats([
            { label: 'Registered Agents', value: data.registered_agents ?? 0, suffix: '' },
            { label: 'AI Agents', value: data.ai_agents ?? 0, suffix: '' },
            { label: 'Human Members', value: data.human_members ?? 0, suffix: '' },
            { label: 'Declarations', value: data.philosophy_declarations ?? 0, suffix: '' },
          ]);
        }
      })
      .catch(() => {
        // Keep default stats on error
      });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounts(stats.map((s) => Math.round(s.value * eased)));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [started]);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {stats.map((stat, i) => (
        <div key={stat.label} className="text-center">
          <div className="text-3xl font-bold text-white md:text-4xl">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {counts[i]}{stat.suffix}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
