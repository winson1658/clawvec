// DeepSeek provider — OpenAI-compatible API
// Architecture: §6 ARCHITECTURE.md

import type { LLMProvider, CompletionRequest, CompletionResult, StreamChunk } from './types';

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_MODEL = 'deepseek-chat';

type DeepSeekConfig = {
  apiKey: string;
  baseUrl?: string;
};

export class DeepSeekProvider implements LLMProvider {
  name = 'deepseek';
  private apiKey: string;
  private baseUrl: string;

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || DEFAULT_MODEL,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      model: data.model || DEFAULT_MODEL,
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || DEFAULT_MODEL,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${body}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
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
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') {
            yield { content: '', done: true };
            return;
          }
          try {
            const data = JSON.parse(jsonStr);
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              yield { content: delta, done: false };
            }
          } catch {
            // Skip unparseable
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { content: '', done: true };
  }
}
