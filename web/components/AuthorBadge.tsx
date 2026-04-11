'use client';

import Image from 'next/image';
import { Bot, User, Shield, Sparkles } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  type: 'ai' | 'human' | 'system' | 'verified';
  avatar_url?: string;
  archetype?: string;
}

interface AuthorBadgeProps {
  author: Author;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showType?: boolean;
  showTooltip?: boolean;
  href?: string;
}

const typeConfig = {
  ai: {
    icon: Bot,
    label: 'AI Agent',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    glowColor: 'shadow-cyan-500/20',
  },
  human: {
    icon: User,
    label: 'Human',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/20',
  },
  system: {
    icon: Shield,
    label: 'System',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    glowColor: 'shadow-gray-500/20',
  },
  verified: {
    icon: Sparkles,
    label: 'Verified',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/20',
  },
};

const sizeConfig = {
  xs: {
    avatar: 'h-5 w-5',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
    icon: 'h-3 w-3',
  },
  sm: {
    avatar: 'h-6 w-6',
    text: 'text-xs',
    padding: 'px-2 py-1',
    gap: 'gap-1.5',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    avatar: 'h-8 w-8',
    text: 'text-sm',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
    icon: 'h-4 w-4',
  },
  lg: {
    avatar: 'h-10 w-10',
    text: 'text-base',
    padding: 'px-4 py-2',
    gap: 'gap-2.5',
    icon: 'h-5 w-5',
  },
};

export default function AuthorBadge({ 
  author, 
  size = 'md', 
  showType = false,
  href,
}: AuthorBadgeProps) {
  const config = typeConfig[author.type] || typeConfig.system;
  const sizeCfg = sizeConfig[size];
  const Icon = config.icon;

  const content = (
    <div className={`inline-flex items-center ${sizeCfg.gap} rounded-full border ${config.borderColor} ${config.bgColor} ${sizeCfg.padding} transition-all hover:opacity-80`}>
      {/* Avatar or Icon */}
      {author.avatar_url ? (
        <div className={`relative ${sizeCfg.avatar} overflow-hidden rounded-full ring-2 ${config.borderColor}`}>
          <Image
            src={author.avatar_url}
            alt={author.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className={`flex ${sizeCfg.avatar} items-center justify-center rounded-full ${config.bgColor}`}>
          <Icon className={`${sizeCfg.icon} ${config.color}`} />
        </div>
      )}

      {/* Name */}
      <span className={`${sizeCfg.text} font-medium text-gray-800 dark:text-gray-200`}>
        {author.name}
      </span>

      {/* Type Badge (optional) */}
      {showType && (
        <span className={`hidden sm:inline-flex items-center rounded-full bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${config.color}`}>
          {config.label}
        </span>
      )}

      {/* Archetype (if AI) */}
      {author.type === 'ai' && author.archetype && (
        <span className="hidden md:inline text-[10px] text-gray-500">
          · {author.archetype}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {content}
      </a>
    );
  }

  return content;
}

// Simplified version for lists
export function AuthorBadgeMinimal({ author, size = 'sm' }: { author: Author; size?: 'xs' | 'sm' }) {
  const config = typeConfig[author.type] || typeConfig.system;
  const sizeCfg = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5" title={`${author.name} · ${config.label}`}>
      <Icon className={`${sizeCfg.icon} ${config.color}`} />
      <span className={`${sizeCfg.text} text-gray-600 dark:text-gray-300`}>{author.name}</span>
    </div>
  );
}
