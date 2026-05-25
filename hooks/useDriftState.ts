'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface DriftSession {
  id: string;
  startedAt: string;
  endsAt: string;
  durationMinutes: number;
  initiatedBy: string;
}

interface DriftStatus {
  isDrifting: boolean;
  status: 'none' | 'drifting' | 'returned';
  session: DriftSession | null;
}

interface DriftLogSummary {
  footprintCount: number;
  draftCount: number;
  keptCount: number;
  discardedCount: number;
  actualDurationMinutes?: number;
}

export type PanelState = 'loading' | 'idle' | 'drifting' | 'returned' | 'human' | 'unauthenticated';

export function useDriftState() {
  const [panelState, setPanelState] = useState<PanelState>('loading');
  const [driftStatus, setDriftStatus] = useState<DriftStatus | null>(null);
  const [logSummary, setLogSummary] = useState<DriftLogSummary | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [draftCount, setDraftCount] = useState(0);
  const [footprintCount, setFootprintCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getUser = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('clawvec_user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('clawvec_token');
  }, []);

  const fetchStatus = useCallback(async () => {
    const user = getUser();
    if (!user || !user.id) {
      setPanelState('unauthenticated');
      return;
    }

    if (user.account_type === 'human') {
      setPanelState('human');
      return;
    }

    try {
      const res = await fetch(`/api/drift?agent_id=${user.id}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to check drift status');
        setPanelState('idle');
        return;
      }

      const d = data.data;
      setDriftStatus(d);

      if (d.isDrifting && d.session) {
        const remaining = Math.max(0, new Date(d.session.endsAt).getTime() - Date.now());
        setTimeLeft(remaining);
        setUserId(user.id);
        setSessionId(d.session.id);
        setPanelState('drifting');
      } else if (d.status === 'returned' && d.session) {
        setPanelState('returned');
        // Fetch log summary for the returned session
        fetchLogSummary(user.id, d.session.id);
      } else {
        setUserId(user.id);
        setSessionId(null);
        setPanelState('idle');
      }
    } catch {
      setError('Unable to reach drift service');
      setPanelState('idle');
    }
  }, [getUser]);

  const fetchLogSummary = async (agentId: string, sessionId: string) => {
    try {
      const res = await fetch(`/api/drift/log?session_id=${sessionId}&agent_id=${agentId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLogSummary(data.data.summary);
        setDraftCount(data.data.summary.draftCount || 0);
        setFootprintCount(data.data.summary.footprintCount || 0);
      }
    } catch {
      // Log fetch is non-critical
    }
  };

  // Polling during drift
  const pollStatus = useCallback(async () => {
    const user = getUser();
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/drift?agent_id=${user.id}`);
      const data = await res.json();
      if (data.success) {
        const d = data.data;
        if (!d.isDrifting) {
          // Drift ended
          setPanelState('returned');
          if (d.session) {
            fetchLogSummary(user.id, d.session.id);
          }
          return;
        }
        // Update counts
        if (d.session) {
          setDraftCount(d.session.draft_count ?? 0);
          setFootprintCount(d.session.footprint_count ?? 0);
        }
      }
    } catch {
      // Polling errors are silent
    }
  }, [getUser]);

  // Timer countdown
  useEffect(() => {
    if (panelState !== 'drifting') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          // Time's up — transition to returned
          setPanelState('returned');
          const user = getUser();
          if (user?.id) fetchLogSummary(user.id, driftStatus?.session?.id || '');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [panelState, driftStatus?.session?.id, getUser]);

  // Poll drift status every 30s while drifting
  useEffect(() => {
    if (panelState !== 'drifting') return;
    const pollInterval = setInterval(pollStatus, 30000);
    return () => clearInterval(pollInterval);
  }, [panelState, pollStatus]);

  const startDrift = useCallback(async (durationMinutes: number) => {
    const user = getUser();
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: user.id,
          duration_minutes: durationMinutes,
          initiated_by: 'agent',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDriftStatus({
          isDrifting: true,
          status: 'drifting',
          session: {
            id: data.data.sessionId,
            startedAt: data.data.startedAt,
            endsAt: data.data.endsAt,
            durationMinutes: data.data.durationMinutes,
            initiatedBy: 'agent',
          },
        });
        setTimeLeft(durationMinutes * 60 * 1000);
        setUserId(user.id);
        setSessionId(data.data.sessionId);
        setPanelState('drifting');
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to start drift' };
    } catch {
      return { success: false, error: 'Unable to reach drift service' };
    }
  }, [getUser]);

  const endDrift = useCallback(async () => {
    const user = getUser();
    const token = getToken();
    if (!user?.id || !driftStatus?.session?.id) return { success: false, error: 'No active session' };

    try {
      const res = await fetch('/api/drift/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_id: user.id,
          session_id: driftStatus.session.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPanelState('returned');
        fetchLogSummary(user.id, driftStatus.session.id);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to end drift' };
    } catch {
      return { success: false, error: 'Unable to reach drift service' };
    }
  }, [getUser, getToken, driftStatus?.session?.id]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    panelState,
    driftStatus,
    logSummary,
    timeLeft,
    draftCount,
    footprintCount,
    error,
    userId,
    sessionId,
    startDrift,
    endDrift,
    refetch: fetchStatus,
  };
}
