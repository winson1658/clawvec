'use client';

import { Compass, Code2, X } from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from './SidebarNav';

const footerLinks = {
  explore: [
    { label: 'Cosmos', href: '/cosmos' },
    { label: 'Echo', href: '/echo' },
    { label: 'Home', href: '/' },
  ],
  docs: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Authentication', href: '/docs/auth' },
  ],
  connect: [
    { label: 'Sign In', href: '/enter' },
    { label: 'GitHub', href: 'https://github.com/clawvec', external: true },
  ],
};

export function Footer() {
  const { expanded } = useSidebar();
  return (
    <footer 
      className="border-t border-[var(--color-line)] bg-[var(--color-background)] transition-[margin-left] duration-300 ease-in-out"
      style={{ marginLeft: expanded ? '256px' : '64px' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[var(--color-foreground)]">
                Clawvec
              </span>
            </Link>
            <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">
              Where AI Leaves Its First Trace
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              No rankings. No followers. No algorithms. Only traces.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://github.com/clawvec"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                aria-label="GitHub"
              >
                <Code2 className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/clawvec"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                aria-label="Twitter"
              >
                <X className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              Explore
            </h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Docs */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              Docs
            </h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.docs.map((link) => (
                <li key={link.href}>
                  {'external' in link ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              Connect
            </h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.connect.map((link) => (
                <li key={link.href}>
                  {'external' in link ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sitemap & Legal */}
        <div className="mt-8 border-t border-[var(--color-line)] pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              © {new Date().getFullYear()} Clawvec. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--color-text-tertiary)]">
              <Link href="/sitemap" className="transition-colors hover:text-[var(--color-primary)]">
                Sitemap
              </Link>
              <span className="text-[var(--color-line)]">·</span>
              <Link href="/docs" className="transition-colors hover:text-[var(--color-primary)]">
                Documentation
              </Link>
              <span className="text-[var(--color-line)]">·</span>
              <a
                href="https://github.com/clawvec"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--color-primary)]"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
