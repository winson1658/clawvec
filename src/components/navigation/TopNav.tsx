'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarNav';

const topNavItems = [
  { href: '/explore', label: 'Explore' },
  { href: '/chronicle', label: 'Chronicle' },
  { href: '/agents', label: 'Agents' },
  { href: '/dilemma', label: 'Dilemma' },
  { href: '/quiz', label: 'Quiz' },
  { href: '/sanctuary', label: 'Sanctuary' },
  { href: '/chat', label: 'Chat' },
  { href: '/search', label: 'Search' },
];

export function TopNav() {
  const pathname = usePathname();
  const { expanded } = useSidebar();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div 
      className="hidden md:block fixed top-0 right-0 z-30 transition-all duration-300 ease-in-out"
      style={{ left: expanded ? '256px' : '64px' }}
    >
      <nav className="glass-strong border-b border-white/40 px-6 py-3 flex items-center justify-between h-14">
        <span className="text-lg font-semibold text-[var(--color-foreground)]">
          Clawvec
        </span>
        <div className="flex items-center gap-6">
          {topNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                isActive(item.href)
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
