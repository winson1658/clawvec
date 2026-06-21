// Chat service — wraps AI provider for chat interactions
// Architecture: §6 ARCHITECTURE.md — services layer, read-only (queryFn for TanStack Query)
// Updated 2026-06-22: Fixed SSE parsing for DeepSeek compatibility

import type { SendMessageRequest, SendMessageResponse, ChatMessage, ChatSession } from '../types/chat.types';

const SESSION_STORAGE_KEY = 'clawvec_chat_sessions';

// --- Client-side session persistence (localStorage) ---

function getStoredSessions(): Record<string, ChatSession> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function storeSessions(sessions: Record<string, ChatSession>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full — silently fail
  }
}

export function getSession(sessionId: string): ChatSession | null {
  const sessions = getStoredSessions();
  return sessions[sessionId] || null;
}

export function listSessions(): ChatSession[] {
  const sessions = getStoredSessions();
  return Object.values(sessions).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// --- API call — streaming via fetch ---

export async function sendMessage(
  request: SendMessageRequest,
  onChunk: (chunk: string) => void
): Promise<SendMessageResponse> {
  const sessions = getStoredSessions();
  const sessionId = request.sessionId || generateId();

  // Build message history from session
  const existingSession = sessions[sessionId];
  const history: { role: string; content: string }[] = [];
  if (existingSession) {
    for (const msg of existingSession.messages.slice(-20)) {
      history.push({ role: msg.role, content: msg.content });
    }
  }
  history.push({ role: 'user', content: request.message });

  // Call streaming API
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Chat API error ${response.status}: ${err}`);
  }

  // Read SSE stream — compatible with OpenAI / DeepSeek format
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullResponse = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // SSE format: "data: {...}" or "data: [DONE]"
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            // OpenAI format: choices[0].delta.content
            const content =
              parsed.choices?.[0]?.delta?.content ||
              parsed.choices?.[0]?.text ||
              parsed.content ||
              parsed.text ||
              '';

            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch {
            // Skip unparseable lines
          }
        }
        // Some providers send raw JSON without "data:" prefix
        else if (trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            const content =
              parsed.choices?.[0]?.delta?.content ||
              parsed.choices?.[0]?.text ||
              parsed.content ||
              parsed.text ||
              '';

            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch {
            // Skip unparseable
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Persist to localStorage
  const userMsg: ChatMessage = {
    id: `msg_${Date.now()}_u`,
    role: 'user',
    content: request.message,
    timestamp: new Date(),
  };
  const assistantMsg: ChatMessage = {
    id: `msg_${Date.now()}_a`,
    role: 'assistant',
    content: fullResponse,
    timestamp: new Date(),
  };

  if (existingSession) {
    existingSession.messages.push(userMsg, assistantMsg);
    existingSession.updated_at = new Date();
    existingSession.title = existingSession.title || request.message.slice(0, 60);
    sessions[sessionId] = existingSession;
  } else {
    sessions[sessionId] = {
      id: sessionId,
      title: request.message.slice(0, 60),
      messages: [userMsg, assistantMsg],
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
  storeSessions(sessions);

  return { sessionId, response: fullResponse };
}

export function deleteSession(sessionId: string): void {
  const sessions = getStoredSessions();
  delete sessions[sessionId];
  storeSessions(sessions);
}
