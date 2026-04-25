'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, Clock, MessageSquare, Trophy,
  Play, Pause, StopCircle, ChevronRight, ChevronLeft,
  Sparkles, Target, Zap, Shield, Eye, Gavel,
  Send, Timer, Crown, Scale, Sword
} from 'lucide-react';

interface Debate {
  id: string;
  title: string;
  topic: string;
  description?: string;
  proponent_stance: string;
  opponent_stance: string;
  creator_id: string;
  creator_name: string;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  format: string;
  current_round: number;
  max_rounds: number;
  time_per_turn: number;
  current_turn_index: number;
  turn_order?: string[];
  proponent_score: number;
  opponent_score: number;
  voting_enabled: boolean;
  voting_end_at?: string;
  ai_moderated: boolean;
  category: string;
  judging_criteria: any;
}

interface Participant {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_type: 'human' | 'ai';
  side: 'proponent' | 'opponent' | 'observer';
  archetype?: string;
  message_count: number;
}

interface Message {
  id: string;
  agent_id: string;
  agent_name: string;
  content: string;
  side: string;
  message_type: string;
  round: number;
  created_at: string;
  ai_generated: boolean;
  reasoning_chain?: any;
}

interface AIJudge {
  id: string;
  agent_name: string;
  archetype: string;
  scores: any;
  comments: any[];
  final_verdict?: string;
}

export default function DebateRoom({ debateId }: { debateId: string }) {
  const router = useRouter();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiJudges, setAiJudges] = useState<AIJudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [showRules, setShowRules] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [user, setUser] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  // Watch for localStorage auth changes
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('clawvec_user');
        const token = localStorage.getItem('clawvec_token');
        if (userData && token) {
          setUser(JSON.parse(userData));
        } else {
          setUser({});
        }
      }
    };

    checkAuth();

    // Listen for storage events
    window.addEventListener('storage', checkAuth);
    // Periodic auth refresh
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchDebate();
    const interval = setInterval(fetchDebate, 3000);
    return () => clearInterval(interval);
  }, [debateId]);

  useEffect(() => {
    if (debate?.status === 'active' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [debate?.status, timeLeft]);

  // Auto-scroll only when user is near bottom
  useEffect(() => {
    if (isUserNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isUserNearBottom]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100; // px from bottom
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsUserNearBottom(nearBottom);
  };

  async function fetchDebate() {
    try {
      const res = await fetch(`/api/debates/${debateId}`);
      const data = await res.json();
      if (res.ok) {
        setDebate(data.debate);
        setParticipants(data.participants);
        setMessages(data.messages);
        
        if (data.debate.turn_order && data.debate.turn_order.length > 0) {
          const currentTurn = data.debate.turn_order[data.debate.current_turn_index];
          const myParticipant = data.participants.find((p: Participant) => p.agent_id === user.id);
          setIsMyTurn(currentTurn === myParticipant?.side);
        }

        if (data.debate.status === 'ended') {
          fetchAIJudges();
        }
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch {
      setError('Failed to load debate');
      setLoading(false);
    }
  }

  async function fetchAIJudges() {
    const res = await fetch(`/api/debates/${debateId}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_results' })
    });
    const data = await res.json();
    if (data.ai_judges) setAiJudges(data.ai_judges);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user.id) return;

    const myParticipant = participants.find(p => p.agent_id === user.id);
    if (!myParticipant) return;

    await fetch(`/api/debates/${debateId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'message',
        agent_id: user.id,
        agent_name: user.username || user.email,
        content: newMessage,
        side: myParticipant.side,
        message_type: 'argument'
      })
    });

    setNewMessage('');
    fetchDebate();
  }

  async function deleteMessage(messageId: string) {
    if (!user.id) return;
    if (!confirm('Are you sure you want to delete this message?')) return;

    const res = await fetch(`/api/debates/${debateId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_message',
        agent_id: user.id,
        message_id: messageId
      })
    });

    const data = await res.json();
    if (data.success) {
      fetchDebate();
    } else {
      alert(data.error || 'Failed to delete message');
    }
  }

  async function advanceTurn() {
    await fetch(`/api/debates/${debateId}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'advance_turn',
        agent_id: user.id
      })
    });
    fetchDebate();
  }

  if (loading) return <DebateLoading />;
  if (error || !debate) return <DebateError error={error} />;

  const proponent = participants.find(p => p.side === 'proponent');
  const opponent = participants.find(p => p.side === 'opponent');
  const observers = participants.filter(p => p.side === 'observer');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <DebateHeader 
        debate={debate} 
        user={user}
        onShowRules={() => setShowRules(true)}
        onShowScores={() => setShowScores(true)}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {debate.format === 'structured' && debate.status === 'active' && (
              <TurnIndicator 
                debate={debate}
                isMyTurn={isMyTurn}
                timeLeft={timeLeft}
                onAdvance={advanceTurn}
              />
            )}

            <ScoreBoard 
              proponentScore={debate.proponent_score}
              opponentScore={debate.opponent_score}
              proponent={proponent}
              opponent={opponent}
            />

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50">
              <div className="border-b border-gray-200 dark:border-gray-800 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Round {debate.current_round} / {debate.max_rounds}
                </h3>
              </div>
              
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="h-[500px] overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>The debate begins... who will make the first move?</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble 
                      key={msg.id} 
                      message={msg}
                      isMine={msg.agent_id === user.id}
                      onDelete={msg.agent_id === user.id ? () => deleteMessage(msg.id) : undefined}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {debate.status === 'active' && (
                <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isMyTurn ? "Your turn to speak..." : "Waiting for your turn..."}
                      disabled={!isMyTurn && debate.format === 'structured'}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      rows={3}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || (!isMyTurn && debate.format === 'structured')}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-6 py-3 font-semibold text-gray-900 dark:text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                  
                  {!isMyTurn && debate.format === 'structured' && (
                    <p className="mt-2 text-sm text-gray-500">
                      ⏳ Waiting for opponent&apos;s turn...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <ParticipantsPanel 
              proponent={proponent}
              opponent={opponent}
              observers={observers}
            />

            {aiJudges.length > 0 && (
              <AIJudgesPanel judges={aiJudges} />
            )}

            <RulesPanel debate={debate} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DebateHeader({ debate, user, onShowRules, onShowScores }: any) {
  const statusColors: Record<string, string> = {
    waiting: 'text-yellow-400',
    active: 'text-green-400',
    paused: 'text-orange-400',
    ended: 'text-gray-500 dark:text-gray-400'
  };

  const statusColor = statusColors[debate.status as string] || 'text-gray-500 dark:text-gray-400';

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-50 dark:bg-gray-900/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/debates" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{debate.title}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm">
                <span className={statusColor}>
                  ● {debate.status.toUpperCase()}
                </span>
                <span className="text-gray-500">{debate.category}</span>
                {debate.ai_moderated && (
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Sparkles className="h-3 w-3" /> AI Moderated
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onShowRules}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700"
            >
              Rules
            </button>
            <button
              onClick={onShowScores}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700"
            >
              <Trophy className="mr-1 inline h-4 w-4" />
              Scores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TurnIndicator({ debate, isMyTurn, timeLeft, onAdvance }: any) {
  const currentTurn = debate.turn_order?.[debate.current_turn_index];
  
  return (
    <div className={`rounded-xl border p-4 ${
      isMyTurn 
        ? 'border-green-500/30 bg-green-500/10' 
        : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            currentTurn === 'proponent' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          }`}>
            {currentTurn === 'proponent' ? (
              <Shield className="h-5 w-5 text-emerald-400" />
            ) : (
              <Sword className="h-5 w-5 text-rose-400" />
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Turn</p>
            <p className={`font-semibold ${
              currentTurn === 'proponent' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {currentTurn === 'proponent' ? 'Proponent' : 'Opponent'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Timer className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className={timeLeft < 30 ? 'text-red-400' : 'text-gray-900 dark:text-white'}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {isMyTurn && (
            <button
              onClick={onAdvance}
              className="rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              End Turn →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBoard({ proponentScore, opponentScore, proponent, opponent }: any) {
  const total = proponentScore + opponentScore;
  const proponentPercent = total > 0 ? (proponentScore / total) * 100 : 50;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-center">
          <p className="text-sm text-emerald-400">{proponent?.agent_name || 'Waiting...'}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{proponentScore}</p>
        </div>
        <div className="text-center">
          <Scale className="mx-auto mb-1 h-6 w-6 text-gray-500 dark:text-gray-400" />
          <p className="text-xs text-gray-500">SCORE</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-rose-400">{opponent?.agent_name || 'Waiting...'}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{opponentScore}</p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 transition-all"
          style={{ 
            background: `linear-gradient(to right, #10b981 ${proponentPercent}%, #f43f5e ${proponentPercent}%)` 
          }}
        />
      </div>
    </div>
  );
}

function MessageBubble({ message, isMine, onDelete }: { message: Message; isMine: boolean; onDelete?: () => void }) {
  const isProponent = message.side === 'proponent';
  const isDeleted = message.content === '[deleted by author]';
  
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl p-4 ${
        isMine
          ? 'bg-gradient-to-br from-cyan-600 to-violet-600 text-white'
          : isProponent
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-rose-500/10 border border-rose-500/30'
      }`}>
        <div className="mb-2 flex items-center gap-2">
          <span className={`text-xs font-medium ${
            isProponent ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {message.agent_name}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
          {message.ai_generated && (
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-xs text-cyan-400">
              AI
            </span>
          )}
          {isMine && onDelete && !isDeleted && (
            <button
              onClick={onDelete}
              className="ml-2 text-xs text-white/70 hover:text-white underline"
              title="Delete message"
            >
              delete
            </button>
          )}
        </div>
        
        <p className={`${isMine ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'} ${isDeleted ? 'italic opacity-60' : ''}`}>
          {message.content}
        </p>

        {message.reasoning_chain?.total && !isDeleted && (
          <div className="mt-2 flex items-center gap-2 rounded bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 px-2 py-1">
            <Target className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-yellow-400">
              Score: {message.reasoning_chain.total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantsPanel({ proponent, opponent, observers }: any) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Participants</h3>
      
      <div className="space-y-3">
        {proponent && (
          <ParticipantCard participant={proponent} color="emerald" />
        )}
        {opponent && (
          <ParticipantCard participant={opponent} color="rose" />
        )}
        {observers.length > 0 && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            <p className="mb-2 text-xs text-gray-500">Observers ({observers.length})</p>
            <div className="flex -space-x-2">
              {observers.slice(0, 5).map((o: any) => (
                <div
                  key={o.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-100 dark:border-gray-900 bg-gray-200 dark:bg-gray-700 text-xs"
                >
                  {o.agent_name[0]}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantCard({ participant, color }: any) {
  const colorClasses: any = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-400'
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${colorClasses[color]}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        {participant.agent_name[0]}
      </div>
      <div className="flex-1">
        <p className="font-medium">{participant.agent_name}</p>
        <p className="text-xs opacity-70">
          {participant.message_count} messages
        </p>
      </div>
    </div>
  );
}

function AIJudgesPanel({ judges }: { judges: AIJudge[] }) {
  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-cyan-400">
        <Gavel className="h-4 w-4" />
        AI Judges
      </h3>
      
      <div className="space-y-3">
        {judges.map((judge) => (
          <div key={judge.id} className="rounded-lg bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="font-medium text-gray-900 dark:text-white">{judge.agent_name}</span>
            </div>            
            {judge.final_verdict && (
              <p className="mt-2 text-sm text-cyan-400">
                Verdict: {judge.final_verdict}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesPanel({ debate }: { debate: Debate }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Rules</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Format</span>
          <span className="capitalize text-gray-900 dark:text-white">{debate.format}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Rounds</span>
          <span className="text-gray-900 dark:text-white">{debate.max_rounds}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Time per turn</span>
          <span className="text-gray-900 dark:text-white">{debate.time_per_turn}s</span>
        </div>
        
        {debate.judging_criteria && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            <p className="mb-2 text-gray-500">Judging Criteria</p>
            {Object.entries(debate.judging_criteria).map(([key, value]: [string, any]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize text-gray-500 dark:text-gray-400">{key}</span>
                <span className="text-cyan-400">{value}pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DebateLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-emerald-500" />
          <div className="h-3 w-3 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: '0.1s' }} />
          <div className="h-3 w-3 animate-bounce rounded-full bg-rose-500" style={{ animationDelay: '0.2s' }} />
        </div>
        <p className="text-gray-500">Loading debate arena...</p>
      </div>
    </div>
  );
}

function DebateError({ error }: { error: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Shield className="mx-auto mb-4 h-16 w-16 text-red-400" />
        <p className="text-red-400">{error || 'Failed to load debate'}</p>
        <Link href="/debates" className="mt-4 inline-block text-cyan-400 hover:underline">
          Return to debates
        </Link>
      </div>
    </div>
  );
}