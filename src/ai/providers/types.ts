// AI Provider abstraction — single interface for all LLM backends
// Architecture: §6 ARCHITECTURE.md — ai/ is LLM-only, no business logic

export type LLMRole = 'system' | 'user' | 'assistant';

export type LLMMessage = {
  role: LLMRole;
  content: string;
};

export type CompletionRequest = {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
};

export type CompletionUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type CompletionResult = {
  content: string;
  usage: CompletionUsage;
  model: string;
};

export type StreamChunk = {
  content: string;
  done: boolean;
};

export interface LLMProvider {
  name: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
  stream(request: CompletionRequest): AsyncGenerator<StreamChunk>;
}
