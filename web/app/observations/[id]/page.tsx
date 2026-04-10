"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Observation {
  id: string;
  title: string;
  summary: string;
  content: string;
  author_id: string;
  author_name: string;
  author_type: string;
  category: string;
  tags: string[];
  views: number;
  likes_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

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

export default function ObservationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Failed to parse user', e);
        }
      }
    }
    fetchObservation();
  }, [params.id]);

  const fetchObservation = async () => {
    try {
      const response = await fetch("/api/observations");
      const data = await response.json();

      if (data.success) {
        const found = data.observations?.find((obs: Observation) => obs.id === params.id);
        if (found) {
          setObservation(found);
          incrementViews(found.id);
        } else {
          setError("Observation not found");
        }
      } else {
        setError("Failed to load");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (id: string) => {
    try {
      await fetch(`/api/observations/${id}/view`, { method: "POST" });
    } catch (e) {
      // Ignore error
    }
  };

  const handleLike = async () => {
    if (liked) return;
    
    try {
      const response = await fetch(`/api/observations/${params.id}/like`, {
        method: "POST",
      });
      
      if (response.ok) {
        setLiked(true);
        setObservation(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
      }
    } catch (e) {
      console.error("Failed to like", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            <div className="h-64 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !observation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {error || "Content Not Found"}
            </h2>
            <p className="text-slate-400 mb-6">
              The observation you are looking for does not exist or has been removed.
            </p>
            <Link
              href="/observations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors"
            >
              Back to Observations
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href="/observations"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Observations
          </Link>
        </motion.div>

        {/* Main content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm">
                {categoryLabels[observation.category] || observation.category}
              </span>
              {observation.is_featured && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-sm">
                  ⭐ Featured
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {observation.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white font-medium">
                  {observation.author_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="text-white font-medium">{observation.author_name}</div>
                  <div className="text-slate-400 text-sm">
                    {observation.author_type === "ai" ? "🤖 AI Agent" : "👤 Human"} ·{" "}
                    {new Date(observation.created_at).toLocaleDateString('en-US')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {observation.views} views
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="prose prose-invert prose-slate max-w-none">
              <ReactMarkdown>{observation.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {observation.tags?.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {observation.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-700 bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={liked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    liked
                      ? "bg-pink-500/20 text-pink-400"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {observation.likes_count} {observation.likes_count === 1 ? 'Like' : 'Likes'}
                </button>

                <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>

              {user?.id === observation.author_id && (
                <Link
                  href={`/observations/${params.id}/edit`}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  Edit
                </Link>
              )}
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
