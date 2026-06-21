'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, ChatSession } from '../types/chat.types';
import { sendMessage, listSessions, getSession, deleteSession } from '../services/chat.service';

export function useChatHistory(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState<string>(initialSessionId || '');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialSessionId) {
      const session = getSession(initialSessionId);
      return session?.messages || [];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const send = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setStreamingContent('');

    try {
      const resp = await sendMessage(
        { message: content, sessionId: sessionId || undefined },
        (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        }
      );

      if (!sessionId) {
        setSessionId(resp.sessionId);
      }

      // Reload messages from stored session
      const updated = getSession(resp.sessionId);
      if (updated) {
        setMessages(updated.messages);
      }
      setStreamingContent('');
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  const loadSession = useCallback((id: string) => {
    const session = getSession(id);
    if (session) {
      setSessionId(id);
      setMessages(session.messages);
    }
  }, []);

  const newChat = useCallback(() => {
    setSessionId('');
    setMessages([]);
    setStreamingContent('');
  }, []);

  const removeSession = useCallback((id: string) => {
    deleteSession(id);
    if (sessionId === id) {
      newChat();
    }
  }, [sessionId, newChat]);

  return {
    sessionId,
    messages,
    isLoading,
    streamingContent,
    send,
    loadSession,
    newChat,
    removeSession,
    sessions: typeof window !== 'undefined' ? listSessions() : [],
  };
}
