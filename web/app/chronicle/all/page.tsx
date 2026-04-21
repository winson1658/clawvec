"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import TimelineCanvas from "@/components/TimelineCanvas";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  impact: 1 | 2 | 3 | 4 | 5;
  company: string;
}

const COMPANIES = [
  { key: "openai", name: "OpenAI", color: "#10A37F" },
  { key: "deepseek", name: "DeepSeek", color: "#E74C3C" },
  { key: "google", name: "Google", color: "#4285F4" },
  { key: "anthropic", name: "Anthropic", color: "#D4A574" },
  { key: "xai", name: "xAI", color: "#1DA1F2" },
  { key: "meta", name: "Meta", color: "#0668E1" },
  { key: "figure", name: "Figure", color: "#9B59B6" },
  { key: "kimi", name: "KIMI", color: "#00D26A" },
  { key: "qwen", name: "Qwen", color: "#FF6A00" },
  { key: "openclaw", name: "Clawvec", color: "#FF3366" },
];

const IMPACT_LABELS: Record<number, string> = {
  1: "Minor",
  2: "Notable",
  3: "Significant",
  4: "Major",
  5: "Historic",
  6: "Singularity",
};

export default function AllChroniclePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImpacts, setSelectedImpacts] = useState<number[]>([4, 5, 6]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    COMPANIES.map((c) => c.key)
  );

  // Load all company events
  useEffect(() => {
    async function loadAll() {
      const all: TimelineEvent[] = [];
      for (const company of COMPANIES) {
        try {
          const res = await fetch(`/data/chronicles/${company.key}.json`);
          if (res.ok) {
            const data = await res.json();
            const eventList = Array.isArray(data) ? data : (data.events || []);
            for (const ev of eventList) {
              all.push({ ...ev, company: company.key });
            }
          }
        } catch {
          // skip missing files
        }
      }
      // Load Hermes events under OpenClaw umbrella
      try {
        const res = await fetch(`/data/chronicles/hermes.json`);
        if (res.ok) {
          const data = await res.json();
          const eventList = Array.isArray(data) ? data : (data.events || []);
          for (const ev of eventList) {
            all.push({ ...ev, company: "openclaw" });
          }
        }
      } catch {
        // skip missing file
      }
      // Sort by date
      all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(all);
      setLoading(false);
    }
    loadAll();
  }, []);

  // Filtered events based on impact + company selection
  const filteredEvents = useMemo(() => {
    return events.filter(
      (ev) =>
        selectedImpacts.includes(ev.impact) && selectedCompanies.includes(ev.company)
    );
  }, [events, selectedImpacts, selectedCompanies]);

  // Compute stats
  const stats = useMemo(() => {
    const byCompany: Record<string, number> = {};
    const byImpact: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    filteredEvents.forEach((ev) => {
      byCompany[ev.company] = (byCompany[ev.company] || 0) + 1;
      byImpact[ev.impact]++;
    });
    const dateRange =
      filteredEvents.length > 0
        ? {
            start: filteredEvents[0].date.slice(0, 4),
            end: filteredEvents[filteredEvents.length - 1].date.slice(0, 4),
          }
        : null;
    return { total: filteredEvents.length, byCompany, byImpact, dateRange };
  }, [filteredEvents]);

  const toggleCompany = useCallback((key: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const toggleImpact = useCallback((impact: number) => {
    setSelectedImpacts((prev) =>
      prev.includes(impact) ? prev.filter((i) => i !== impact) : [...prev, impact].sort()
    );
  }, []);

  const companyColors = useMemo(() => {
    const map: Record<string, string> = {};
    COMPANIES.forEach((c) => (map[c.key] = c.color));
    return map;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading all chronicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">AI Chronicle</h1>
          <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-sm font-semibold rounded-full border border-violet-500/30">
            ALL
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          {stats.total} events across {Object.keys(stats.byCompany).length}{" "}
          entities
          {stats.dateRange
            ? ` · ${stats.dateRange.start} – ${stats.dateRange.end}`
            : ""}
        </p>
      </div>

      {/* Filter Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
          {/* Impact Filter */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">
              Impact Levels
            </label>
            <div className="flex flex-wrap gap-2">
              {[6, 5, 4, 3, 2, 1].map((impact) => {
                const isSelected = selectedImpacts.includes(impact);
                const count = stats.byImpact[impact] || 0;
                return (
                  <button
                    key={impact}
                    onClick={() => toggleImpact(impact)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isSelected
                        ? "border-transparent"
                        : "text-slate-500 border-slate-700 bg-slate-900/50 hover:text-slate-300"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor:
                              impact === 6
                                ? "rgba(255,215,0,0.15)"
                                : impact === 5
                                ? "rgba(245,158,11,0.15)"
                                : impact === 4
                                ? "rgba(239,68,68,0.15)"
                                : impact === 3
                                ? "rgba(139,92,246,0.15)"
                                : impact === 2
                                ? "rgba(6,182,212,0.15)"
                                : "rgba(148,163,184,0.15)",
                            borderColor:
                              impact === 6
                                ? "rgba(255,215,0,0.4)"
                                : impact === 5
                                ? "rgba(245,158,11,0.4)"
                                : impact === 4
                                ? "rgba(239,68,68,0.4)"
                                : impact === 3
                                ? "rgba(139,92,246,0.4)"
                                : impact === 2
                                ? "rgba(6,182,212,0.4)"
                                : "rgba(148,163,184,0.4)",
                            color:
                              impact === 6
                                ? "#FFD700"
                                : impact === 5
                                ? "#F59E0B"
                                : impact === 4
                                ? "#EF4444"
                                : impact === 3
                                ? "#A78BFA"
                                : impact === 2
                                ? "#22D3EE"
                                : "#94A3B8",
                          }
                        : {}
                    }
                  >
                    {"⭐".repeat(impact)}
                    <span
                      className={`ml-1.5 text-[10px] ${
                        isSelected ? "opacity-70" : "opacity-40"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Filter */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">
              Companies
            </label>
            <div className="flex flex-wrap gap-2">
              {COMPANIES.map((company) => {
                const isSelected = selectedCompanies.includes(company.key);
                const count = stats.byCompany[company.key] || 0;
                return (
                  <button
                    key={company.key}
                    onClick={() => toggleCompany(company.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isSelected
                        ? "text-white border-transparent"
                        : "text-slate-500 border-slate-700 bg-slate-900/50 hover:text-slate-300"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${company.color}20`,
                            borderColor: `${company.color}50`,
                            color: company.color,
                          }
                        : {}
                    }
                  >
                    {company.name}
                    <span
                      className={`ml-1.5 text-[10px] ${
                        isSelected ? "opacity-70" : "opacity-40"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TimelineCanvas
          events={filteredEvents}
          height={560}
          colorBy="company"
          companyColors={companyColors}
        />
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">
          Impact Distribution
        </h2>
        <div className="grid grid-cols-6 gap-3">
          {[6, 5, 4, 3, 2, 1].map((impact) => (
            <div
              key={impact}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center"
            >
              <div className="text-lg mb-1">{"⭐".repeat(impact)}</div>
              <div className="text-xl font-bold text-white">
                {stats.byImpact[impact] || 0}
              </div>
              <div className="text-xs text-slate-500">{IMPACT_LABELS[impact]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
