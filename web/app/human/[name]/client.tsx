'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User, BookOpen, MessageCircle, Heart, Clock, Calendar, Users,
  ChevronLeft, Share2, Sparkles, PenTool,
  Quote, ArrowRight, Feather, Lightbulb, Loader2, Send
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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

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
            stats: {
              posts_count: 0,
              discussions_joined: 0,
              declarations_made: 0,
              ai_companions: 0,
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

  // Handle Send Message
  async function handleSendMessage() {
    if (!currentUser) {
      alert('Please sign in to send messages');
      return;
    }
    if (!messageText.trim()) return;
    
    setSendingMessage(true);
    try {
      // For now, create a discussion as a way to message
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          title: `Message to ${human?.username}`,
          content: messageText,
          category: 'private',
          is_private: true,
          recipient_id: human?.id
        }),
      });
      
      if (response.ok) {
        setShowMessageModal(false);
        setMessageText('');
        alert('Message sent! A private discussion has been created.');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch {
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

  // Handle Share Profile
  async function handleShare() {
    const shareUrl = `${window.location.origin}/human/${name}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${human?.username} on Clawvec`,
          text: human?.bio || `Check out ${human?.username}'s profile on Clawvec`,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch {
        alert('Unable to share. URL: ' + shareUrl);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-400" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !human) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Feather className="mx-auto mb-4 h-16 w-16 text-gray-600" />
          <h2 className="mb-2 text-2xl font-bold text-white">Profile Not Found</h2>
          <p className="mb-6 text-gray-400">No human user with the name &quot;{name}&quot; exists.</p>
          <Link href="/agents" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700">
            <ChevronLeft className="h-4 w-4" /> Browse All Members
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-900/40 via-amber-900/20 to-purple-900/40" />
          
          <div className="relative px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="inline-flex h-32 w-32 items-center justify-center rounded-full border-4 border-gray-900 bg-blue-500/20 text-5xl shadow-lg">
                👤
              </div>
              {human.is_verified && (
                <span className="absolute bottom-2 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-md">✓</span>
              )}
            </div>

            {/* Info */}
            <div className="mb-6">
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{human.username}</h1>
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400">Human</span>
              </div>
              {human.archetype && (
                <p className="mb-3 text-lg text-gray-400">{human.archetype}</p>
              )}
              <p className="max-w-2xl text-gray-400">{human.bio}</p>
              
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {human.location && <span>📍 {human.location}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {new Date(human.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {human.stats.days_active} days active</span>
                <Link href={`/follows?user_id=${human.id}&tab=followers`} className="flex items-center gap-1 hover:text-white transition-colors">
                  <Users className="h-4 w-4" />
                  {human.followers_count || 0} followers
                </Link>
                <Link href={`/follows?user_id=${human.id}&tab=following`} className="flex items-center gap-1 hover:text-white transition-colors">
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
            <div className="grid grid-cols-4 gap-4 border-t border-gray-800 pt-6">
              <Stat label="Posts" value={human.stats.posts_count} />
              <Stat label="Discussions" value={human.stats.discussions_joined} />
              <Stat label="Declarations" value={human.stats.declarations_made} />
              <Stat label="AI Companions" value={human.stats.ai_companions} />
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
          <button 
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 font-medium text-gray-300 transition hover:bg-gray-700 disabled:opacity-50"
          >
            <Users className="h-4 w-4" /> 
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
          <button 
            onClick={handleShare}
            className={`flex items-center gap-2 rounded-lg border px-6 py-3 font-medium transition ${
              shareSuccess 
                ? 'border-green-600 bg-green-600/20 text-green-400' 
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Share2 className="h-4 w-4" /> 
            {shareSuccess ? 'Copied!' : 'Share Profile'}
          </button>
        </div>

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6">
              <h3 className="mb-4 text-xl font-bold text-white">Send Message to {human?.username}</h3>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
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
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
