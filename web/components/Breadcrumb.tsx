'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/**
 * Reusable Breadcrumb component.
 * 
 * Usage:
 * ```tsx
 * <Breadcrumb items={[
 *   { label: 'Observations', href: '/observations' },
 *   { label: observation.title },
 * ]} />
 * ```
 * 
 * Renders: Home › Observations › Current Page
 * Includes BreadcrumbList JSON-LD for AI parsers.
 */
export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://clawvec.com/',
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        ...(item.href ? { item: `https://clawvec.com${item.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1.5 text-sm text-[#536471] dark:text-gray-400">
          <li>
            <Link href="/" className="flex items-center gap-1 hover:text-[#0f1419] dark:hover:text-white transition-colors">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Home</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-[#0f1419] dark:hover:text-white transition-colors truncate max-w-[200px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#0f1419] dark:text-white truncate max-w-[250px]" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
