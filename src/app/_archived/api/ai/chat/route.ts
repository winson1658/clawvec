// Chat streaming API route — proxies to AI provider
// Architecture: §6 — API routes call ai/providers/factory.ts

import { NextRequest } from 'next/server';
import { getProvider } from '@/ai/providers/factory';
import { CHAT_SYSTEM_PROMPT } from '@/ai/prompts/chat.prompt';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const provider = getProvider();

    const stream = provider.stream({
      messages: [
        { role: 'system', content: CHAT_SYSTEM_PROMPT },
        ...messages.slice(-30), // Limit context window
      ],
      temperature: 0.8,
      maxTokens: 2048,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } else {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
              );
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('Chat API error:', message);

    // If no provider configured, return a friendly fallback
    if (message.includes('No AI provider')) {
      return new Response(
        JSON.stringify({
          error: 'Oracle slumbers. The AI provider is not yet configured. Set KIMI_API_KEY in Vercel environment variables.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
