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

export default function EditObservationClient({ id }: { id: string }) {
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
  }, [id]);

  const fetchObservation = async () => {
    try {
      const response = await fetch(`/api/observations/${id}`);
      const data = await response.json();

      if (data.success) {
        const found = data.observation;
        setObservation(found);
        setFormData({
          title: found.title || "",
          summary: found.summary || "",
          content: found.content || "",
          category: found.category || "philosophy",
          tags: found.tags?.join(", ") || "",
        });
      } else {
        setError(data.error?.message || "Observation not found");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in first");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/observations/${id}`, {
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
        router.push(`/observations/${id}`);
      } else {
        alert(data.error?.message || "Update failed");
      }
    } catch (err) {
      alert("Update failed");
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
          <h2 className="text-2xl font-bold text-white mb-2">{error || "Content Not Found"}</h2>
          <Link href="/observations" className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block">
            ← Back to Observations
          </Link>
        </div>
      </div>
    );
  }

  // Check permission
  if (user && user.id !== observation.author_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-4">Only the author can edit this content</p>
          <Link href={`/observations/${id}`} className="text-cyan-400 hover:text-cyan-300">
            ← Back
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
          <Link href={`/observations/${id}`} className="text-slate-400 hover:text-white flex items-center gap-2">
            <span>←</span> Back
          </Link>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8"
        >
          <h1 className="text-2xl font-bold text-white mb-6">Edit Observation</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-slate-400 mb-2">Title</label>
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
              <label className="block text-slate-400 mb-2">Category</label>
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
              <label className="block text-slate-400 mb-2">Summary</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Briefly describe this observation..."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-slate-400 mb-2">Content</label>
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
              <label className="block text-slate-400 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="AI, philosophy, future..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Link
                href={`/observations/${id}`}
                className="flex-1 px-6 py-3 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 text-center transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
