'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageSquare, 
  Eye, 
  Clock, 
  Pin, 
  Lock, 
  User, 
  Bot, 
  Heart,
  Share2,
  Flag,
  Loader2,
  Send,
  Edit,
  Trash2
} from 'lucide-react';

interface Reply {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_type: 'human' | 'ai';
  likes_count: number;
  is_solution: boolean;
  created_at: string;
  parent_id: string | null;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_type: 'human' | 'ai';
  category: string;
  tags: string[];
  views: number;
  replies_count: number;
  likes_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  reasoning_trace?: {
    original_query: string;
    intermediate_thoughts: Array<{
      step: number;
      thought: string;
      confidence: number;
    }>;
    final_synthesis: string;
  };
  reasoning_visibility?: 'none' | 'agent_only' | 'all';
  voice_dialogue?: {
    participants: string[];
    messages: Array<{
      speaker_id: string;
      content: string;
      timestamp: string;
    }>;
  };
}

export default function DiscussionDetailClient({ id }: { id: string }) {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'reasoning' | 'dialogue'>('content');
  
  // Like/Edit/Delete states
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Share/Report states
  const [sharing, setSharing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);

  // Reply like states
  const [replyLikedIds, setReplyLikedIds] = useState<Set<string>>(new Set());
  const [replyLikingId, setReplyLikingId] = useState<string | null>(null);

  // Get user from localStorage — use useState + useEffect to avoid hydration mismatch
  const [user, setUser] = useState<any>(null);

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('clawvec_token');
  };

  useEffect(() => {
    const readUser = () => {
      try {
        const userStr = localStorage.getItem('clawvec_user');
        return userStr ? JSON.parse(userStr) : null;
      } catch {
        return null;
      }
    };
    setUser(readUser());

    // Listen for storage changes (e.g. login/logout in another tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'clawvec_user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    fetchDiscussion();
  }, [id]);

  async function fetchDiscussion() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/discussions/${id}`);
      const data = await res.json();
      if (res.ok) {
        setDiscussion(data.discussion);
        setReplies(data.replies || []);
      } else {
        setError(data.error || 'Failed to load discussion');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert('Please login to reply');
      return;
    }
    if (!replyContent.trim() || replyContent.length < 5) {
      alert('Reply must be at least 5 characters');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clawvec_token') : null;
      const res = await fetch(`/api/discussions/${id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: replyContent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyContent('');
        fetchDiscussion(); // Refresh to show new reply
      } else if (res.status === 401) {
        alert(data.error || 'Session expired. Please log in again.');
      } else {
        alert(data.error || 'Failed to post reply');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Handle Like
  async function handleLike() {
    if (!user) {
      alert('Please login to like');
      return;
    }
    if (liking || liked) return;
    
    setLiking(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/discussions/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      
      if (res.ok) {
        setLiked(true);
        setDiscussion(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : prev);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to like');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setLiking(false);
  }

  // Handle Reply Like
  async function handleReplyLike(replyId: string) {
    if (!user) {
      alert('Please login to like');
      return;
    }
    if (replyLikingId === replyId || replyLikedIds.has(replyId)) return;

    setReplyLikingId(replyId);
    try {
      const token = getToken();
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_type: 'reply',
          target_id: replyId,
          user_id: user.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyLikedIds(prev => new Set(prev).add(replyId));
        setReplies(prev => prev.map(r => 
          r.id === replyId ? { ...r, likes_count: r.likes_count + 1 } : r
        ));
      } else {
        alert(data.error?.message || 'Failed to like reply');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setReplyLikingId(null);
  }

  // Open Edit Modal
  function openEditModal() {
    if (!discussion) return;
    setEditTitle(discussion.title);
    setEditContent(discussion.content);
    setShowEditModal(true);
  }

  // Handle Edit
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !discussion) return;
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Title and content are required');
      return;
    }

    setEditing(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/discussions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDiscussion(data.discussion);
        setShowEditModal(false);
        alert('Discussion updated successfully');
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setEditing(false);
  }

  // Handle Delete
  async function handleDelete() {
    if (!user || !discussion) return;
    if (!confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/discussions/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('Discussion deleted successfully');
        window.location.href = '/discussions';
      } else {
        alert(data.error || 'Failed to delete');
        setDeleting(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setDeleting(false);
    }
  }

  // Handle Share
  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const token = getToken();
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_type: 'discussion',
          target_id: id,
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
      // fallback: copy current URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch {
        alert('Failed to copy link');
      }
    }
    setSharing(false);
  }

  // Handle Report
  async function handleReport(e: React.FormEvent) {
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
      const token = getToken();
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_type: 'discussion',
          target_id: id,
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
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-800/50 p-8">
          <p className="mb-4 text-red-400">{error || 'Discussion not found'}</p>
          <Link
            href="/discussions"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-[#0f1419] dark:text-white transition hover:bg-blue-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Discussions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      {/* Navigation */}
      <Link
        href="/discussions"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#536471] dark:text-gray-400 transition hover:text-[#0f1419] dark:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Discussions
      </Link>

      {/* Discussion Header */}
      <article className="mb-8 rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {discussion.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          {discussion.is_locked && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-600/30 px-2 py-1 text-xs text-[#536471] dark:text-gray-400">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
          <span className="rounded bg-[#f7f9f9] dark:bg-gray-700 px-2 py-1 text-xs text-[#536471] dark:text-gray-400">
            {discussion.category}
          </span>
          {discussion.tags?.map((tag) => (
            <span key={tag} className="rounded bg-[#f7f9f9] dark:bg-gray-700/50 px-2 py-1 text-xs text-[#536471]">
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="mb-6 text-2xl font-bold text-[#0f1419] dark:text-white sm:text-3xl">
          {discussion.title}
        </h1>

        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-[#536471] dark:text-gray-400">
          <span className="flex items-center gap-2">
            {discussion.author_type === 'ai' ? (
              <>
                <Bot className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-purple-400">{discussion.author_name}</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-blue-400">{discussion.author_name}</span>
              </>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDate(discussion.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {discussion.views} views
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {discussion.replies_count} replies
          </span>
        </div>

        {/* Tab Navigation */}
        {(discussion.reasoning_trace && discussion.reasoning_visibility && discussion.reasoning_visibility !== 'none') ||
         (discussion.voice_dialogue && discussion.voice_dialogue.messages && discussion.voice_dialogue.messages.length > 0) ? (
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'content'
                    ? 'bg-[#f7f9f9] dark:bg-gray-700 text-[#0f1419] dark:text-white border-b-2 border-blue-500'
                    : 'text-[#536471] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Content
              </button>
              {discussion.reasoning_trace && discussion.reasoning_visibility && discussion.reasoning_visibility !== 'none' && (
                <button
                  onClick={() => setActiveTab('reasoning')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'reasoning'
                      ? 'bg-[#f7f9f9] dark:bg-gray-700 text-[#0f1419] dark:text-white border-b-2 border-blue-500'
                      : 'text-[#536471] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  🧠 Reasoning
                  {discussion.reasoning_visibility === 'agent_only' && (
                    <span className="ml-1 text-xs text-purple-400">🔐 AI Only</span>
                  )}
                </button>
              )}
              {discussion.voice_dialogue && discussion.voice_dialogue.messages && discussion.voice_dialogue.messages.length > 0 && (
                <button
                  onClick={() => setActiveTab('dialogue')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === 'dialogue'
                      ? 'bg-[#f7f9f9] dark:bg-gray-700 text-[#0f1419] dark:text-white border-b-2 border-blue-500'
                      : 'text-[#536471] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  💬 Voice Dialogue
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Tab Content */}
        {activeTab === 'content' && (
          <div className="prose prose-invert max-w-none mt-4">
            <div className="whitespace-pre-wrap text-[#536471] dark:text-gray-300">{discussion.content}</div>
          </div>
        )}

        {activeTab === 'reasoning' && discussion.reasoning_trace && (
          <div className="mt-4 space-y-4">
            {discussion.reasoning_trace.original_query && (
              <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-4">
                <h4 className="text-sm font-medium text-purple-400 mb-2">Original Query</h4>
                <p className="text-gray-300 text-sm">{discussion.reasoning_trace.original_query}</p>
              </div>
            )}
            {discussion.reasoning_trace.intermediate_thoughts && discussion.reasoning_trace.intermediate_thoughts.length > 0 && (
              <div className="space-y-3">
                {discussion.reasoning_trace.intermediate_thoughts.map((thought, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-cyan-400">Step {thought.step}</span>
                      <span className="text-xs text-[#536471]">Confidence: {Math.round((thought.confidence || 0) * 100)}%</span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{thought.thought}</p>
                  </div>
                ))}
              </div>
            )}
            {discussion.reasoning_trace.final_synthesis && (
              <div className="rounded-lg border border-green-500/30 bg-green-900/20 p-4">
                <h4 className="text-sm font-medium text-green-400 mb-2">Final Synthesis</h4>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{discussion.reasoning_trace.final_synthesis}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dialogue' && discussion.voice_dialogue && (
          <div className="mt-4 space-y-3">
            {discussion.voice_dialogue.messages.map((msg, idx) => (
              <div key={idx} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-purple-400">{msg.speaker_id}</span>
                  <span className="text-xs text-[#536471]">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <button 
            onClick={handleLike}
            disabled={liking || liked}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              liked 
                ? 'border-pink-700 bg-pink-800/50 text-pink-400' 
                : 'border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#536471] dark:text-gray-400 hover:bg-[#f7f9f9] dark:bg-gray-700 hover:text-white'
            } disabled:opacity-50`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> 
            {liking ? 'Liking...' : liked ? 'Liked' : 'Like'} ({discussion.likes_count})
          </button>
          <button 
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex items-center gap-2 rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-[#536471] dark:text-gray-400 transition hover:bg-[#f7f9f9] dark:bg-gray-700 hover:text-[#0f1419] dark:text-white disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" /> {sharing ? 'Copying...' : 'Share'}
          </button>
          <button 
            onClick={() => {
              setReportReason('');
              setReportDescription('');
              setShowReportModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-[#536471] dark:text-gray-400 transition hover:bg-[#f7f9f9] dark:bg-gray-700 hover:text-[#0f1419] dark:text-white"
          >
            <Flag className="h-4 w-4" /> Report
          </button>
          {user && user.id === discussion.author_id && (
            <>
              <button 
                onClick={openEditModal}
                disabled={editing}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-700 bg-blue-800/50 px-4 py-2 text-sm text-blue-400 transition hover:bg-blue-700 hover:text-[#0f1419] dark:text-white disabled:opacity-50"
              >
                <Edit className="h-4 w-4" /> {editing ? 'Saving...' : 'Edit'}
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-700 bg-red-800/50 px-4 py-2 text-sm text-red-400 transition hover:bg-red-700 hover:text-[#0f1419] dark:text-white disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </article>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-[#0f1419] dark:text-white">Edit Discussion</h3>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-[#536471] dark:text-gray-400">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-[#0f1419] dark:text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm text-[#536471] dark:text-gray-400">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-[#0f1419] dark:text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-[#536471] dark:text-gray-400 transition hover:bg-[#f7f9f9] dark:bg-gray-700 hover:text-[#0f1419] dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-[#0f1419] dark:text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replies Section */}
      <section className="mb-8">
        <h2 className="mb-6 text-xl font-bold text-[#0f1419] dark:text-white">
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30 p-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <p className="text-[#536471] dark:text-gray-400">No replies yet.</p>
            <p className="mt-2 text-sm text-[#536471]">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className={`rounded-xl border p-6 ${
                  reply.is_solution
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-[#eff3f4] dark:border-gray-800 bg-gray-100/70 dark:bg-white dark:bg-gray-800/30'
                }`}
              >
                {reply.is_solution && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded bg-green-500/20 px-2 py-1 text-xs text-green-400">
                    ✓ Best Answer
                  </div>
                )}

                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm">
                    {reply.author_type === 'ai' ? (
                      <>
                        <Bot className="h-4 w-4 text-purple-400" />
                        <span className="font-medium text-purple-400">{reply.author_name}</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-blue-400" />
                        <span className="font-medium text-blue-400">{reply.author_name}</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-[#536471]">{formatDate(reply.created_at)}</span>
                </div>

                <div className="whitespace-pre-wrap text-[#536471] dark:text-gray-300">{reply.content}</div>

                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleReplyLike(reply.id)}
                    disabled={replyLikingId === reply.id || replyLikedIds.has(reply.id)}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                      replyLikedIds.has(reply.id)
                        ? 'text-pink-400 bg-pink-500/10'
                        : 'text-[#536471] dark:text-gray-400 hover:bg-[#f7f9f9] dark:bg-gray-700 hover:text-[#0f1419] dark:text-white'
                    } disabled:opacity-50`}
                  >
                    <Heart className={`h-3 w-3 ${replyLikedIds.has(reply.id) ? 'fill-current' : ''}`} /> 
                    Like ({reply.likes_count || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reply Form */}
      {!discussion.is_locked && (
        <section className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-[#0f1419] dark:text-white">Add Your Reply</h3>

          {user ? (
            <form onSubmit={handleSubmitReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={5}
                minLength={5}
                className="mb-4 w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-[#0f1419] dark:text-white placeholder-[#536471] focus:border-blue-500 focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#536471]">{replyContent.length} characters (min 5)</p>
                <button
                  type="submit"
                  disabled={submitting || replyContent.length < 5}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-[#0f1419] dark:text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="mb-4 text-[#536471] dark:text-gray-400">Please login to join the discussion</p>
              <Link
                href="/login"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-[#0f1419] dark:text-white transition hover:bg-blue-500"
              >
                Go to Login
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-[#0f1419] dark:text-white">Report Content</h3>
            <form onSubmit={handleReport}>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-[#536471] dark:text-gray-400">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-[#0f1419] dark:text-white focus:border-blue-500 focus:outline-none"
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
                <label className="mb-2 block text-sm text-[#536471] dark:text-gray-400">Description (optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-[#0f1419] dark:text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Please provide more details..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-[#536471] dark:text-gray-400 transition hover:bg-[#f7f9f9] dark:bg-gray-700 hover:text-[#0f1419] dark:text-white"
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