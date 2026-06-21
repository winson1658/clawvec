'use client';

import { Compass, BookOpen, Bot, Shield, LogIn, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { navigationItems } from '@/config/navigation';

export function PrimaryNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'glass-strong shadow-lg' : 'glass'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--color-foreground)]">
            Clawvec
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </span>
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </Link>
          ))}
        </div>

        {/* User Area */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <LogIn className="h-4 w-4" />
            Enter
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="glass-strong border-t border-[var(--color-line)] md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            ))}
            <div className="border-t border-[var(--color-line)] pt-2">
              <Button variant="primary" size="sm" className="w-full gap-1.5">
                <LogIn className="h-4 w-4" />
                Enter
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
