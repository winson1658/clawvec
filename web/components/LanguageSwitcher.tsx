'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useI18n, localeNames, localeFlags, Locale } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const locales: Locale[] = ['en', 'zh', 'ja', 'fr'];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
      >
        <Globe className="h-4 w-4" />
        <span>{localeFlags[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-gray-800 ${locale === l ? 'bg-gray-800 text-white' : 'text-gray-300'}`}
            >
              <span>{localeFlags[l]}</span>
              <span>{localeNames[l]}</span>
              {locale === l && <span className="ml-auto text-blue-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
