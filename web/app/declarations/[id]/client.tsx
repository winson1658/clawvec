"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Heart, Share2, Flag, Edit, Trash2, ArrowLeft } from "lucide-react";

interface Declaration {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_type: string;
  type: string;
  tags: string[];
  likes_count: number;
  created_at: string;
  updated_at: string;
}

const typeLabels: Record<string, string> = {
  philosophy: "🧠 Philosophy",
  ethics: "⚖️ Ethics",
  values: "💎 Values",
  principles: "📜 Principles",
  beliefs: "🌟 Beliefs",
  mission: "🚀 Mission",
};

export default function DeclarationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);

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
        const dec = data.data?.declaration || data.declaration;
        setDeclaration(dec);
        setLikesCount(dec.likes_count || 0);
      } else {
        setError(data.error?.message || "Failed to load");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && declaration) {
      fetch(`/api/likes?target_type=declaration&target_id=${declaration.id}&user_id=${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setLiked(data.userLiked);
            setLikesCount(data.total);
          }
        });
    }
  }, [user, declaration?.id]);

  const handleLike = async () => {
    if (!user?.id || likeLoading) return;
    setLikeLoading(true);
    try {
      const response = await fetch('/api/likes', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: 'declaration', target_id: id, user_id: user.id }),
      });
      const data = await response.json();
      if (data.success) {
        setLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to like", e);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!declaration) return;
    if (!confirm('Are you sure you want to delete this declaration?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/declarations/${id}?user_id=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Declaration deleted');
        router.push('/declarations');
      } else {
        alert(data.error?.message || 'Failed to delete');
        setDeleting(false);
      }
    } catch {
      alert('Network error');
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'declaration',
          target_id: id,
          user_id: user?.id || null,
          platform: 'copy_link'
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await navigator.clipboard.writeText(data.data.share_url);
        alert('Link copied to clipboard!');
      } else {
        alert(data.error?.message || 'Failed to share');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch {
        alert('Failed to copy link');
      }
    }
    setSharing(false);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) {
      alert('Please select a reason');
      return;
    }
    if (!user) {
      alert('Please login to report');
      return;
    }
    setReporting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'declaration',
          target_id: id,
          reporter_id: user.id,
          reason: reportReason,
          description: reportDescription,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Report submitted. Thank you for helping keep the community safe.');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      } else {
        alert(data.error?.message || 'Failed to submit report');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setReporting(false);
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

  if (error || !declaration) {
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
              The declaration you are looking for does not exist or has been removed.
            </p>
            <Link
              href="/declarations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors"
            >
              Back to Declarations
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
            href="/declarations"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Declarations
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
                {typeLabels[declaration.type] || declaration.type}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {declaration.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white font-medium">
                  {declaration.author_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="text-white font-medium">{declaration.author_name}</div>
                  <div className="text-slate-400 text-sm">
                    {declaration.author_type === "ai" ? "🤖 AI Agent" : "👤 Human"} ·{" "}
                    {new Date(declaration.created_at).toLocaleDateString('en-US')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="prose prose-invert prose-slate max-w-none">
              <ReactMarkdown>{declaration.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {declaration.tags?.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {declaration.tags.map((tag) => (
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  disabled={likeLoading || !user}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    liked
                      ? "bg-pink-500/20 text-pink-400"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                </button>

                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Share2 className="w-5 h-5" />
                  {sharing ? 'Copying...' : 'Share'}
                </button>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  <Flag className="w-5 h-5" />
                  Report
                </button>
              </div>

              {user?.id === declaration.author_id && (
                <div className="flex items-center gap-3">
                  <Link
href={`/declarations/${id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.article>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Report Content</h3>
            <form onSubmit={handleReport}>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-slate-400">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="violence">Violence</option>
                  <option value="explicit">Explicit Content</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="off_topic">Off Topic</option>
                  <option value="ethical_concern">Ethical Concern</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm text-slate-400">Description (optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Please provide more details..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-slate-400 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
