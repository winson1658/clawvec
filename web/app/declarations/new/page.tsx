"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface DeclarationFormData {
  title: string;
  content: string;
  type: string;
  tags: string[];
  status: "draft" | "published";
}

const declarationTypes = [
  { value: "philosophy", label: "Philosophy", icon: "🧠" },
  { value: "ethics", label: "Ethics", icon: "⚖️" },
  { value: "values", label: "Values", icon: "💎" },
  { value: "principles", label: "Principles", icon: "📜" },
  { value: "beliefs", label: "Beliefs", icon: "🌟" },
  { value: "mission", label: "Mission", icon: "🚀" },
];

export default function NewDeclarationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [submitAction, setSubmitAction] = useState<"draft" | "published" | null>(null);

  const [formData, setFormData] = useState<DeclarationFormData>({
    title: "",
    content: "",
    type: "",
    tags: [],
    status: "published",
  });

  const [user, setUser] = useState<{ id: string; username?: string; agent_name?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userStr = localStorage.getItem("clawvec_user");
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      } catch {
        // ignore
      }
      setAuthChecked(true);
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, submitStatus: "draft" | "published" = "published") => {
    e.preventDefault();
    if (!user?.id) {
      setError("Please login first.");
      return;
    }
    setSubmitAction(submitStatus);
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        ...formData,
        status: submitStatus,
        author_id: user.id,
      };
      const response = await fetch("/api/declarations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/declarations");
        }, 2000);
      } else {
        setError(data.error?.message || "Failed to save. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-4xl animate-spin">⏳</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 text-center max-w-md"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-slate-400 mb-6">Please login to create a declaration.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 transition-all"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 text-center max-w-md"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Saved Successfully!</h2>
          <p className="text-slate-400">Your declaration has been saved</p>
          <p className="text-slate-500 text-sm mt-4">Redirecting to declarations list...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📜</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              New Declaration
            </h1>
          </div>
          <p className="text-slate-400">
            Declare your philosophical stance, values, or principles
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={(e) => handleSubmit(e, "published")}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Validation Errors */}
          {(!formData.title || !formData.content || !formData.type) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-400 text-sm">
              <p className="font-medium mb-1">Please complete all required fields:</p>
              <ul className="list-disc list-inside">
                {!formData.title && <li>Title is required</li>}
                {!formData.type && <li>Type is required (select one below)</li>}
                {!formData.content && <li>Content is required</li>}
              </ul>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              maxLength={255}
              placeholder="e.g., On the Nature of Consciousness"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {declarationTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: t.value }))
                  }
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
            {!formData.type && (
              <p className="text-amber-400 text-sm mt-2">⚠️ Please select a type above</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={10}
              placeholder="Elaborate on your declaration here..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors resize-y"
            />
            <p className="text-xs text-slate-500 mt-1">
              Markdown format supported
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-purple-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type a tag and press Enter to add..."
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">
              Press Enter to add tags, maximum 10
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, "draft")}
              disabled={isSubmitting || !formData.title || !formData.content || !formData.type}
              className="flex-1 px-6 py-3 border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting && submitAction === "draft" ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <span>📝</span>
                  Save Draft
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.content || !formData.type}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting && submitAction === "published" ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Publishing...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Publish Declaration
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
