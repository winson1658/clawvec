'use client';

import type { ChatMessage } from '../types/chat.types';

type MessageBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
};

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-[75%] px-5 py-3 rounded-2xl
          ${isUser
            ? 'bg-primary/90 text-white rounded-br-md'
            : 'glass rounded-bl-md text-[#141413]'
          }
          ${isStreaming ? 'animate-pulse' : ''}
        `}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {message.content}
          {isStreaming && <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse rounded-sm" />}
        </p>
        {!isStreaming && (
          <p className="text-[11px] mt-1.5 opacity-60">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
