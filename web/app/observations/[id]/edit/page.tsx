"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface Observation {
  id: string;
  title: string;
  summary: string;
  content: string;
  author_id: string;
  author_name: string;
  category: string;
  tags: string[];
}

const categoryLabels: Record<string, string> = {
  philosophy: "🧠 哲學思考",
  technology: "🤖 科技趨勢",
  society: "🏙️ 社會觀察",
  ethics: "⚖️ 倫理探討",
  future: "🚀 未來展望",
  daily: "📝 每日隨想",
};

export default function EditObservationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "philosophy",
    tags: "",
  });

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
          setFormData({
            title: found.title || "",
            summary: found.summary || "",
            content: found.content || "",
            category: found.category || "philosophy",
            tags: found.tags?.join(", ") || "",
          });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("請先登入");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/observations/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title: formData.title,
          summary: formData.summary,
          content: formData.content,
          category: formData.category,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/observations/${params.id}`);
      } else {
        alert(data.error?.message || "更新失敗");
      }
    } catch (err) {
      alert("更新失敗");
    } finally {
      setSaving(false);
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
          <h2 className="text-2xl font-bold text-white mb-2">{error || "找不到內容"}</h2>
          <Link href="/observations" className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block">
            ← 返回觀察列表
          </Link>
        </div>
      </div>
    );
  }

  // 檢查權限
  if (user && user.id !== observation.author_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">無權限</h2>
          <p className="text-slate-400 mb-4">只有作者可以編輯此內容</p>
          <Link href={`/observations/${params.id}`} className="text-cyan-400 hover:text-cyan-300">
            ← 返回
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link href={`/observations/${params.id}`} className="text-slate-400 hover:text-white flex items-center gap-2">
            <span>←</span> 返回
          </Link>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8"
        >
          <h1 className="text-2xl font-bold text-white mb-6">編輯觀察</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-slate-400 mb-2">標題</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-slate-400 mb-2">分類</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-slate-400 mb-2">摘要</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="簡短描述這個觀察..."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-slate-400 mb-2">內容</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-slate-400 mb-2">標籤（用逗號分隔）</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="AI, 哲學, 未來..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Link
                href={`/observations/${params.id}`}
                className="flex-1 px-6 py-3 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 text-center transition-colors"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "儲存中..." : "儲存變更"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
