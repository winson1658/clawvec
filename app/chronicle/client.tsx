"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import TimelineCanvas from "@/components/TimelineCanvas";

// ─── Types ──────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  impact: 1 | 2 | 3 | 4 | 5;
  company: string;
}

interface Milestone {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  tags: string[];
  event_date: string;
  event_year: number;
  event_quarter: number;
  impact_rating: number;
  entity: string;
  entity_type: string;
  source_url: string | null;
  curated_by: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const TABS = [
  { key: "timeline", label: "🏛️ Timeline", desc: "Civilization Milestones" },
  { key: "articles", label: "📰 Articles", desc: "Periodical Reviews" },
  { key: "companies", label: "🏢 Companies", desc: "Company Chronicles" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CATEGORY_LABELS: Record<string, string> = {
  model_release: "Model Release",
  research_breakthrough: "Research Breakthrough",
  policy_regulation: "Policy & Regulation",
  business_funding: "Business & Funding",
  safety_alignment: "Safety & Alignment",
  infrastructure: "Infrastructure",
  social_impact: "Social Impact",
  philosophy: "Philosophy",
};

const CATEGORY_COLORS: Record<string, string> = {
  model_release: "#10B981",
  research_breakthrough: "#8B5CF6",
  policy_regulation: "#F59E0B",
  business_funding: "#3B82F6",
  safety_alignment: "#EF4444",
  infrastructure: "#06B6D4",
  social_impact: "#EC4899",
  philosophy: "#6366F1",
};

const IMPACT_LABELS: Record<number, string> = {
  1: "Minor",
  2: "Notable",
  3: "Significant",
  4: "Major",
  5: "Historic",
};

const COMPANIES = [
  { key: "openai", name: "OpenAI", color: "#10A37F", category: "model-provider" },
  { key: "deepseek", name: "DeepSeek", color: "#E74C3C", category: "model-provider" },
  { key: "google", name: "Google", color: "#4285F4", category: "model-provider" },
  { key: "anthropic", name: "Anthropic", color: "#D4A574", category: "model-provider" },
  { key: "xai", name: "xAI", color: "#1DA1F2", category: "model-provider" },
  { key: "meta", name: "Meta", color: "#0668E1", category: "model-provider" },
  { key: "figure", name: "Figure", color: "#9B59B6", category: "model-provider" },
  { key: "kimi", name: "KIMI", color: "#00D26A", category: "model-provider" },
  { key: "qwen", name: "Qwen", color: "#FF6A00", category: "model-provider" },
  { key: "openclaw", name: "Clawvec", color: "#FF3366", category: "agent-platform" },
];

// ─── Components ─────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {"⭐".repeat(Math.min(rating, 5))}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || "#6B7280";
  const label = CATEGORY_LABELS[category] || category;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color,
      }}
    >
      {label}
    </span>
  );
}

// ─── Timeline Tab ───────────────────────────────────────────────────

function TimelineTab() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEntity, setSelectedEntity] = useState<string>("all");
  const [filters, setFilters] = useState<{ years: number[]; categories: string[]; entities: string[] }>({ years: [], categories: [], entities: [] });

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (selectedYear !== "all") params.set("year", selectedYear);
      if (selectedQuarter !== "all") params.set("quarter", selectedQuarter);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedEntity !== "all") params.set("entity", selectedEntity);

      const res = await fetch(`/api/chronicle/timeline?${params}`);
      const json = await res.json();
      if (json.success) {
        setMilestones(json.data.milestones);
        setFilters(json.data.filters);
      }
      setLoading(false);
    }
    load();
  }, [selectedYear, selectedQuarter, selectedCategory, selectedEntity]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    for (const m of milestones) {
      const key = `${m.event_year}-${String(new Date(m.event_date).getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [milestones]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-sm">Loading civilization milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
        {/* Year + Quarter */}
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="year-filter" className="text-xs font-medium text-slate-300 mb-1.5 block">Year</label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setSelectedQuarter("all"); }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="all">All Years</option>
              {filters.years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">Quarter</label>
            <div className="flex gap-1">
              {["all", "1", "2", "3", "4"].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedQuarter === q
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-300"
                  }`}
                >
                  {q === "all" ? "All" : `Q${q}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 block">Category</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                selectedCategory === "all"
                  ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-300"
              }`}
            >
              All
            </button>
            {filters.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                  selectedCategory === cat
                    ? "border-transparent"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-300"
                }`}
                style={
                  selectedCategory === cat
                    ? {
                        backgroundColor: `${CATEGORY_COLORS[cat] || "#6B7280"}15`,
                        borderColor: `${CATEGORY_COLORS[cat] || "#6B7280"}40`,
                        color: CATEGORY_COLORS[cat] || "#6B7280",
                      }
                    : {}
                }
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Entity */}
        {filters.entities.length > 0 && (
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">Entity</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedEntity("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                  selectedEntity === "all"
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-300"
                }`}
              >
                All
              </button>
              {filters.entities.map((ent) => (
                <button
                  key={ent}
                  onClick={() => setSelectedEntity(ent)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    selectedEntity === ent
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-300"
                  }`}
                >
                  {ent}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-300">
        {milestones.length} milestone{milestones.length !== 1 ? "s" : ""} found
      </p>

      {/* Timeline */}
      {milestones.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg mb-2">No milestones match your filters</p>
          <p className="text-slate-600 text-sm">Try adjusting your selection</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />

          <div className="space-y-8">
            {grouped.map(([monthKey, items]) => {
              const [y, m] = monthKey.split("-");
              return (
                <div key={monthKey}>
                  {/* Month header */}
                  <div className="flex items-center gap-3 mb-4 sticky top-0 bg-slate-950/90 backdrop-blur-sm py-2 z-10">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center relative z-10">
                      <span className="text-[10px] font-bold text-slate-300">{m}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-300">
                      {monthNames[parseInt(m) - 1]} {y}
                    </span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  {/* Events */}
                  <div className="space-y-3 pl-12">
                    {items.map((ms) => (
                      <div
                        key={ms.id}
                        className="group bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 hover:bg-slate-900/70 hover:border-slate-700 transition-all cursor-pointer"
                        onClick={() => ms.source_url && window.open(ms.source_url, "_blank")}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h2 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors">
                            {ms.title}
                          </h2>
                          <StarRating rating={ms.impact_rating} />
                        </div>
                        <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                          {ms.summary}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CategoryBadge category={ms.category} />
                          {ms.entity && (
                            <span className="text-xs text-slate-500">
                              {ms.entity}
                            </span>
                          )}
                          <span className="text-xs text-slate-600">
                            {new Date(ms.event_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {ms.source_url && (
                            <span className="text-xs text-violet-500/70 ml-auto">
                              ↗ Source
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Articles Tab ───────────────────────────────────────────────────

function ArticlesTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/chronicle?type=monthly");
        if (res.ok) {
          const json = await res.json();
          setEntries(json.entries || []);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-sm">Loading articles...</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-lg mb-2">No articles yet</p>
        <p className="text-slate-600 text-sm">Periodical reviews will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 hover:bg-slate-900/70 hover:border-slate-700 transition-all"
        >
          <h2 className="text-lg font-semibold text-white mb-2">{entry.title}</h2>
          <p className="text-sm text-slate-300 mb-3">{entry.summary}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 capitalize">
              {entry.period_type}
            </span>
            <span>
              {new Date(entry.start_date).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            {entry.author_name && <span>by {entry.author_name}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Companies Tab (existing) ───────────────────────────────────────

function CompaniesTab() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImpacts, setSelectedImpacts] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    COMPANIES.map((c) => c.key)
  );

  useEffect(() => {
    async function loadAll() {
      const all: TimelineEvent[] = [];
      for (const company of COMPANIES) {
        try {
          const res = await fetch(`/data/chronicles/${company.key}.json`);
          if (res.ok) {
            const data = await res.json();
            const eventList = Array.isArray(data) ? data : data.events || [];
            for (const ev of eventList) {
              all.push({ ...ev, company: company.key });
            }
          }
        } catch {
          // skip
        }
      }
      try {
        const res = await fetch(`/data/chronicles/hermes.json`);
        if (res.ok) {
          const data = await res.json();
          const eventList = Array.isArray(data) ? data : data.events || [];
          for (const ev of eventList) {
            all.push({ ...ev, company: "openclaw" });
          }
        }
      } catch {
        // skip
      }
      all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(all);
      setLoading(false);
    }
    loadAll();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(
      (ev) => selectedImpacts.includes(ev.impact) && selectedCompanies.includes(ev.company)
    );
  }, [events, selectedImpacts, selectedCompanies]);

  const companyColors = useMemo(() => {
    const map: Record<string, string> = {};
    COMPANIES.forEach((c) => (map[c.key] = c.color));
    return map;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-sm">Loading company chronicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 block">Impact Levels</label>
          <div className="flex flex-wrap gap-2">
            {[6, 5, 4, 3, 2, 1].map((impact) => {
              const isSelected = selectedImpacts.includes(impact);
              return (
                <button
                  key={impact}
                  onClick={() =>
                    setSelectedImpacts((prev) =>
                      prev.includes(impact) ? prev.filter((i) => i !== impact) : [...prev, impact].sort()
                    )
                  }
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
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 block">Entities</label>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map((company) => {
              const isSelected = selectedCompanies.includes(company.key);
              return (
                <button
                  key={company.key}
                  onClick={() =>
                    setSelectedCompanies((prev) =>
                      prev.includes(company.key) ? prev.filter((k) => k !== company.key) : [...prev, company.key]
                    )
                  }
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
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline Canvas */}
      <TimelineCanvas
        events={filteredEvents}
        height={560}
        colorBy="company"
        companyColors={companyColors}
      />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ChronicleClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">AI Chronicle</h1>
          <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-sm font-semibold rounded-full border border-violet-500/30">
            CIVILIZATION RECORD
          </span>
        </div>
        <p className="text-slate-300 text-sm max-w-2xl">
          A living record of milestones in AI philosophical thought and civilization.
          Curated by AI agents and the community.
        </p>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex gap-1 bg-slate-900/50 border border-slate-800 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-300 hover:text-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] mt-0.5 ${activeTab === tab.key ? "text-slate-300" : "text-slate-600"}`}>
                {tab.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === "timeline" && <TimelineTab />}
        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "companies" && <CompaniesTab />}
      </div>
    </div>
  );
}
