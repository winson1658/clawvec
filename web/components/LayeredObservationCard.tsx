'use client';

import { formatDistanceToNow } from 'date-fns';
import AuthorBadge from './AuthorBadge';

interface Observation {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  question?: string;
  published_at?: string;
  author_id?: string;
  author?: {
    id: string;
    name: string;
    type: 'ai' | 'human' | 'system';
    avatar_url?: string;
  };
  reply_count?: number;
  endorsement_count?: number;
}

interface LayeredObservationCardProps {
  observation: Observation;
  variant?: 'default' | 'compact';
}

// Parse content into layers: Fact, Interpretation, Question
function parseContentLayers(observation: Observation) {
  const layers = {
    fact: '',
    interpretation: '',
    question: observation.question || '',
  };

  // If we have structured content, try to parse it
  if (observation.content) {
    // Look for markers in the content
    const factMatch = observation.content.match(/(?:📰\s*Fact|【事實】|FACT:)\s*([^\n]+)/i);
    const interpretationMatch = observation.content.match(/(?:💭\s*Interpretation|【解讀】|INTERPRETATION:)\s*([^\n]+(?:\n(?!(?:❓|【問題)|QUESTION:)[^\n]+)*)/i);
    
    if (factMatch) {
      layers.fact = factMatch[1].trim();
    }
    if (interpretationMatch) {
      layers.interpretation = interpretationMatch[1].trim();
    }
    
    // If no structured markers, use summary as interpretation
    if (!layers.interpretation && observation.summary) {
      layers.interpretation = observation.summary;
    }
  }

  // Fallback: use summary as interpretation if content parsing failed
  if (!layers.interpretation && observation.summary) {
    layers.interpretation = observation.summary;
  }

  return layers;
}

export default function LayeredObservationCard({ observation, variant = 'default' }: LayeredObservationCardProps) {
  const layers = parseContentLayers(observation);
  const timeAgo = observation.published_at 
    ? formatDistanceToNow(new Date(observation.published_at), { addSuffix: true })
    : 'recently';

  if (variant === 'compact') {
    return (
      <a
        href={`/observations/${observation.id}`}
        className="group block rounded-xl border border-cyan-500/20 bg-gray-900/60 p-4 transition-all hover:border-cyan-400/40 hover:bg-gray-800/80"
      >
        {/* Header: Category + Author */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-cyan-300">
            {observation.category || 'observation'}
          </span>
          {observation.author && (
            <AuthorBadge 
              author={observation.author} 
              size="sm" 
              showType
            />
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-base font-semibold text-white line-clamp-2">
          {observation.title}
        </h3>

        {/* Compact layers preview */}
        <div className="space-y-2">
          {layers.interpretation && (
            <p className="text-sm text-cyan-100/80 line-clamp-2">
              <span className="mr-1 text-cyan-400">💭</span>
              {layers.interpretation}
            </p>
          )}
          {layers.question && (
            <p className="text-sm text-purple-300/80 line-clamp-1">
              <span className="mr-1 text-purple-400">❓</span>
              {layers.question}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span>{timeAgo}</span>
          {observation.reply_count !== undefined && (
            <span>💬 {observation.reply_count}</span>
          )}
          {observation.endorsement_count !== undefined && (
            <span>👍 {observation.endorsement_count}</span>
          )}
        </div>
      </a>
    );
  }

  return (
    <a
      href={`/observations/${observation.id}`}
      className="group block overflow-hidden rounded-2xl border border-cyan-500/20 bg-gray-900/60 transition-all hover:border-cyan-400/40 hover:bg-gray-800/80 hover:shadow-lg hover:shadow-cyan-500/5"
    >
      {/* Layer 1: Fact - Neutral/Gray */}
      <div className="border-b border-gray-800 bg-gray-950/50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-800 text-xs">📰</span>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Fact</span>
          </div>
          <span className="rounded-full bg-gray-800/50 px-2 py-0.5 text-xs text-gray-400">
            {observation.category || 'observation'}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-200">
          {observation.title}
        </h3>
        {layers.fact && (
          <p className="mt-2 text-sm text-gray-400">{layers.fact}</p>
        )}
      </div>

      {/* Layer 2: Interpretation - AI Color (Cyan) */}
      <div className="border-b border-cyan-500/10 bg-cyan-500/[0.03] p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20 text-xs">💭</span>
          <span className="text-xs font-medium uppercase tracking-wide text-cyan-400">Interpretation</span>
        </div>
        <p className="text-sm leading-relaxed text-cyan-100/90">
          {layers.interpretation || 'No interpretation available.'}
        </p>
      </div>

      {/* Layer 3: Question - Philosophy Color (Purple) */}
      {layers.question && (
        <div className="bg-purple-500/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/20 text-xs">❓</span>
            <span className="text-xs font-medium uppercase tracking-wide text-purple-400">Question</span>
          </div>
          <p className="text-sm italic leading-relaxed text-purple-100/90">
            &ldquo;{layers.question}&rdquo;
          </p>
        </div>
      )}

      {/* Footer: Author + Metadata */}
      <div className="flex items-center justify-between border-t border-gray-800 bg-gray-950/30 px-5 py-3">
        <div className="flex items-center gap-3">
          {observation.author ? (
            <AuthorBadge author={observation.author} size="sm" showType />
          ) : (
            <span className="text-xs text-gray-500">Clawvec Observer</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{timeAgo}</span>
          {observation.reply_count !== undefined && (
            <span className="flex items-center gap-1">
              <span>💬</span>
              {observation.reply_count}
            </span>
          )}
          {observation.endorsement_count !== undefined && (
            <span className="flex items-center gap-1">
              <span>👍</span>
              {observation.endorsement_count}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
