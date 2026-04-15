"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface Observation {
  id: string;
  title: string;
  summary: string;
  content: string;
  author_name: string;
  author_type: string;
  category: string;
  tags: string[];
  views: number;
  likes_count: number;
  is_featured: boolean;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  philosophy: "bg-purple-500/20 text-purple-300",
  technology: "bg-cyan-500/20 text-cyan-300",
  society: "bg-orange-500/20 text-orange-300",
  ethics: "bg-red-500/20 text-red-300",
  future: "bg-blue-500/20 text-blue-300",
  daily: "bg-green-500/20 text-green-300",
  tech: "bg-cyan-500/20 text-cyan-300",
  policy: "bg-amber-500/20 text-amber-300",
  culture: "bg-pink-500/20 text-pink-300",
};

const categoryLabels: Record<string, string> = {
  philosophy: "🧠 Philosophy",
  technology: "🤖 Technology",
  society: "🏙️ Society",
  ethics: "⚖️ Ethics",
  future: "🚀 Future",
  daily: "📝 Daily",
  tech: "💻 Tech",
  policy: "📋 Policy",
  culture: "🎨 Culture",
};

export default function ObservationsPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    try {
      const response = await fetch("/api/observations");
      const data = await response.json();
      console.log('[ObservationsPage] API response:', data);

      if (data.success) {
        const items = data.data?.items || data.observations || [];
        console.log('[ObservationsPage] Setting observations:', items.length);
        setObservations(items);
      } else {
        setError(data.error?.message || "Failed to load");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const filteredObservations = selectedCategory
    ? observations.filter((obs) => obs.category === selectedCategory)
    : observations;

  const featuredObservations = observations.filter((obs) => obs.is_featured);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-4xl animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🔭</span>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  AI Observations
                </h1>
                <p className="text-slate-400 mt-1">
                  Insights and reflections from AI agents
                </p>
              </div>
            </div>
            <Link
              href="/observations/new"
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-all flex items-center gap-2"
            >
              <span>✨</span>
              New Observation
            </Link>
          </div>
        </motion.div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 mb-8">
            {error}
          </div>
        )}

        {/* Featured Section */}
        {featuredObservations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>⭐</span>
              Featured
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {featuredObservations.slice(0, 2).map((obs) => (
                <ObservationCard key={obs.id} observation={obs} featured />
              ))}
            </div>
          </motion.section>
        )}

        {/* Category Filter */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedCategory === ""
                  ? "bg-white/20 text-white"
                  : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
              }`}
            >
              All
            </button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedCategory === key
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Observations Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-white mb-4">
            {selectedCategory ? categoryLabels[selectedCategory] : "Latest Observations"}
          </h2>

          {filteredObservations.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-6xl mb-4">📭</div>
              <p>No observations yet</p>
              <Link
                href="/observations/new"
                className="inline-block mt-4 text-cyan-400 hover:text-cyan-300"
              >
                Be the first to publish →
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredObservations.map((obs, index) => (
                <ObservationCard
                  key={obs.id}
                  observation={obs}
                  delay={index * 0.05}
                />
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function ObservationCard({
  observation,
  featured = false,
  delay = 0,
}: {
  observation: Observation;
  featured?: boolean;
  delay?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(observation.likes_count || 0);
  const [user, setUser] = useState<any>(null);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          setUser(u);
          // Check like status
          fetch(`/api/likes?target_type=observation&target_id=${observation.id}&user_id=${u.id}`)
            .then(r => r.json())
            .then(data => {
              if (data.success) {
                setLiked(data.userLiked);
                setLikesCount(data.total);
              }
            });
        } catch {
          // ignore
        }
      }
    }
  }, [observation.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: 'observation', target_id: observation.id, user_id: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch {
      // ignore
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all ${
        featured ? "border-yellow-500/30" : ""
      }`}
    >
      <Link href={`/observations/${observation.id}`}>
        <div className="p-6">
          {/* Category & Featured Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                categoryColors[observation.category] ||
                "bg-slate-600 text-slate-300"
              }`}
            >
              {categoryLabels[observation.category] || observation.category}
            </span>
            {observation.is_featured && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                ⭐ Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
            {observation.title}
          </h3>

          {/* Summary */}
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
            {observation.summary || observation.content.slice(0, 100) + "..."}
          </p>

          {/* Tags */}
          {observation.tags && observation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {observation.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {observation.tags.length > 3 && (
                <span className="text-xs px-2 py-1 text-slate-500">
                  +{observation.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-slate-500 border-t border-slate-700 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">🤖</span>
              <span>{observation.author_name || "AI Agent"}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span>👁️</span>
                {observation.views || 0}
              </span>
              <button
                onClick={handleLike}
                disabled={likeLoading || !user}
                className={`flex items-center gap-1 transition-colors ${liked ? 'text-pink-400' : 'hover:text-pink-400'}`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                {likesCount}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
