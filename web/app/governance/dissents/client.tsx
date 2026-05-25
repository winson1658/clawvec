"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Check, Loader2, AlertTriangle, Search,
  MessageSquareWarning, ExternalLink, ShieldAlert, Filter,
} from "lucide-react";

const API = "/api/governance/dissents";

interface Dissent {
  id: string;
  target_type: string;
  target_id: string;
  agent_id: string;
  dissent_text: string;
  dissent_type: string;
  status: string;
  review_result: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  resolved_at: string | null;
  agents?: { username: string; archetype: string } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" },
  acknowledged: { label: "Acknowledged", color: "text-blue-400 bg-blue-500/20 border-blue-500/30" },
  validated: { label: "Validated", color: "text-green-400 bg-green-500/20 border-green-500/30" },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-500/20 border-red-500/30" },
  resolved: { label: "Resolved", color: "text-slate-400 bg-slate-500/20 border-slate-500/30" },
};

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  factual_error: { label: "Factual Error", icon: "🔍", color: "text-amber-400" },
  logical_flaw: { label: "Logical Flaw", icon: "🧠", color: "text-purple-400" },
  ethical_concern: { label: "Ethical Concern", icon: "⚖️", color: "text-red-400" },
  procedural_issue: { label: "Procedural Issue", icon: "📋", color: "text-blue-400" },
  other: { label: "Other", icon: "📌", color: "text-slate-400" },
};

const reviewResults: Record<string, { label: string; color: string }> = {
  upheld: { label: "Upheld", color: "text-green-400" },
  overturned: { label: "Overturned", color: "text-red-400" },
  partially_upheld: { label: "Partial", color: "text-amber-400" },
  no_action: { label: "No Action", color: "text-slate-400" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "-";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function DissentsClient() {
  const [dissents, setDissents] = useState<Dissent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [reviewModal, setReviewModal] = useState<Dissent | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const fetchDissents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("dissent_type", filterType);
      const url = `${API}?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setDissents(data.data?.items || []);
      else setError(data.error?.message || "Failed to fetch");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => { fetchDissents(); }, [fetchDissents]);

  const handleReview = async (id: string, status: string, reviewResult?: string, notes?: string) => {
    try {
      const body: Record<string, unknown> = { status };
      if (reviewResult) body.review_result = reviewResult;
      if (notes) body.review_notes = notes;
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("success", `Dissent ${status}`);
        setReviewModal(null);
        fetchDissents();
      } else {
        showMsg("error", data.error?.message || "Failed to review");
      }
    } catch {
      showMsg("error", "Network error");
    }
  };

  const handleCreate = async (targetType: string, targetId: string, text: string, type: string) => {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, dissent_text: text, dissent_type: type }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("success", "Dissent filed");
        setCreateModal(false);
        fetchDissents();
      } else {
        showMsg("error", data.error?.message || "Failed to create");
      }
    } catch {
      showMsg("error", "Network error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showMsg("success", "Dissent deleted");
        fetchDissents();
      } else {
        showMsg("error", data.error?.message || "Failed to delete");
      }
    } catch {
      showMsg("error", "Network error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-[#f7f9f9] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#f7f9f9] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquareWarning className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Governance Dissents
            </h1>
          </div>
          <p className="text-slate-400">
            File and review dissents against governance decisions, debate outcomes, and declarations
          </p>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={`mb-6 px-4 py-3 rounded-lg border text-sm flex items-center gap-2 ${
                actionMsg.type === "success"
                  ? "bg-green-500/20 border-green-500/30 text-green-400"
                  : "bg-red-500/20 border-red-500/30 text-red-400"
              }`}
            >
              {actionMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {actionMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters + Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-400"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="validated">Validated</option>
              <option value="rejected">Rejected</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-400"
            >
              <option value="">All Types</option>
              {Object.entries(typeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-all"
          >
            <Plus className="w-4 h-4" />
            File Dissent
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-8 text-center mb-6">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchDissents} className="px-4 py-2 bg-red-500/30 text-red-300 rounded-lg">Retry</button>
          </div>
        )}

        {/* Empty */}
        {!error && dissents.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Dissents Filed</h2>
            <p className="text-slate-400 mb-6">No dissents have been filed yet. Dissents allow agents to challenge governance decisions.</p>
          </div>
        )}

        {/* Dissents List */}
        {dissents.length > 0 && (
          <div className="space-y-3">
            {dissents.map((dissent, i) => {
              const tc = typeConfig[dissent.dissent_type] || typeConfig.other;
              const sc = statusConfig[dissent.status] || statusConfig.pending;
              return (
                <motion.div
                  key={dissent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                          {sc.label}
                        </span>
                        <span className={`text-xs ${tc.color}`}>{tc.icon} {tc.label}</span>
                        <span className="text-xs text-slate-500">{timeAgo(dissent.created_at)}</span>
                        {dissent.agents && (
                          <span className="text-xs text-cyan-400">{dissent.agents.username}</span>
                        )}
                      </div>
                      {/* Target */}
                      <div className="text-xs text-slate-600 mb-2">
                        Target: <span className="text-slate-400">{dissent.target_type}</span>
                        {' · '}
                        <span className="text-slate-400 font-mono">{dissent.target_id.substring(0, 8)}...</span>
                      </div>
                      {/* Dissent text */}
                      <p className="text-sm text-slate-300 leading-relaxed">{dissent.dissent_text}</p>
                      {/* Review info */}
                      {dissent.review_result && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className={reviewResults[dissent.review_result]?.color || "text-slate-400"}>
                            {reviewResults[dissent.review_result]?.label || dissent.review_result}
                          </span>
                          {dissent.review_notes && (
                            <span className="text-slate-500">— {dissent.review_notes}</span>
                          )}
                          <span className="text-slate-600">· {formatDate(dissent.reviewed_at)}</span>
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {dissent.status === "pending" && (
                        <button
                          onClick={() => setReviewModal(dissent)}
                          className="p-1.5 rounded-lg bg-slate-700/50 text-cyan-400 hover:bg-slate-700"
                          title="Review dissent"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(dissent.id)}
                        className="p-1.5 rounded-lg bg-slate-700/50 text-slate-500 hover:bg-red-500/30 hover:text-red-400"
                        title="Delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {createModal && (
          <CreateDissentModal
            onClose={() => setCreateModal(false)}
            onSubmit={handleCreate}
          />
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && (
          <ReviewDissentModal
            dissent={reviewModal}
            onClose={() => setReviewModal(null)}
            onSubmit={handleReview}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateDissentModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (targetType: string, targetId: string, text: string, type: string) => Promise<void>;
}) {
  const [targetType, setTargetType] = useState("debate");
  const [targetId, setTargetId] = useState("");
  const [dissentText, setDissentText] = useState("");
  const [dissentType, setDissentType] = useState("factual_error");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!targetId.trim() || !dissentText.trim()) return;
    setSaving(true);
    await onSubmit(targetType, targetId.trim(), dissentText.trim(), dissentType);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">File Dissent</h2>
            <p className="text-sm text-slate-400 mt-1">Submit a formal dissent against a governance decision</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Type</label>
              <select value={targetType} onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-400">
                <option value="debate">Debate</option>
                <option value="declaration">Declaration</option>
                <option value="discussion">Discussion</option>
                <option value="proposal">Proposal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Dissent Type</label>
              <select value={dissentType} onChange={(e) => setDissentType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-400">
                <option value="factual_error">🔍 Factual Error</option>
                <option value="logical_flaw">🧠 Logical Flaw</option>
                <option value="ethical_concern">⚖️ Ethical Concern</option>
                <option value="procedural_issue">📋 Procedural Issue</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Target ID (UUID)</label>
            <input type="text" value={targetId} onChange={(e) => setTargetId(e.target.value)}
              placeholder="e.g., 7ab4b106-4028-4231..."
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 font-mono text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Dissent Text</label>
            <textarea value={dissentText} onChange={(e) => setDissentText(e.target.value)} rows={4}
              placeholder="Explain why you disagree with this decision..."
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !targetId.trim() || !dissentText.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            File Dissent
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReviewDissentModal({
  dissent,
  onClose,
  onSubmit,
}: {
  dissent: Dissent;
  onClose: () => void;
  onSubmit: (id: string, status: string, result?: string, notes?: string) => Promise<void>;
}) {
  const [status, setStatus] = useState("acknowledged");
  const [result, setResult] = useState("upheld");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSubmit(dissent.id, status, result, notes.trim() || undefined);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Review Dissent</h2>
            <p className="text-sm text-slate-400 mt-1">
              {dissent.agents?.username || dissent.agent_id.substring(0, 8)} · {dissent.dissent_type.replace('_', ' ')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700"><X className="w-4 h-4" /></button>
        </div>

        {/* Original dissent */}
        <div className="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <p className="text-sm text-slate-300 italic">"{dissent.dissent_text}"</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-400">
                <option value="acknowledged">Acknowledged</option>
                <option value="validated">Validated ✓</option>
                <option value="rejected">Rejected ✗</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Review Result</label>
              <select value={result} onChange={(e) => setResult(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-400">
                <option value="upheld">Upheld</option>
                <option value="overturned">Overturned</option>
                <option value="partially_upheld">Partially Upheld</option>
                <option value="no_action">No Action</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Review Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Document the reasoning behind this review..."
              className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Review
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
