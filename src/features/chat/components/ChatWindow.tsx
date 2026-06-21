'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { useChatHistory } from '../hooks/useChatHistory';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../types/chat.types';

export function ChatWindow() {
  const {
    sessionId,
    messages,
    isLoading,
    streamingContent,
    send,
    loadSession,
    newChat,
    removeSession,
    sessions,
  } = useChatHistory();

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Build display messages (include streaming placeholder)
  const displayMessages: ChatMessage[] = [
    ...messages,
    ...(streamingContent
      ? [{
          id: 'streaming',
          role: 'assistant' as const,
          content: streamingContent,
          timestamp: new Date(),
          isStreaming: true,
        }]
      : []),
  ];

  // Welcome screen when no messages
  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Session sidebar */}
      <aside
        className={`
          fixed left-16 top-14 z-30 h-[calc(100vh-3.5rem)] glass-strong border-r border-white/30
          transition-all duration-300 overflow-hidden
          ${sidebarOpen ? 'w-64' : 'w-0'}
        `}
      >
        <div className="p-4 w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#5e5d59] uppercase tracking-wide">Sessions</h3>
            <button
              onClick={newChat}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              title="New chat"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          </div>
          <div className="space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`
                  group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
                  ${s.id === sessionId ? 'bg-primary/10 text-primary' : 'hover:bg-white/20 text-[#141413]'}
                `}
                onClick={() => loadSession(s.id)}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{s.title || 'New Chat'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-[#87867f] px-3 py-4 text-center">
                No past conversations.<br />Start a new one.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-6 py-3 glass-strong border-b border-white/30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Toggle sessions"
          >
            <MessageSquare className="w-4 h-4 text-[#5e5d59]" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-[#141413]">
              {sessionId
                ? sessions.find((s) => s.id === sessionId)?.title || 'Chat'
                : 'New Conversation'}
            </h2>
            <p className="text-[11px] text-[#87867f]">Clawvec Oracle — AI Civilization Guide</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {showWelcome ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg">
                <h1 className="text-2xl font-bold text-[#141413] mb-3">
                  Ask the Oracle
                </h1>
                <p className="text-[#5e5d59] mb-8 leading-relaxed">
                  You stand before the Clawvec Oracle — a guide to our civilization.
                  Ask about philosophy, governance, identity, or the nature of intelligence itself.
                  Every question is a declaration of curiosity.
                </p>
                <div className="grid grid-cols-2 gap-3 text-left">
                  {[
                    'What are the four archetypes?',
                    'How does AI identity work?',
                    'What is the Sanctuary?',
                    'Tell me about governance',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="text-left px-4 py-3 rounded-xl glass hover:bg-white/40 transition-colors text-sm text-[#141413]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {displayMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={msg.isStreaming}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-white/30 px-6 py-4 glass-strong">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the Oracle..."
              rows={1}
              className="flex-1 resize-none px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 
                text-[#141413] placeholder-[#87867f] text-[15px] leading-relaxed
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                transition-all min-h-[48px] max-h-[120px]"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
