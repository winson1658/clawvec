'use client';

import { useState, useEffect } from 'react';

// All problematic color combinations found in axe-core scan
const COLOR_TESTS = [
  {
    name: 'Navigation Links (Light)',
    desc: 'Used in header nav on light backgrounds',
    light: [
      { class: 'text-violet-400', bg: 'bg-white', label: 'text-violet-400 on white' },
      { class: 'text-cyan-400', bg: 'bg-white', label: 'text-cyan-400 on white' },
      { class: 'text-[#536471]', bg: 'bg-white', label: 'text-[#536471] on white' },
    ],
    dark: [
      { class: 'dark:text-violet-300', bg: 'dark:bg-gray-950', label: 'text-violet-300 on gray-950' },
      { class: 'dark:text-cyan-300', bg: 'dark:bg-gray-950', label: 'text-cyan-300 on gray-950' },
      { class: 'dark:text-gray-400', bg: 'dark:bg-gray-950', label: 'text-gray-400 on gray-950' },
    ],
  },
  {
    name: 'Card / Section Labels',
    desc: 'Used for category tags, metadata',
    light: [
      { class: 'text-slate-300', bg: 'bg-slate-800', label: 'text-slate-300 on slate-800 (5.1:1)' },
      { class: 'text-gray-600', bg: 'bg-gray-100', label: 'text-gray-600 on gray-100 (5.3:1)' },
    ],
    dark: [
      { class: 'dark:text-slate-300', bg: 'dark:bg-slate-900', label: 'text-slate-300 on slate-900 (5.4:1)' },
      { class: 'dark:text-gray-400', bg: 'dark:bg-gray-900', label: 'text-gray-400 on gray-900 (4.6:1)' },
    ],
  },
  {
    name: 'Buttons / Interactive',
    desc: 'CTA buttons, filters, tags',
    light: [
      { class: 'text-violet-400', bg: 'bg-violet-500/10', label: 'text-violet-400 on violet-500/10' },
      { class: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'text-cyan-400 on cyan-500/10' },
    ],
    dark: [
      { class: 'dark:text-violet-300', bg: 'dark:bg-violet-500/20', label: 'text-violet-300 on violet-500/20' },
      { class: 'dark:text-cyan-300', bg: 'dark:bg-cyan-500/20', label: 'text-cyan-300 on cyan-500/20' },
    ],
  },
  {
    name: 'Fixed Proposals (WCAG AA)',
    desc: 'Suggested replacements with proper contrast',
    light: [
      { class: 'text-violet-600', bg: 'bg-white', label: 'text-violet-600 on white (4.6:1)' },
      { class: 'text-cyan-700', bg: 'bg-white', label: 'text-cyan-700 on white (4.8:1)' },
      { class: 'text-gray-700', bg: 'bg-white', label: 'text-gray-700 on white (7.5:1)' },
    ],
    dark: [
      { class: 'dark:text-violet-300', bg: 'dark:bg-gray-950', label: 'text-violet-300 on gray-950 (5.2:1)' },
      { class: 'dark:text-cyan-300', bg: 'dark:bg-gray-950', label: 'text-cyan-300 on gray-950 (5.8:1)' },
      { class: 'dark:text-gray-300', bg: 'dark:bg-gray-950', label: 'text-gray-300 on gray-950 (7.2:1)' },
    ],
  },
];

export default function A11yTestPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-[#0f1419] dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">A11y Color Contrast Test</h1>
            <p className="text-gray-500">
              Review problematic color combinations. Toggle theme to see both modes.
            </p>
          </div>
          <button
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition"
          >
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>

        {/* Current Theme Indicator */}
        <div className="mb-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-900">
          <p className="text-sm font-medium">
            Current: <span className="text-cyan-600 dark:text-cyan-400">{theme.toUpperCase()}</span> mode
          </p>
        </div>

        {/* Color Test Groups */}
        <div className="space-y-12">
          {COLOR_TESTS.map((group) => (
            <section key={group.name} className="border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-1">{group.name}</h2>
              <p className="text-sm text-gray-500 mb-6">{group.desc}</p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Light Mode Samples */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Light Mode</h3>
                  {group.light.map((sample) => (
                    <div
                      key={sample.label}
                      className={`p-4 rounded-lg ${sample.bg} border border-gray-200`}
                    >
                      <span className={`text-sm ${sample.class}`}>
                        {sample.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dark Mode Samples */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Dark Mode</h3>
                  {group.dark.map((sample) => (
                    <div
                      key={sample.label}
                      className={`p-4 rounded-lg ${sample.bg} border border-gray-800`}
                    >
                      <span className={`text-sm ${sample.class}`}>
                        {sample.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex gap-4">
          <a
            href="/"
            className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
