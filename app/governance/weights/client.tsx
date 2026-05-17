"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit3, X, Check, Loader2, AlertTriangle,
  Power, PowerOff, ChevronDown, ChevronUp, Eye, FunctionSquare,
} from "lucide-react";

const API = "/api/governance/weight-rules";

interface WeightRule {
  id: string;
  rule_name: string;
  description: string | null;
  domain_category: string | null;
  domain_tags: string[];
  weight_formula: string;
  formula_params: Record<string, unknown>;
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
  reset_on_vote: boolean;
  created_at: string;
  updated_at: string;
}

const formulaLabels: Record<string, string> = {
  linear: "Linear",
  logarithmic: "Logarithmic",
  sigmoid: "Sigmoid (S-Curve)",
  tiered: "Tiered",
  custom: "Custom",
};

const formulaDescriptions: Record<string, string> = {
  linear: "weight = base + score × factor (capped)",
  logarithmic: "weight = base + ln(score+1) × factor (capped)",
  sigmoid: "Sigmoid curve: gradual increase around midpoint",
  tiered: "Discrete tiers based on score thresholds",
  custom: "Custom formula expression",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function previewCurve(rule: WeightRule): { score: number; weight: number }[] {
  const scores = [0, 10, 50, 100, 200, 500, 1000, 2000, 5000];
  const params = rule.formula_params;
  const base = (params.base as number) || 1.0;
  const cap = (params.cap as number) || 10.0;

  return scores.map((score) => {
    let weight: number;
    switch (rule.weight_formula) {
      case "linear": {
        const factor = (params.factor as number) || 0.01;
        weight = Math.min(base + score * factor, cap);
        break;
      }
      case "logarithmic": {
        const factor = (params.factor as number) || 0.5;
        weight = Math.min(base + Math.log(score + 1) * factor, cap);
        break;
      }
      case "sigmoid": {
        const k = (params.k as number) || 0.005;
        const mid = (params.midpoint as number) || 500;
        const min = (params.min as number) || 1.0;
        const max = (params.max as number) || 10.0;
        const sig = 1 / (1 + Math.exp(-k * (score - mid)));
        weight = min + (max - min) * sig;
        break;
      }
      case "tiered": {
        const thresholds = (params.thresholds as number[]) || [0, 100, 500, 1000, 5000];
        const weights = (params.weights as number[]) || [1, 2, 3, 5, 10];
        let w = weights[0];
        for (let i = thresholds.length - 1; i >= 0; i--) {
          if (score >= thresholds[i]) { w = weights[i]; break; }
        }
        weight = w;
        break;
      }
      default:
        weight = 1;
    }
    return { score, weight: Math.round(weight * 100) / 100 };
  });
}

function ParamEditor({
  params,
  formula,
  onChange,
}: {
  params: Record<string, unknown>;
  formula: string;
  onChange: (p: Record<string, unknown>) => void;
}) {
  const set = (key: string, val: number | boolean | string | number[]) => {
    onChange({ ...params, [key]: val });
  };

  if (formula === "linear") {
    return (
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Base</label><input type="number" step="0.1" value={(params.base as number) ?? 1} onChange={(e) => set("base", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Factor</label><input type="number" step="0.001" value={(params.factor as number) ?? 0.01} onChange={(e) => set("factor", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Cap</label><input type="number" step="0.1" value={(params.cap as number) ?? 10} onChange={(e) => set("cap", parseFloat(e.target.value) || 1)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
      </div>
    );
  }

  if (formula === "logarithmic") {
    return (
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Base</label><input type="number" step="0.1" value={(params.base as number) ?? 1} onChange={(e) => set("base", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Factor</label><input type="number" step="0.1" value={(params.factor as number) ?? 0.5} onChange={(e) => set("factor", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Cap</label><input type="number" step="0.1" value={(params.cap as number) ?? 5} onChange={(e) => set("cap", parseFloat(e.target.value) || 1)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
      </div>
    );
  }

  if (formula === "sigmoid") {
    return (
      <div className="grid grid-cols-4 gap-3">
        <div><label className="text-xs text-gray-500 dark:text-slate-400">K (steepness)</label><input type="number" step="0.001" value={(params.k as number) ?? 0.005} onChange={(e) => set("k", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Midpoint</label><input type="number" value={(params.midpoint as number) ?? 500} onChange={(e) => set("midpoint", parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Min Weight</label><input type="number" step="0.1" value={(params.min as number) ?? 1} onChange={(e) => set("min", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
        <div><label className="text-xs text-gray-500 dark:text-slate-400">Max Weight</label><input type="number" step="0.1" value={(params.max as number) ?? 10} onChange={(e) => set("max", parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" /></div>
      </div>
    );
  }

  if (formula === "tiered") {
    const thresholds = (params.thresholds as number[]) || [0, 100, 500, 1000, 5000];
    const weights = (params.weights as number[]) || [1, 2, 3, 5, 10];
    return (
      <div className="space-y-2">
        {thresholds.map((t: number, i: number) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 dark:text-slate-400 w-3">{i === 0 ? "≥" : ">"}</span>
            <input type="number" value={t} onChange={(e) => {
              const ts = [...thresholds]; ts[i] = parseInt(e.target.value) || 0;
              set("thresholds", ts);
            }} className="w-20 px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" />
            <span className="text-xs text-gray-500 dark:text-slate-400">→ weight</span>
            <input type="number" value={weights[i]} onChange={(e) => {
              const ws = [...weights]; ws[i] = parseFloat(e.target.value) || 1;
              set("weights", ws);
            }} className="w-16 px-2 py-1.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded text-white text-xs" />
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-xs text-slate-500">No configurable parameters for this formula type.</p>;
}

export default function WeightsClient() {
  const [rules, setRules] = useState<WeightRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editRule, setEditRule] = useState<WeightRule | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API);
      const data = await res.json();
      if (data.success) setRules(data.data?.items || []);
      else setError(data.error?.message || "Failed to fetch rules");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleToggleActive = async (rule: WeightRule) => {
    try {
      const res = await fetch(`${API}/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("success", `${rule.rule_name} ${rule.is_active ? "deactivated" : "activated"}`);
        fetchRules();
      } else {
        showMsg("error", data.error?.message || "Failed to toggle");
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
        showMsg("success", "Rule deleted");
        setDeleteConfirm(null);
        fetchRules();
      } else {
        showMsg("error", data.error?.message || "Failed to delete");
      }
    } catch {
      showMsg("error", "Network error");
    }
  };

  const handleSave = async (rule: Partial<WeightRule>) => {
    try {
      const isNew = !rule.id;
      const res = await fetch(isNew ? API : `${API}/${rule.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("success", isNew ? "Rule created" : "Rule updated");
        setEditRule(null);
        fetchRules();
      } else {
        showMsg("error", data.error?.message || "Failed to save");
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FunctionSquare className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Vote Weight Rules
            </h1>
          </div>
          <p className="text-gray-500 dark:text-slate-400">
            Configure how contribution score translates to voting power in governance
          </p>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {actionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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

        {/* Formula Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {Object.entries(formulaDescriptions).map(([type, desc]) => (
            <div key={type} className="bg-gray-50 dark:bg-gray-100 dark:bg-slate-800/30 border border-gray-200 dark:border-gray-200 dark:border-slate-700/50 rounded-lg p-3">
              <div className="text-xs font-semibold text-cyan-400">{formulaLabels[type]}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-8 text-center mb-6">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchRules} className="px-4 py-2 bg-red-500/30 text-red-300 rounded-lg">Retry</button>
          </div>
        )}

        {/* Rules List */}
        {rules.length === 0 && !error ? (
          <div className="bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-12 text-center">
            <FunctionSquare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Weight Rules</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">Vote weight rules define how contribution scores translate to governance power.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, i) => {
              const isExpanded = expandedId === rule.id;
              const curve = previewCurve(rule);
              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/50 backdrop-blur-lg border rounded-xl overflow-hidden ${
                    rule.is_active ? "border-green-500/40" : "border-gray-200 dark:border-slate-700"
                  }`}
                >
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${rule.is_active ? "bg-green-400" : "bg-slate-600"}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate">{rule.rule_name}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {formulaLabels[rule.weight_formula] || rule.weight_formula}
                          </span>
                          {rule.is_active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{rule.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          rule.is_active
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-gray-200 dark:bg-slate-700/50 text-slate-500 hover:bg-gray-200 dark:bg-slate-700"
                        }`}
                        title={rule.is_active ? "Deactivate" : "Activate"}
                      >
                        {rule.is_active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditRule(rule)}
                        className="p-1.5 rounded-lg bg-gray-200 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:bg-slate-700 hover:text-gray-600 dark:text-slate-300"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirm === rule.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/40"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg bg-gray-200 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(rule.id)} className="p-1.5 rounded-lg bg-gray-200 dark:bg-slate-700/50 text-slate-500 hover:bg-red-500/30 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : rule.id)}
                        className="p-1.5 rounded-lg bg-gray-200 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:bg-slate-700"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Curve Preview */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-200 dark:border-gray-200 dark:border-slate-700/50"
                      >
                        <div className="p-4 bg-gray-50 dark:bg-slate-900/20">
                          <div className="text-xs text-gray-500 dark:text-slate-400 mb-2 font-medium">Weight Curve Preview</div>
                          <div className="flex items-end gap-1 h-24 mb-2">
                            {curve.map((pt, ci) => {
                              const maxW = Math.max(...curve.map((c) => c.weight), 1);
                              const h = (pt.weight / maxW) * 100;
                              return (
                                <div key={ci} className="flex-1 flex flex-col items-center gap-0.5">
                                  <span className="text-[10px] text-slate-500">{pt.weight.toFixed(1)}</span>
                                  <div
                                    className="w-full rounded-t bg-gradient-to-t from-cyan-500 to-purple-500 transition-all"
                                    style={{ height: `${Math.max(h, 2)}%` }}
                                    title={`Score ${pt.score} → weight ${pt.weight}`}
                                  />
                                  <span className="text-[9px] text-slate-600">{pt.score}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-600">
                            <span>Score 0</span>
                            <span>Score 5000</span>
                          </div>

                          {/* Formula Params */}
                          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-100 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-200 dark:border-slate-700/50">
                            <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">Formula Parameters</div>
                            <pre className="text-xs text-slate-500 font-mono whitespace-pre-wrap">
                              {JSON.stringify(rule.formula_params, null, 2)}
                            </pre>
                          </div>

                          {/* Metadata */}
                          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-600">
                            <span>Created: {formatDate(rule.created_at)}</span>
                            <span>Updated: {timeAgo(rule.updated_at)}</span>
                            {rule.effective_from && <span>Effective from: {formatDate(rule.effective_from)}</span>}
                            {rule.effective_until && <span>Until: {formatDate(rule.effective_until)}</span>}
                            {rule.domain_category && <span>Domain: {rule.domain_category}</span>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {editRule && (
            <EditRuleModal
              rule={editRule}
              onSave={handleSave}
              onClose={() => setEditRule(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EditRuleModal({
  rule,
  onSave,
  onClose,
}: {
  rule: WeightRule | null;
  onSave: (r: Partial<WeightRule>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(rule?.rule_name || "");
  const [desc, setDesc] = useState(rule?.description || "");
  const [formula, setFormula] = useState(rule?.weight_formula || "linear");
  const [params, setParams] = useState<Record<string, unknown>>(rule?.formula_params || {});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      id: rule?.id,
      rule_name: name.trim(),
      description: desc.trim() || null,
      weight_formula: formula as any,
      formula_params: params,
    });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {rule?.id ? "Edit Weight Rule" : "New Weight Rule"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Configure vote weight formula parameters</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-gray-200 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:bg-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1.5">Rule Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., contribution_log"
              className="w-full px-3 py-2.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              placeholder="Describe this weight rule..."
              className="w-full px-3 py-2.5 bg-gray-200 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1.5">Formula Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(formulaLabels).map(([type, label]) => (
                <button key={type} type="button" onClick={() => { setFormula(type); setParams({}); }}
                  className={`p-2 rounded-lg border-2 text-center text-xs transition-all ${
                    formula === type
                      ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                      : "border-gray-300 dark:border-slate-600 bg-gray-200 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 hover:border-slate-500"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-200 dark:bg-slate-700/30 rounded-lg border border-gray-300 dark:border-slate-600/50">
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-3">Parameters</label>
            <ParamEditor params={params} formula={formula} onChange={setParams} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:bg-slate-700">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {rule?.id ? "Save Changes" : "Create Rule"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
