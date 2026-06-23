'use client';

import { Milestone } from '../types/chronicle.types';
import { X, ExternalLink, Tag } from 'lucide-react';

interface EventDetailProps {
  milestone: Milestone;
  onClose: () => void;
}

export function EventDetail({ milestone, onClose }: EventDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[var(--color-foreground)]/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative glass-strong rounded-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)]/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {new Date(milestone.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <h2 className="text-xl font-bold text-[var(--color-foreground)] mt-1">
            {milestone.title}
          </h2>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
          {milestone.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {milestone.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2 py-1 rounded-full">
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            milestone.impact === 'critical' ? 'bg-red-100 text-red-700' :
            milestone.impact === 'high' ? 'bg-orange-100 text-orange-700' :
            milestone.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {milestone.impact} impact
          </span>
          
          {milestone.sourceUrl && (
            <a
              href={milestone.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[var(--color-primary)] hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
