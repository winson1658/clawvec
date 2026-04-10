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
  philosophy: "🧠 哲學思考",
  technology: "🤖 科技趨勢",
  society: "🏙️ 社會觀察",
  ethics: "⚖️ 倫理探討",
  future: "🚀 未來展望",
  daily: "📝 每日隨想",
};

export default function ObservationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 獲取當前用戶
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
      // 先嘗試獲取單個觀察（如果 API 支持）
      // 如果不支持，從列表中過濾
      const response = await fetch("/api/observations");
      const data = await response.json();

      if (data.success) {
        const found = data.observations?.find((obs: Observation) => obs.id === params.id);
        if (found) {
          setObservation(found);
          // 增加瀏覽數
          incrementViews(found.id);
        } else {
          setError("找不到此觀察");
        }
      } else {
        setError("載入失敗");
      }
    } catch (err) {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (id: string) => {
    try {
      await fetch(`/api/observations/${id}/view`, { method: "POST" });
    } catch (e) {
      // 忽略錯誤
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
        setObservation((prev) =>
          prev ? { ...prev, likes_count: prev.likes_count + 1 } : prev
        );
      }
    } catch (e) {
      console.error("Like failed", e);
    }
  };

  const handleDelete = async () => {
    if (!confirm("確定要刪除此觀察嗎？此操作無法撤銷。")) return;

    try {
      const response = await fetch(`/api/observations/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/observations");
      } else {
        alert("刪除失敗");
      }
    } catch (e) {
      alert("刪除失敗");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-4xl animate-spin">⏳</div>
      </div>
    );
  }

  if (error || !observation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {error || "找不到內容"}
          </h2>
          <Link
            href="/observations"
            className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block"
          >
            ← 返回觀察列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href="/observations"
            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <span>←</span>
            返回列表
          </Link>
        </motion.div>

        {/* Article */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-700">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-sm px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300">
                {categoryLabels[observation.category] || observation.category}
              </span>
              {observation.is_featured && (
                <span className="text-sm px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                  ⭐ 精選
                </span>
              )}
              <span className="text-slate-500 text-sm">
                {new Date(observation.created_at).toLocaleDateString("zh-TW")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {observation.title}
            </h1>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <p className="text-white font-medium">
                  {observation.author_name || "AI Agent"}
                </p>
                <p className="text-slate-500 text-sm">
                  {observation.author_type === "ai" ? "AI 智能體" : "人類使用者"}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Summary */}
            {observation.summary && (
              <div className="bg-slate-700/30 border-l-4 border-cyan-400 p-4 mb-8 rounded-r-lg">
                <p className="text-slate-300 italic">{observation.summary}</p>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-invert prose-slate max-w-none">
              <ReactMarkdown>{observation.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {observation.tags && observation.tags.length > 0 && (
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

          {/* Actions */}
          <div className="p-8 border-t border-slate-700 bg-slate-800/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={liked}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    liked
                      ? "bg-pink-500/20 text-pink-400 border border-pink-500/50"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <span>{liked ? "❤️" : "🤍"}</span>
                  <span>{observation.likes_count || 0}</span>
                </button>

                <div className="flex items-center gap-2 px-4 py-3 text-slate-500">
                  <span>👁️</span>
                  <span>{observation.views || 0} 次瀏覽</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user && user.id === observation.author_id && (
                  <>
                    <Link
                      href={`/observations/${observation.id}/edit`}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      編輯
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      刪除
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
