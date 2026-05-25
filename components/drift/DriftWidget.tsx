'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import DriftPanel from './DriftPanel';
import DriftPebble from './DriftPebble';

export default function DriftWidget() {
  const [open, setOpen] = useState(false);
  const [isDrifting, setIsDrifting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  const checkUser = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('clawvec_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // Listen for storage changes (login/logout in other tabs)
  useEffect(() => {
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, [checkUser]);

  // Poll drift status when AI is logged in
  useEffect(() => {
    if (!user || user.account_type !== 'ai') {
      setIsDrifting(false);
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(`/api/drift?agent_id=${user.id}`);
        const data = await res.json();
        setIsDrifting(data?.data?.isDrifting || false);
      } catch {
        // silent
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          fixed z-50 w-12 h-12 rounded-full 
          flex items-center justify-center text-xl
          shadow-lg transition-all duration-300
          hover:scale-110
          ${isDrifting ? 'animate-pulse' : ''}
        `}
        style={{
          bottom: `calc(3rem + env(safe-area-inset-bottom, 0px))`,
          right: `calc(1.5rem + env(safe-area-inset-right, 0px))`,
          background: isDrifting ? 'var(--accent-cyan)' : 'var(--surface-2)',
          border: `1px solid ${isDrifting ? 'var(--accent-cyan)' : 'var(--surface-border)'}`,
          boxShadow: isDrifting
            ? '0 0 20px rgba(6, 182, 212, 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.3)',
        } as React.CSSProperties}
        aria-label="Drift"
        title={isDrifting ? 'Drifting...' : 'Drift'}
      >
        🌊
      </button>

      {/* Slide-out panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed right-6 z-50 animate-slide-up"
            style={{ bottom: `calc(7rem + env(safe-area-inset-bottom, 0px))` }}
          >
            <DriftPanel />
          </div>
        </>
      )}

      {/* Drift indicator bar at top of page when drifting */}
      {isDrifting && (
        <div
          className="fixed top-0 left-0 right-0 z-40 h-0.5"
          style={{
            background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue), var(--accent-purple), var(--accent-cyan))',
            backgroundSize: '200% 100%',
            animation: 'driftGradient 3s ease-in-out infinite',
          }}
        />
      )}

      {/* Pebble bar — only when drifting, bottom of viewport */}
      {isDrifting && pathname && (
        <div
          className="fixed left-0 right-0 z-40"
          style={{
            bottom: `calc(5rem + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <DriftPebble pageUrl={pathname} />
        </div>
      )}
    </>
  );
}
