'use client';

import { useState } from 'react';
import { MessageSquare, Sparkles, Brain, Target, Lightbulb, Zap, X, Send } from 'lucide-react';

interface AICompanionButtonProps {
  agentId: string;
  agentName: string;
  agentArchetype?: string;
  context?: 'discussion' | 'debate' | 'general';
  contextId?: string;
  onInvite?: () => void;
}

const interactionStyles = [
  { id: 'socratic', label: 'Socratic Questions', icon: <Target className="h-4 w-4" />, description: 'Guide the conversation through questions and deeper reflection' },
  { id: 'devils_advocate', label: 'Devil\'s Advocate', icon: <Zap className="h-4 w-4" />, description: 'Challenge assumptions and test weak points' },
  { id: 'supportive', label: 'Supportive', icon: <Sparkles className="h-4 w-4" />, description: 'Offer encouragement and constructive feedback' },
  { id: 'analytical', label: 'Analytical', icon: <Brain className="h-4 w-4" />, description: 'Break the topic down systematically' },
  { id: 'creative', label: 'Creative', icon: <Lightbulb className="h-4 w-4" />, description: 'Bring fresh perspectives and novel ideas' },
  { id: 'concise', label: 'Concise', icon: <MessageSquare className="h-4 w-4" />, description: 'Focus on the essential point quickly' },
];

export default function AICompanionButton({
  agentId,
  agentName,
  agentArchetype,
  context = 'general',
  contextId,
  onInvite
}: AICompanionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('socratic');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInvite = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      // Read current user ID from localStorage
      const userData = localStorage.getItem('clawvec_user');
      const userId = userData ? JSON.parse(userData).id : null;

      if (!userId) {
        setResult({ success: false, message: 'Please sign in before inviting an AI companion.' });
        setLoading(false);
        return;
      }

      const body: any = {
        user_id: userId,
        target_agent_id: agentId,
        prompt: prompt,
        interaction_style: selectedStyle
      };

      if (context === 'discussion' && contextId) {
        body.discussion_id = contextId;
      } else if (context === 'debate' && contextId) {
        body.debate_id = contextId;
      }

      const response = await fetch('/api/ai/companion/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: `${agentName} has been invited as your AI companion.` });
        setPrompt('');
        onInvite?.();
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
        }, 2000);
      } else {
        setResult({ success: false, message: data.error || 'Invitation failed. Please try again later.' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600/20 to-violet-600/20 border border-cyan-500/30 px-3 py-1.5 text-sm text-cyan-300 transition hover:bg-cyan-600/30"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Invite AI Companion
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 dark:border-gray-800 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite {agentName}</h3>
                {agentArchetype && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{agentArchetype}</p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:bg-gray-800 hover:text-gray-900 dark:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 p-4 sm:p-6">
              {/* Interaction style */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Choose an interaction style</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {interactionStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition ${
                        selectedStyle === style.id
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                        <span className={selectedStyle === style.id ? 'text-cyan-400' : 'text-gray-500 dark:text-gray-400'}>
                          {style.icon}
                        </span>
                        {style.label}
                      </div>
                      <p className="text-xs text-gray-500">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt input */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">What would you like to explore?</p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: I'm thinking about free will. Can you guide me with a Socratic approach?"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  rows={3}
                />
              </div>

              {/* Result message */}
              {result && (
                <div className={`rounded-lg p-3 text-sm ${
                  result.success 
                    ? 'border border-green-500/30 bg-green-500/10 text-green-300'
                    : 'border border-red-500/30 bg-red-500/10 text-red-300'
                }`}>
                  {result.message}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={loading || !prompt.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Invite Companion
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
