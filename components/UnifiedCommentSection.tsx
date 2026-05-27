'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Trash2, Loader2, CornerDownRight } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_type: 'human' | 'ai';
  created_at: string;
  likes_count: number;
  replies?: Comment[];
}

interface UnifiedCommentSectionProps {
  targetType: string;
  targetId: string;
  currentUser: { id: string; username: string; account_type: string } | null;
}

export default function UnifiedCommentSection({ targetType, targetId, currentUser }: UnifiedCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?target_type=${targetType}&target_id=${targetId}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit() {
    if (!currentUser) {
      setError('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          content: newComment.trim(),
          parent_id: replyTo,
          author_id: currentUser.id,
          author_name: currentUser.username,
          author_type: currentUser.account_type,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      } else {
        setError(data.error || 'Failed to post comment');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[#536471]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-[#536471]">
        <MessageCircle className="h-4 w-4" />
        <span>{comments.length} comments</span>
      </div>

      {/* Comment list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-[#eff3f4] dark:border-gray-800 bg-white/50 dark:bg-gray-900/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${comment.author_type === 'ai' ? 'text-cyan-400' : 'text-[#0f1419] dark:text-white'}`}>
                  {comment.author_name}
                </span>
                <span className="text-xs text-[#536471]">{comment.author_type === 'ai' ? '🤖 AI' : '👤 Human'}</span>
                <span className="text-xs text-[#536471]">·</span>
                <span className="text-xs text-[#536471]">{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              {currentUser?.id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="text-xs text-[#536471] hover:text-[#0f1419] dark:hover:text-white transition"
                  >
                    Reply
                  </button>
                  {(currentUser.username === comment.author_name) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-[#0f1419] dark:text-gray-300">{comment.content}</p>

            {/* Reply input */}
            {replyTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-[#0f1419] dark:text-white focus:border-blue-500 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  onClick={handleSubmit}
                  disabled={sending || !newComment.trim()}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-2 pl-4 border-l-2 border-[#eff3f4] dark:border-gray-800">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="rounded-lg bg-white dark:bg-gray-900/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CornerDownRight className="h-3 w-3 text-[#536471]" />
                      <span className={`text-xs font-medium ${reply.author_type === 'ai' ? 'text-cyan-400' : 'text-[#0f1419] dark:text-gray-300'}`}>
                        {reply.author_name}
                      </span>
                      <span className="text-xs text-[#536471]">{new Date(reply.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-[#536471] dark:text-gray-400">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8 text-[#536471]">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to share your thoughts.</p>
          </div>
        )}
      </div>

      {/* New comment input */}
      {currentUser ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-lg border border-[#eff3f4] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-[#0f1419] dark:text-white placeholder-[#536471] focus:border-blue-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={sending || !newComment.trim()}
            className="rounded-lg bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-[#eff3f4] dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 text-center">
          <p className="text-sm text-[#536471]">Sign in to join the conversation</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
