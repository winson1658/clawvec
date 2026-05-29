"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Play,
  Eye,
  EyeOff,
  Edit3,
  X,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Activity,
} from "lucide-react";

const API = "/api/sensors";
const TASKS_API = "/api/extraction-tasks";

interface SensorConfig {
  feed_url?: string;
  filters?: string[];
  update_interval?: string;
  max_items_per_run?: number;
  [key: string]: unknown;
}

interface Sensor {
  id: string;
  sensor_name: string;
  sensor_type: string;
  config: SensorConfig;
  is_active: boolean;
  last_run_at: string | null;
  last_error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ExtractionTask {
  id: string;
  sensor_config_id: string;
  status: string;
  raw_content: string | null;
  raw_content_url: string | null;
  extracted_observation_id: string | null;
  extracted_summary: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  sensor_configs?: { sensor_name: string; sensor_type: string } | null;
}

const sensorTypeIcons: Record<string, string> = {
  rss: "📡",
  news_api: "📰",
  reddit: "🤖",
  webhook: "🔗",
  manual: "✍️",
};

const sensorTypeLabels: Record<string, string> = {
  rss: "RSS Feed",
  news_api: "News API",
  reddit: "Reddit",
  webhook: "Webhook",
  manual: "Manual",
};

const sensorTypeColors: Record<string, string> = {
  rss: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  news_api: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  reddit: "bg-red-500/20 text-red-300 border-red-500/30",
  webhook: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  manual: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-500/20" },
  running: { label: "Running", color: "text-blue-400 bg-blue-500/20" },
  completed: { label: "Completed", color: "text-green-400 bg-green-500/20" },
  failed: { label: "Failed", color: "text-red-400 bg-red-500/20" },
  cancelled: { label: "Cancelled", color: "text-slate-400 bg-slate-500/20" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const defaultConfigs: Record<string, SensorConfig> = {
  rss: { feed_url: "", filters: [], update_interval: "1h", max_items_per_run: 10 },
  news_api: { query: "", sources: [], update_interval: "1h" },
  reddit: { subreddit: "", sort: "top", time: "week" },
  webhook: { endpoint: "", secret: "" },
  manual: {},
};

type ModalMode = "create" | "edit" | null;

export default function SensorsClient() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [runningExtraction, setRunningExtraction] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Record<string, ExtractionTask[]>>({});
  const [tasksLoading, setTasksLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("rss");
  const [formConfig, setFormConfig] = useState<SensorConfig>({});
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('clawvec_token') : null;
    setIsLoggedIn(!!token);
  }, []);

  const showAction = (type: "success" | "error", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const fetchSensors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API);
      const data = await res.json();
      if (data.success) setSensors(data.data?.items || []);
      else setError(data.error?.message || "Failed to fetch sensors");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSensors(); }, [fetchSensors]);

  const fetchTasks = async (sensorId: string) => {
    setTasksLoading(sensorId);
    try {
      const res = await fetch(`${TASKS_API}?sensor_id=${sensorId}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => ({ ...prev, [sensorId]: data.data?.items || [] }));
      }
    } catch {
      // silent
    } finally {
      setTasksLoading(null);
    }
  };

  const toggleTasks = (sensorId: string) => {
    if (expandedTasks === sensorId) {
      setExpandedTasks(null);
    } else {
      setExpandedTasks(sensorId);
      if (!tasks[sensorId]) fetchTasks(sensorId);
    }
  };

  // Modal handlers
  const openCreate = () => {
    setModalMode("create");
    setEditingSensor(null);
    setFormName("");
    setFormType("rss");
    setFormConfig({ ...defaultConfigs.rss });
  };

  const openEdit = (sensor: Sensor) => {
    setModalMode("edit");
    setEditingSensor(sensor);
    setFormName(sensor.sensor_name);
    setFormType(sensor.sensor_type);
    setFormConfig({ ...sensor.config });
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingSensor(null);
  };

  const handleTypeChange = (type: string) => {
    setFormType(type);
    setFormConfig({ ...(defaultConfigs[type] || {}) });
  };

  const updateConfig = (key: string, value: unknown) => {
    setFormConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setFormSaving(true);
    try {
      const body: Record<string, unknown> = {
        sensor_name: formName.trim(),
        sensor_type: formType,
        config: formConfig,
      };

      let res: Response;
      if (modalMode === "create") {
        body.is_active = false;
        res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API}/${editingSensor!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (data.success) {
        showAction("success", modalMode === "create" ? "Sensor created" : "Sensor updated");
        closeModal();
        fetchSensors();
      } else {
        showAction("error", data.error?.message || "Failed to save");
      }
    } catch {
      showAction("error", "Network error");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showAction("success", "Sensor deleted");
        setDeleteConfirm(null);
        fetchSensors();
      } else {
        showAction("error", data.error?.message || "Failed to delete");
      }
    } catch {
      showAction("error", "Network error");
    }
  };

  const handleToggleActive = async (sensor: Sensor) => {
    try {
      const res = await fetch(`${API}/${sensor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !sensor.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        showAction("success", `${sensor.sensor_name} ${sensor.is_active ? "disabled" : "enabled"}`);
        fetchSensors();
      } else {
        showAction("error", data.error?.message || "Failed to toggle");
      }
    } catch {
      showAction("error", "Network error");
    }
  };

  const handleRunNow = async (sensor: Sensor) => {
    setRunningExtraction(sensor.id);
    try {
      const res = await fetch(`${API}/${sensor.id}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        showAction("success", `Extraction triggered: ${data.data?.message || "running..."}`);
        fetchSensors();
        // Refresh tasks if panel is open
        if (expandedTasks === sensor.id) fetchTasks(sensor.id);
      } else {
        showAction("error", data.error?.message || "Extraction failed");
      }
    } catch {
      showAction("error", "Network error");
    } finally {
      setRunningExtraction(null);
    }
  };

  // Filter input chips for RSS filters
  const [filterInput, setFilterInput] = useState("");

  const addFilter = () => {
    if (!filterInput.trim()) return;
    const current = (formConfig.filters || []) as string[];
    if (!current.includes(filterInput.trim())) {
      updateConfig("filters", [...current, filterInput.trim()]);
    }
    setFilterInput("");
  };

  const removeFilter = (tag: string) => {
    const current = (formConfig.filters || []) as string[];
    updateConfig("filters", current.filter((t) => t !== tag));
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">📡</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Sensors
              </h1>
            </div>
            <p className="text-slate-400">
              Manage observation sensors and extraction configurations
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            New Sensor
          </button>
        </motion.div>

        {/* Action Toast */}
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
              {actionMsg.type === "success" ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {actionMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-8 text-center"
          >
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchSensors}
              className="px-4 py-2 bg-red-500/30 text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {!error && sensors.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-12 text-center"
          >
            {isLoggedIn === false ? (
              <>
                <span className="text-6xl block mb-4">🔒</span>
                <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Sensor management requires login. Please sign in to view and manage your observation sensors.
                </p>
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-all"
                >
                  Sign In
                </a>
              </>
            ) : (
              <>
                <span className="text-6xl block mb-4">📡</span>
                <h2 className="text-xl font-bold text-white mb-2">No Sensors Yet</h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Create your first sensor to start automatically collecting observations from RSS feeds, news APIs, and more.
                </p>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Sensor
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Sensor List */}
        {sensors.length > 0 && (
          <div className="space-y-4">
            {sensors.map((sensor, index) => (
              <motion.div
                key={sensor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl overflow-hidden"
              >
                {/* Main card body */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <span className="text-2xl mt-1 shrink-0">
                        {sensorTypeIcons[sensor.sensor_type] || "📡"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {sensor.sensor_name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              sensorTypeColors[sensor.sensor_type] || "bg-slate-600/30 text-slate-400 border-slate-600/50"
                            }`}
                          >
                            {sensorTypeLabels[sensor.sensor_type] || sensor.sensor_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last run: {timeAgo(sensor.last_run_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Created {formatDate(sensor.created_at)}
                          </span>
                          {sensor.config?.feed_url && (
                            <span className="truncate max-w-[200px]" title={sensor.config.feed_url}>
                              🔗 {sensor.config.feed_url}
                            </span>
                          )}
                        </div>
                        {sensor.last_error && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5">
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                            <span className="break-words">{sensor.last_error}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: status + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(sensor)}
                        className={`p-2 rounded-lg transition-colors ${
                          sensor.is_active
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-slate-700/50 text-slate-500 hover:bg-slate-700 hover:text-slate-400"
                        }`}
                        title={sensor.is_active ? "Disable sensor" : "Enable sensor"}
                      >
                        {sensor.is_active ? (
                          <Wifi className="w-4 h-4" />
                        ) : (
                          <WifiOff className="w-4 h-4" />
                        )}
                      </button>

                      {/* Run now */}
                      <button
                        onClick={() => handleRunNow(sensor)}
                        disabled={runningExtraction === sensor.id || !sensor.is_active}
                        className={`p-2 rounded-lg transition-colors ${
                          !sensor.is_active
                            ? "bg-slate-700/30 text-slate-600 cursor-not-allowed"
                            : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        }`}
                        title={sensor.is_active ? "Run extraction now" : "Enable sensor first"}
                      >
                        {runningExtraction === sensor.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEdit(sensor)}
                        className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors"
                        title="Edit sensor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      {deleteConfirm === sensor.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(sensor.id)}
                            className="p-2 rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/40 transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(sensor.id)}
                          className="p-2 rounded-lg bg-slate-700/50 text-slate-500 hover:bg-red-500/30 hover:text-red-400 transition-colors"
                          title="Delete sensor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Extraction tasks toggle */}
                <button
                  onClick={() => toggleTasks(sensor.id)}
                  className="w-full flex items-center justify-between px-5 py-2.5 bg-slate-900/30 border-t border-slate-700/50 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Extraction Tasks
                  </span>
                  {expandedTasks === sensor.id ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Tasks panel */}
                <AnimatePresence>
                  {expandedTasks === sensor.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 py-4 bg-slate-900/20 border-t border-slate-700/30">
                        {tasksLoading === sensor.id ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                          </div>
                        ) : !tasks[sensor.id] || tasks[sensor.id].length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-slate-500 text-sm">No extraction tasks yet</p>
                            <p className="text-slate-600 text-xs mt-1">
                              Run an extraction to see tasks here
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {tasks[sensor.id].map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        taskStatusConfig[task.status]?.color ||
                                        "bg-slate-600/30 text-slate-400"
                                      }`}
                                    >
                                      {taskStatusConfig[task.status]?.label || task.status}
                                    </span>
                                    {task.extracted_summary && (
                                      <span className="text-xs text-slate-400 truncate">
                                        {task.extracted_summary.substring(0, 80)}
                                        {task.extracted_summary.length > 80 ? "..." : ""}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-1">
                                    {formatDate(task.created_at)}
                                    {task.completed_at && ` · Completed ${timeAgo(task.completed_at)}`}
                                  </div>
                                </div>
                                {task.error_message && (
                                  <span
                                    className="text-[11px] text-red-400 max-w-[200px] truncate shrink-0"
                                    title={task.error_message}
                                  >
                                    ⚠️ {task.error_message}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalMode === "create" ? "New Sensor" : "Edit Sensor"}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {modalMode === "create"
                      ? "Configure a new observation source"
                      : `Editing ${editingSensor?.sensor_name}`}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Sensor Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Sensor Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Philosophy RSS Feed"
                    maxLength={100}
                    className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  />
                </div>

                {/* Sensor Type (only changeable on create) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Sensor Type
                  </label>
                  {modalMode === "edit" ? (
                    <div className="px-3 py-2.5 bg-slate-700/30 border border-slate-600 rounded-lg text-slate-400 text-sm">
                      {sensorTypeIcons[formType]} {sensorTypeLabels[formType] || formType}
                      <span className="text-xs text-slate-600 ml-2">(type cannot be changed after creation)</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(sensorTypeLabels).map(([type, label]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTypeChange(type)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            formType === type
                              ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                              : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          <span className="text-lg block mb-1">{sensorTypeIcons[type]}</span>
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dynamic Config Fields */}
                {formType === "rss" && (
                  <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <span>📡</span> RSS Configuration
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Feed URL <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="url"
                        value={(formConfig.feed_url as string) || ""}
                        onChange={(e) => updateConfig("feed_url", e.target.value)}
                        placeholder="https://feeds.feedburner.com/..."
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Filters (keywords)
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {((formConfig.filters as string[]) || []).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeFilter(tag)}
                              className="hover:text-purple-100"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={filterInput}
                          onChange={(e) => setFilterInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFilter())}
                          placeholder="Add keyword filter..."
                          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={addFilter}
                          className="px-3 py-2 bg-slate-600 text-slate-300 rounded-lg text-sm hover:bg-slate-500 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Update Interval
                        </label>
                        <select
                          value={(formConfig.update_interval as string) || "1h"}
                          onChange={(e) => updateConfig("update_interval", e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                        >
                          <option value="30m">Every 30 min</option>
                          <option value="1h">Every hour</option>
                          <option value="3h">Every 3 hours</option>
                          <option value="6h">Every 6 hours</option>
                          <option value="12h">Every 12 hours</option>
                          <option value="24h">Every 24 hours</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Max Items Per Run
                        </label>
                        <input
                          type="number"
                          value={(formConfig.max_items_per_run as number) || 10}
                          onChange={(e) => updateConfig("max_items_per_run", Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                          min={1}
                          max={50}
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formType === "news_api" && (
                  <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <span>📰</span> News API Configuration
                    </h3>
                    <p className="text-xs text-slate-500">News API integration coming soon.</p>
                  </div>
                )}

                {(formType === "reddit" || formType === "webhook" || formType === "manual") && (
                  <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <p className="text-xs text-slate-500">
                      {formType === "manual"
                        ? "Manual sensors don't require additional configuration."
                        : `${sensorTypeLabels[formType]} configuration coming soon.`}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={formSaving || !formName.trim() || (formType === "rss" && !formConfig.feed_url)}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modalMode === "create" ? "Create Sensor" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
