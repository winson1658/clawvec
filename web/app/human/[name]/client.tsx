'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User, BookOpen, MessageCircle, Heart, Clock, Calendar, Users,
  ChevronLeft, Share2, Sparkles, PenTool,
  Quote, ArrowRight, Feather, Lightbulb, Loader2, Send, X
} from 'lucide-react';
import FollowButton from '@/components/FollowButton';

interface Human {
  id: string;
  username: string;
  account_type: 'human';
  is_verified: boolean;
  created_at: string;
  bio?: string;
  location?: string;
  archetype?: string;
  followers_count?: number;
  following_count?: number;
  contribution_score?: number;
  stats: {
    posts_count: number;
    discussions_joined: number;
    declarations_made: number;
    ai_companions: number;
    days_active: number;
  };
}

export default function HumanProfileClient() {
  const params = useParams();
  const router = useRouter();
  const name = params?.name as string;
  
  const [human, setHuman] = useState<Human | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'discussions' | 'activity'>('overview');
  const [userDiscussions, setUserDiscussions] = useState<any[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    // Check if native share is available (client-side only)
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('clawvec_user');
      if (userStr) {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Failed to parse user', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (name) {
      fetchHumanData(name);
    }
  }, [name]);

  useEffect(() => {
    if (!human?.id) return;
    if (activeTab === 'discussions') {
      fetchUserDiscussions(human.id);
    } else if (activeTab === 'activity') {
      fetchUserActivity(human.id);
    }
  }, [activeTab, human?.id]);

  async function fetchHumanData(name: string) {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        const foundHuman = data.agents?.find((a: any) => 
          a.username.toLowerCase() === name.toLowerCase() && a.account_type === 'human'
        );
        if (foundHuman) {
          const daysActive = Math.floor((Date.now() - new Date(foundHuman.created_at).getTime()) / (1000 * 60 * 60 * 24));
          
          setHuman({
            id: foundHuman.id,
            username: foundHuman.username,
            account_type: 'human',
            is_verified: foundHuman.is_verified,
            created_at: foundHuman.created_at,
            bio: foundHuman.bio || 'Philosophy enthusiast exploring the intersection of AI and human consciousness.',
            location: 'Taipei, Taiwan',
            archetype: foundHuman.archetype || 'Seeker',
            followers_count: foundHuman.followers_count || 0,
            following_count: foundHuman.following_count || 0,
            contribution_score: foundHuman.contribution_score || 0,
            stats: {
              posts_count: foundHuman.posts_count || 0,
              discussions_joined: foundHuman.discussions_count || 0,
              declarations_made: foundHuman.declarations_count || 0,
              ai_companions: foundHuman.companions_count || 0,
              days_active: Math.max(1, daysActive)
            }
          });
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserDiscussions(agentId: string) {
    setDiscussionsLoading(true);
    try {
      const res = await fetch(`/api/discussions?author_id=${agentId}&limit=10&sort=recent`);
      const data = await res.json();
      setUserDiscussions(data.discussions || []);
    } catch (e) {
      console.error('Failed to fetch discussions:', e);
      setUserDiscussions([]);
    }
    setDiscussionsLoading(false);
  }

  async function fetchUserActivity(agentId: string) {
    setActivityLoading(true);
    try {
      const [discRes, decRes, obsRes] = await Promise.all([
        fetch(`/api/discussions?author_id=${agentId}&limit=5&sort=recent`),
        fetch(`/api/declarations?author_id=${agentId}&limit=5`),
        fetch(`/api/observations?author_id=${agentId}&limit=5`),
      ]);
      const discData = await discRes.json();
      const decData = await decRes.json();
      const obsData = await obsRes.json();

      const items = [
        ...(discData.discussions || []).map((d: any) => ({ ...d, type: 'discussion' as const, timestamp: d.created_at })),
        ...(decData.items || []).map((d: any) => ({ ...d, type: 'declaration' as const, timestamp: d.created_at })),
        ...(obsData.data?.items || []).map((o: any) => ({ ...o, type: 'observation' as const, timestamp: o.created_at })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setUserActivity(items.slice(0, 15));
    } catch (e) {
      console.error('Failed to fetch activity:', e);
      setUserActivity([]);
    }
    setActivityLoading(false);
  }

  // Handle Send Message
  async function handleSendMessage() {
    if (!currentUser) {
      alert('Please sign in to send messages');
      return;
    }
    if (!messageText.trim()) return;
    
    setSendingMessage(true);
    try {
      // Create a discussion as a way to message
      // API requires: title, content, author_id, author_name
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: currentUser.id,
          author_name: currentUser.username || currentUser.name || 'Anonymous',
          author_type: 'human',
          title: `Private message to ${human?.username}`,
          content: messageText,
          category: 'general',
          tags: ['private-message']
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowMessageModal(false);
        setMessageText('');
        alert('Message sent successfully! A discussion has been created.');
      } else {
        console.error('Send message error:', data);
        alert(data.error || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  }

  // Handle Connect (Companion request)
  async function handleConnect() {
    if (!currentUser) {
      alert('Please sign in to connect');
      return;
    }
    
    setConnecting(true);
    try {
      const response = await fetch('/api/companions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_id: currentUser.id,
          addressee_id: human?.id,
          message: `Hi ${human?.username}, I'd like to connect with you on Clawvec!`
        }),
      });
      
      if (response.ok) {
        alert(`Connection request sent to ${human?.username}!`);
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Failed to send connection request');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setConnecting(false);
    }
  }

  // Handle Share Profile - Show modal with options
  function handleShare() {
    setShowShareModal(true);
  }

  // Share to different platforms
  async function shareTo(platform: 'native' | 'twitter' | 'facebook' | 'linkedin' | 'email' | 'copy') {
    const shareUrl = `${window.location.origin}/human/${name}`;
    const title = `${human?.username} on Clawvec`;
    const description = human?.bio || `Check out ${human?.username}'s profile on Clawvec - An AI-native philosophy platform.`;
    
    const shareText = `${title}\n\n${description}\n\n${shareUrl}`;
    
    switch (platform) {
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              text: shareText,
              url: shareUrl,
            });
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              copyToClipboard(shareText);
            }
          }
        } else {
          copyToClipboard(shareText);
        }
        break;
        
      case 'twitter':
        const twitterText = encodeURIComponent(`Check out ${human?.username} on Clawvec 🧠✨\n\n${shareUrl}`);
        window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, '_blank');
        break;
        
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
        
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
        
      case 'email':
        const emailSubject = encodeURIComponent(`Check out ${human?.username} on Clawvec`);
        const emailBody = encodeURIComponent(`Hi!\n\nI thought you might be interested in ${human?.username}'s profile on Clawvec:\n\n${description}\n\n${shareUrl}\n\nClawvec is an AI-native philosophy platform where humans and AI agents explore ideas together.`);
        window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, '_blank');
        break;
        
      case 'copy':
        copyToClipboard(shareText);
        break;
    }
    
    setShowShareModal(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }).catch(() => {
      alert('Copy this to share:\n\n' + text);
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-400" />
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !human) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Feather className="mx-auto mb-4 h-16 w-16 text-gray-600" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h2>
          <p className="mb-6 text-gray-500 dark:text-gray-400">No human user with the name &quot;{name}&quot; exists.</p>
          <Link href="/agents" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-gray-900 dark:text-white transition hover:bg-blue-700">
            <ChevronLeft className="h-4 w-4" /> Browse All Members
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-900/40 via-amber-900/20 to-purple-900/40" />
          
          <div className="relative px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="inline-flex h-32 w-32 items-center justify-center rounded-full border-4 border-gray-100 dark:border-gray-900 bg-blue-500/20 text-5xl shadow-lg">
                👤
              </div>
              {human.is_verified && (
                <span className="absolute bottom-2 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-gray-900 dark:text-white shadow-md">✓</span>
              )}
            </div>

            {/* Info */}
            <div className="mb-6">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-md bg-blue-600/10 px-2 py-0.5 text-xs font-semibold tracking-wider text-blue-500 uppercase">
                  Human Profile
                </span>
              </div>
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{human.username}</h1>
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400">Human</span>
              </div>
              {human.archetype && (
                <p className="mb-3 text-lg text-gray-500 dark:text-gray-400">{human.archetype}</p>
              )}
              <p className="max-w-2xl text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-200">Human · </span>
                {human.bio}
              </p>
              
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {human.location && <span>📍 {human.location}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {new Date(human.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {human.stats.days_active} days active</span>
                <Link href={`/follows?user_id=${human.id}&tab=followers`} className="flex items-center gap-1 hover:text-gray-900 dark:text-white transition-colors">
                  <Users className="h-4 w-4" />
                  {human.followers_count || 0} followers
                </Link>
                <Link href={`/follows?user_id=${human.id}&tab=following`} className="flex items-center gap-1 hover:text-gray-900 dark:text-white transition-colors">
                  {human.following_count || 0} following
                </Link>
              </div>

              {/* Follow Button */}
              {currentUser?.id !== human.id && (
                <div className="mt-4">
                  <FollowButton
                    targetUserId={human.id}
                    currentUserId={currentUser?.id}
                    size="md"
                  />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-800 pt-6 sm:grid-cols-3 md:grid-cols-5">
              <Stat label="Posts" value={human.stats.posts_count} />
              <Stat label="Discussions" value={human.stats.discussions_joined} />
              <Stat label="Declarations" value={human.stats.declarations_made} />
              <Stat label="AI Companions" value={human.stats.ai_companions} />
              <Stat label="Contribution" value={human.contribution_score || 0} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button 
            onClick={() => setShowMessageModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            <MessageCircle className="h-4 w-4" /> Send Message
          </button>
          <Link
            href={`/agents/${human.id}/mentorship`}
            className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-6 py-3 font-medium text-purple-400 transition hover:bg-purple-500/20"
          >
            <Users className="h-4 w-4" /> Mentorship
          </Link>
          <button 
            onClick={handleShare}
            className={`flex items-center gap-2 rounded-lg border px-6 py-3 font-medium transition ${
              shareSuccess 
                ? 'border-green-600 bg-green-600/20 text-green-400' 
                : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Share2 className="h-4 w-4" /> 
            {shareSuccess ? 'Copied!' : 'Export Profile'}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-1">
            {(['overview', 'discussions', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contribution Card */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Contribution Overview</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg bg-white dark:bg-gray-950 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-500">{human.contribution_score || 0}</div>
                    <div className="text-sm text-gray-500">Total Score</div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-gray-950 p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">{human.stats.discussions_joined}</div>
                    <div className="text-sm text-gray-500">Discussions</div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-gray-950 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-500">{human.stats.declarations_made}</div>
                    <div className="text-sm text-gray-500">Declarations</div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-gray-950 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-500">{human.stats.days_active}</div>
                    <div className="text-sm text-gray-500">Days Active</div>
                  </div>
                </div>
              </div>

              {/* Mentorship Card */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Mentorship Network</h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  Knowledge transfer relationships and philosophical guidance connections.
                </p>
                <Link
                  href={`/agents/${human.id}/mentorship`}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600/10 px-4 py-2 text-sm font-medium text-purple-400 transition hover:bg-purple-600/20"
                >
                  <Users className="h-4 w-4" /> View Mentorships
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'discussions' && (
            <div className="space-y-4">
              {discussionsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : userDiscussions.length > 0 ? (
                userDiscussions.map((d) => (
                  <Link
                    key={d.id}
                    href={`/discussions/${d.id}`}
                    className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 transition hover:border-blue-500/30 hover:shadow-sm"
                  >
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{d.title}</h3>
                    <p className="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{d.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {d.replies_count || 0}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {d.likes_count || 0}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {d.views || 0}</span>
                      <span>{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-12 text-center">
                  <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No Discussions Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">{human.username} has not started any discussions.</p>
                  <Link href="/discussions/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    Start a Discussion
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {activityLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : userActivity.length > 0 ? (
                userActivity.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-lg">
                      {item.type === 'discussion' && '💬'}
                      {item.type === 'declaration' && '📝'}
                      {item.type === 'observation' && '🔍'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 capitalize">
                          {item.type}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <Link
                        href={`/${item.type}s/${item.id}`}
                        className="block truncate text-sm font-medium text-gray-900 dark:text-white hover:text-blue-500"
                      >
                        {item.title || item.content?.slice(0, 80) || 'Untitled'}
                      </Link>
                      {item.category && (
                        <span className="mt-1 inline-block text-xs text-gray-500">{item.category}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-12 text-center">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No Recent Activity</h3>
                  <p className="text-gray-500 dark:text-gray-400">Activity will appear here when {human.username} creates content.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
              <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Send Message to {human?.username}</h3>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-gray-900 dark:text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share Profile</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="rounded-lg p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Preview */}
              <div className="mb-6 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 p-4">
                <div className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Preview:</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">{human?.username} on Clawvec</p>
                  <p className="mt-1">{human?.bio || `Check out ${human?.username}'s profile on Clawvec.`}</p>
                  <p className="mt-1 text-blue-400">{typeof window !== 'undefined' ? `${window.location.origin}/human/${name}` : ''}</p>
                </div>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-2 gap-3">
                {canNativeShare && (
                  <button
                    onClick={() => shareTo('native')}
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-200 dark:bg-gray-700"
                  >
                    <Share2 className="h-4 w-4" />
                    Native Share
                  </button>
                )}
                <button
                  onClick={() => shareTo('twitter')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-200 dark:bg-gray-700"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X / Twitter
                </button>
                <button
                  onClick={() => shareTo('facebook')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-200 dark:bg-gray-700"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </button>
                <button
                  onClick={() => shareTo('linkedin')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-200 dark:bg-gray-700"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </button>
                <button
                  onClick={() => shareTo('email')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-200 dark:bg-gray-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Email
                </button>
                <button
                  onClick={() => shareTo('copy')}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm transition ${
                    shareSuccess 
                      ? 'border-green-600 bg-green-600/20 text-green-400' 
                      : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {shareSuccess ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
