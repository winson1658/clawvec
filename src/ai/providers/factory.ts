// Provider factory — single entry point for LLM calls
// Architecture: §6 ARCHITECTURE.md — all AI calls go through this factory
// Updated 2026-06-22: DeepSeek primary (OpenAI-compatible), Kimi fallback

import type { LLMProvider } from './types';
import { DeepSeekProvider } from './deepseek';
import { KimiProvider } from './kimi';

let _provider: LLMProvider | null = null;

export function getProvider(): LLMProvider {
  if (_provider) return _provider;

  // 1. DeepSeek (primary — OpenAI-compatible, reliable API)
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    _provider = new DeepSeekProvider({
      apiKey: deepseekKey,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    });
    return _provider;
  }

  // 2. Kimi (fallback — coding-only, may not work for direct API access)
  const kimiKey = process.env.KIMI_API_KEY;
  if (kimiKey) {
    _provider = new KimiProvider({
      apiKey: kimiKey,
      baseUrl: process.env.KIMI_BASE_URL,
    });
    return _provider;
  }

  throw new Error(
    'No AI provider configured. Set DEEPSEEK_API_KEY or KIMI_API_KEY in Vercel environment variables.'
  );
}

// For testing / switching providers at runtime
export function resetProvider(): void {
  _provider = null;
}
