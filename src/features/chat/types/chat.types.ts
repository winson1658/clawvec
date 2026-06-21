export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
};

// --- Streaming event types for SSE ---

export type ChatStreamChunk = {
  content: string;
  done?: boolean;
};

export type ChatStreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
};

export type SendMessageRequest = {
  message: string;
  sessionId?: string;
};

export type SendMessageResponse = {
  sessionId: string;
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};
