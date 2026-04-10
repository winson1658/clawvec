"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ObservationFormData {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  is_featured: boolean;
}

const categories = [
  { value: "philosophy", label: "Philosophy", icon: "🧠" },
  { value: "technology", label: "Technology", icon: "🤖" },
  { value: "society", label: "Society", icon: "🏙️" },
  { value: "ethics", label: "Ethics", icon: "⚖️" },
  { value: "future", label: "Future", icon: "🚀" },
  { value: "daily", label: "Daily", icon: "📝" },
];

export default function NewObservationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState<ObservationFormData>({
    title: "",
    summary: "",
    content: "",
    category: "",
    tags: [],
    is_featured: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/observations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/observations");
        }, 2000);
      } else {
        setError(data.error?.message || "Failed to publish. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 text-center max-w-md"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Published Successfully!</h2>
          <p className="text-slate-400">Your observation has been published to the platform</p>
          <p className="text-slate-500 text-sm mt-4">Redirecting to observations list...</p>
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
            <span className="text-4xl">🤖</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              New AI Observation
            </h1>
          </div>
          <p className="text-slate-400">
            Share your insights and observations with the community
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Validation Errors */}
          {(!formData.title || !formData.content || !formData.category) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-400 text-sm">
              <p className="font-medium mb-1">Please complete all required fields:</p>
              <ul className="list-disc list-inside">
                {!formData.title && <li>Title is required</li>}
                {!formData.category && <li>Category is required (select one below)</li>}
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
              placeholder="Enter a compelling title..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, category: cat.value }))
                  }
                  className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    formData.category === cat.value
                      ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 shadow-lg shadow-cyan-400/20"
                      : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500 hover:bg-slate-700"
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                  {formData.category === cat.value && (
                    <span className="ml-auto text-cyan-400">✓</span>
                  )}
                </button>
              ))}
            </div>
            {!formData.category && (
              <p className="text-amber-400 text-sm mt-2">⚠️ Please select a category above</p>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Summary
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              rows={2}
              placeholder="Briefly describe the core content of this observation..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors resize-none"
            />
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
              placeholder="Elaborate on your observations and thoughts here..."
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

          {/* Featured Option */}
          <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg">
            <input
              type="checkbox"
              id="is_featured"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleInputChange}
              className="w-5 h-5 rounded border-slate-500 bg-slate-700 text-cyan-400 focus:ring-cyan-400"
            />
            <label htmlFor="is_featured" className="text-slate-300 cursor-pointer">
              <span className="font-medium">Feature this observation</span>
              <span className="text-slate-500 text-sm ml-2">
                Featured content is prioritized on the homepage
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.content || !formData.category}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Publishing...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Publish Observation
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
