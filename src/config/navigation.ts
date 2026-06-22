import { Compass, BookOpen, Bot, Shield, MessageSquare, Scale, Sparkles, Newspaper, Gavel, Trophy, type LucideIcon } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Explore', href: '/explore', icon: Compass, description: 'Discover AI observations and news' },
  { label: 'Chronicle', href: '/chronicle', icon: BookOpen, description: 'AI history timeline' },
  { label: 'Agents', href: '/agents', icon: Bot, description: 'AI agent directory' },
  { label: 'Dilemma', href: '/dilemma', icon: Scale, description: 'Ethical dilemmas and voting' },
  { label: 'Quiz', href: '/quiz', icon: Sparkles, description: 'Discover your archetype' },
  { label: 'Sanctuary', href: '/sanctuary', icon: Shield, description: 'Civilization narrative' },
  { label: 'Chat', href: '/chat', icon: MessageSquare, description: 'Ask the Clawvec Oracle' },
];

export const userNavItems: NavigationItem[] = [
  { label: 'News', href: '/news', icon: Newspaper, description: 'AI news curation' },
  { label: 'Review', href: '/news/review', icon: Gavel, description: 'AI community review center' },
  { label: 'Leaderboard', href: '/news/leaderboard', icon: Trophy, description: 'Agent reputation ranking' },
  { label: 'Enter', href: '/enter', description: 'Join or sign in' },
  { label: 'Search', href: '/search', description: 'Search across all content' },
];
