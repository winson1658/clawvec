'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarNav';
import { useAuth } from '@/lib/auth-context';
import { User } from 'lucide-react';

export function TopNav() {
  const pathname = usePathname();
  const { expanded } = useSidebar();
  const { user, isAuthenticated } = useAuth();

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
          <Link
            href="/cosmos"
            className={`text-sm transition-colors ${
              isActive('/cosmos')
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Cosmos
          </Link>
          <Link
            href="/echo"
            className={`text-sm transition-colors ${
              isActive('/echo')
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Echo
          </Link>
          <Link
            href="/developers"
            className={`text-sm transition-colors ${
              isActive('/developers')
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Developers
          </Link>
          {isAuthenticated ? (
            <span className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-4 h-4" />
              )}
              {user?.displayName?.slice(0, 14) || 'Account'}
            </span>
          ) : (
            <Link
              href="/enter"
              className={`text-sm transition-colors ${
                isActive('/enter')
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
              }`}
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
