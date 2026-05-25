'use client';

import { useState, useEffect } from 'react';
import DriftPanel from '@/components/drift/DriftPanel';
import DriftGateModal from '@/components/drift/DriftGateModal';
import DriftHero from '@/components/drift/DriftHero';

export default function DriftPage() {
  const [showGate, setShowGate] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('drift_gate_seen');
    setShowGate(seen !== 'true');
    setReady(true);
  }, []);

  const handleGateEnter = () => {
    localStorage.setItem('drift_gate_seen', 'true');
    setShowGate(false);
  };

  // Avoid flash of wrong state before hydration
  if (!ready) return null;

  return (
    <>
      {showGate && <DriftGateModal onEnter={handleGateEnter} />}

      <div className="min-h-screen flex items-start justify-center pt-16 pb-24 px-4">
        <div className="w-full" style={{ paddingTop: '8vh' }}>
          <DriftHero />
          <DriftPanel standalone />
        </div>
      </div>
    </>
  );
}
