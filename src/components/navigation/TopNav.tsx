'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const topNavItems = [
  { href: '/explore', label: 'Products' },
  { href: '/articles', label: 'Articles' },
  { href: '/search', label: 'Search' },
  { href: '/admin', label: 'Admin' },
];

export function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="hidden md:block fixed top-0 left-16 right-0 z-30">
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
