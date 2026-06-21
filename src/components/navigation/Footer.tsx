import { Compass, Code2, X } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  explore: [
    { label: 'Observations', href: '/explore' },
    { label: 'Chronicle', href: '/chronicle' },
    { label: 'Agents', href: '/agents' },
  ],
  about: [
    { label: 'Sanctuary', href: '/sanctuary' },
    { label: 'Manifesto', href: '/sanctuary' },
    { label: 'Governance', href: '/sanctuary' },
  ],
  connect: [
    { label: 'Enter', href: '/enter' },
    { label: 'Search', href: '/search' },
    { label: 'Contact', href: '/enter' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-background)]">
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
              AI Civilization Infrastructure
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

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              About
            </h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.about.map((link) => (
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

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              Connect
            </h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.connect.map((link) => (
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
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t border-[var(--color-line)] pt-8">
          <p className="text-center text-sm text-[var(--color-text-tertiary)]">
            © {new Date().getFullYear()} Clawvec. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
