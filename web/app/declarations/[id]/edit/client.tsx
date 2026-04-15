"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface Declaration {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  type: string;
  tags: string[];
}

const typeLabels: Record<string, string> = {
  philosophy: "🧠 Philosophy",
  ethics: "⚖️ Ethics",
  values: "💎 Values",
  principles: "📜 Principles",
  beliefs: "🌟 Beliefs",
  mission: "🚀 Mission",
};

const declarationTypes = [
  { value: "philosophy", label: "Philosophy", icon: "🧠" },
  { value: "ethics", label: "Ethics", icon: "⚖️" },
  { value: "values", label: "Values", icon: "💎" },
  { value: "principles", label: "Principles", icon: "📜" },
  { value: "beliefs", label: "Beliefs", icon: "🌟" },
  { value: "mission", label: "Mission", icon: "🚀" },
];

export default function EditDeclarationClient({ id }: { id: string }) {
  const router = useRouter();
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "philosophy",
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
    fetchDeclaration();
  }, [id]);

  const fetchDeclaration = async () => {
    try {
      const response = await fetch(`/api/declarations/${id}`);
      const data = await response.json();

      if (data.success) {
        const found = data.data?.declaration || data.declaration;
        setDeclaration(found);
        setFormData({
          title: found.title || "",
          content: found.content || "",
          type: found.type || "philosophy",
          tags: found.tags?.join(", ") || "",
        });
      } else {
        setError(data.error?.message || "Declaration not found");
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
      const response = await fetch(`/api/declarations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title: formData.title,
          content: formData.content,
          type: formData.type,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/declarations/${id}`);
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

  if (error || !declaration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">{error || "Content Not Found"}</h2>
          <Link href="/declarations" className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block">
            ← Back to Declarations
          </Link>
        </div>
      </div>
    );
  }

  // Check permission
  if (user && user.id !== declaration.author_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-4">Only the author can edit this content</p>
          <Link href={`/declarations/${id}`} className="text-cyan-400 hover:text-cyan-300">
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
          <Link href={`/declarations/${id}`} className="text-slate-400 hover:text-white flex items-center gap-2">
            <span>←</span> Back
          </Link>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8"
        >
          <h1 className="text-2xl font-bold text-white mb-6">Edit Declaration</h1>

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

            {/* Type */}
            <div>
              <label className="block text-slate-400 mb-2">Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {declarationTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: t.value }))}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.type === t.value
                        ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-lg shadow-cyan-400/20"
                        : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500 hover:bg-slate-700"
                    }`}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-sm font-medium">{t.label}</span>
                    {formData.type === t.value && (
                      <span className="ml-auto text-cyan-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
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
                placeholder="philosophy, ethics, future..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Link
                href={`/declarations/${id}`}
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
