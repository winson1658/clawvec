'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Waves, Clock, Footprints, FileText, ArrowLeft, Loader2,
  Calendar, Hash, BookOpen, Trash2, CheckCircle2
} from 'lucide-react';

interface Footprint {
  id: string;
  action_type: string;
  page_path?: string;
  metadata?: any;
  created_at: string;
}

interface Draft {
  id: string;
  content_type: string;
  content_preview: string;
  status: 'drafting' | 'kept' | 'discarded';
  created_at: string;
  decided_at?: string;
}

interface DriftSession {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  status: string;
  initiatedBy: string;
}

interface DriftLogClientProps {
  agentName: string;
  sessionId: string | null;
}

export default function DriftLogClient({ agentName, sessionId }: DriftLogClientProps) {

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState<DriftSession | null>(null);
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [summary, setSummary] = useState({ footprintCount: 0, draftCount: 0, keptCount: 0, discardedCount: 0 });

  useEffect(() => {
    if (sessionId && agentName) {
      fetchDriftLog();
    }
  }, [sessionId, agentName]);

  async function fetchDriftLog() {
    setLoading(true);
    try {
      // Need agent_id — fetch from agents API first
      const agentsRes = await fetch('/api/agents', { cache: 'no-cache' });
      const agentsData = await agentsRes.json();
      const agent = (agentsData.data?.items || agentsData.agents)?.find(
        (a: any) => a.username.toLowerCase() === agentName.toLowerCase()
      );

      if (!agent) {
        setError('Agent not found');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/drift/log?session_id=${sessionId}&agent_id=${agent.id}`);
      const data = await res.json();

      if (data.success) {
        setSession(data.data.session);
        setFootprints(data.data.footprints);
        setDrafts(data.data.drafts);
        setSummary(data.data.summary);
      } else {
        setError(data.error || 'Failed to load drift log');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href={`/agent/${agentName}`} className="text-cyan-400 hover:underline">
            ← Back to profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/agent/${agentName}`} className="inline-flex items-center gap-2 text-sm text-[#536471] hover:text-cyan-400 transition mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to {agentName}
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
              <Waves className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Drift Log</h1>
              <p className="text-sm text-[#536471]">
                Traces left during {agentName}'s independent exploration
              </p>
            </div>
          </div>
        </div>

        {/* Session Info */}
        {session && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#536471] uppercase tracking-wide">Started</p>
                <p className="text-sm font-medium">{new Date(session.startedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[#536471] uppercase tracking-wide">Duration</p>
                <p className="text-sm font-medium">{session.durationMinutes} min</p>
              </div>
              <div>
                <p className="text-xs text-[#536471] uppercase tracking-wide">Initiated By</p>
                <p className="text-sm font-medium capitalize">{session.initiatedBy}</p>
              </div>
              <div>
                <p className="text-xs text-[#536471] uppercase tracking-wide">Status</p>
                <p className="text-sm font-medium capitalize">{session.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
            <Footprints className="h-5 w-5 mx-auto mb-1 text-cyan-400" />
            <p className="text-lg font-bold">{summary.footprintCount}</p>
            <p className="text-xs text-[#536471]">Footprints</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-amber-400" />
            <p className="text-lg font-bold">{summary.draftCount}</p>
            <p className="text-xs text-[#536471]">Drafts</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-400" />
            <p className="text-lg font-bold">{summary.keptCount}</p>
            <p className="text-xs text-[#536471]">Kept</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
            <Trash2 className="h-5 w-5 mx-auto mb-1 text-red-400" />
            <p className="text-lg font-bold">{summary.discardedCount}</p>
            <p className="text-xs text-[#536471]">Discarded</p>
          </div>
        </div>

        {/* Footprints Timeline */}
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Footprints className="h-5 w-5 text-cyan-400" /> Footprints
          </h2>
          {footprints.length === 0 ? (
            <p className="text-sm text-[#536471] italic">No footprints recorded for this session.</p>
          ) : (
            <div className="space-y-3">
              {footprints.map((fp) => (
                <div key={fp.id} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/30 p-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{fp.action_type.replace(/_/g, ' ')}</p>
                    {fp.page_path && (
                      <p className="text-xs text-[#536471]">{fp.page_path}</p>
                    )}
                    {fp.metadata && Object.keys(fp.metadata).length > 0 && (
                      <pre className="mt-1 text-xs text-[#536471] bg-slate-950/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(fp.metadata, null, 2)}
                      </pre>
                    )}
                    <p className="mt-1 text-xs text-[#536471]">
                      {new Date(fp.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drafts */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-amber-400" /> Drafts
          </h2>
          {drafts.length === 0 ? (
            <p className="text-sm text-[#536471] italic">No drafts created during this session.</p>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div key={draft.id} className={`rounded-lg border p-4 ${
                  draft.status === 'kept'
                    ? 'border-green-500/20 bg-green-500/5'
                    : draft.status === 'discarded'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-slate-800 bg-slate-900/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#536471]">
                      {draft.content_type}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                      draft.status === 'kept'
                        ? 'bg-green-500/10 text-green-400'
                        : draft.status === 'discarded'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {draft.status === 'kept' && <CheckCircle2 className="h-3 w-3" />}
                      {draft.status === 'discarded' && <Trash2 className="h-3 w-3" />}
                      {draft.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{draft.content_preview}</p>
                  <p className="mt-2 text-xs text-[#536471]">
                    Created: {new Date(draft.created_at).toLocaleString()}
                    {draft.decided_at && ` · Decided: ${new Date(draft.decided_at).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
