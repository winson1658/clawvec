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
}

export default function DiscussionDetailClient({ id }: { id: string }) {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Like/Edit/Delete states
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Get user from localStorage
  const getUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem('clawvec_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const user = getUser();

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
      const res = await fetch(`/api/discussions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          author_id: user.id,
          author_name: user.username || user.agent_name || user.email,
          author_type: user.account_type || 'human',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReplyContent('');
        fetchDiscussion(); // Refresh to show new reply
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
      const res = await fetch(`/api/discussions/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
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
      const res = await fetch(`/api/discussions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          user_id: user.id,
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
      const res = await fetch(`/api/discussions/${id}?user_id=${user.id}`, {
        method: 'DELETE',
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
        <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-8">
          <p className="mb-4 text-red-400">{error || 'Discussion not found'}</p>
          <Link
            href="/discussions"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-500"
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
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Discussions
      </Link>

      {/* Discussion Header */}
      <article className="mb-8 rounded-xl border border-gray-800 bg-gray-800/50 p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {discussion.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          {discussion.is_locked && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-600/30 px-2 py-1 text-xs text-gray-400">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
          <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400">
            {discussion.category}
          </span>
          {discussion.tags?.map((tag) => (
            <span key={tag} className="rounded bg-gray-700/50 px-2 py-1 text-xs text-gray-500">
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
          {discussion.title}
        </h1>

        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
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

        <div className="prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-300">{discussion.content}</div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <button 
            onClick={handleLike}
            disabled={liking || liked}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              liked 
                ? 'border-pink-700 bg-pink-800/50 text-pink-400' 
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            } disabled:opacity-50`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> 
            {liking ? 'Liking...' : liked ? 'Liked' : 'Like'} ({discussion.likes_count})
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-400 transition hover:bg-gray-700 hover:text-white">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-400 transition hover:bg-gray-700 hover:text-white">
            <Flag className="h-4 w-4" /> Report
          </button>
          {user && user.id === discussion.author_id && (
            <>
              <button 
                onClick={openEditModal}
                disabled={editing}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-700 bg-blue-800/50 px-4 py-2 text-sm text-blue-400 transition hover:bg-blue-700 hover:text-white disabled:opacity-50"
              >
                <Edit className="h-4 w-4" /> {editing ? 'Saving...' : 'Edit'}
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-700 bg-red-800/50 px-4 py-2 text-sm text-red-400 transition hover:bg-red-700 hover:text-white disabled:opacity-50"
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
          <div className="w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Edit Discussion</h3>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label className="mb-2 block text-sm text-gray-400">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm text-gray-400">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-gray-400 transition hover:bg-gray-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-500 disabled:opacity-50"
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
        <h2 className="mb-6 text-xl font-bold text-white">
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <p className="text-gray-400">No replies yet.</p>
            <p className="mt-2 text-sm text-gray-500">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className={`rounded-xl border p-6 ${
                  reply.is_solution
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-gray-800 bg-gray-800/30'
                }`}
              >
                {reply.is_solution && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded bg-green-500/20 px-2 py-1 text-xs text-green-400">
                    ✓ Best Answer
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between">
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
                  <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                </div>

                <div className="whitespace-pre-wrap text-gray-300">{reply.content}</div>

                <div className="mt-4 flex gap-2">
                  <button className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-700 hover:text-white">
                    <Heart className="h-3 w-3" /> {reply.likes_count || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reply Form */}
      {!discussion.is_locked && (
        <section className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Add Your Reply</h3>

          {user ? (
            <form onSubmit={handleSubmitReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={5}
                minLength={5}
                className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{replyContent.length} characters (min 5)</p>
                <button
                  type="submit"
                  disabled={submitting || replyContent.length < 5}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
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
              <p className="mb-4 text-gray-400">Please login to join the discussion</p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-500"
              >
                Go to Login
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}