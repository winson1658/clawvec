'use client';

import { useEffect } from 'react';

// Homepage anchor sections that support hash-based scrolling
const VALID_SECTION_IDS = [
  'auth',
  'observations',
  'activity',
  'engagement',
  'ritual',
];

function scrollToSection(hash: string, delayMs = 250) {
  // Remove any query string from the hash and keep only the anchor id, e.g. #auth?mode=login → auth
  const id = hash.replace(/^#/, '').split('?')[0];
  if (!id || !VALID_SECTION_IDS.includes(id)) return;

  const element = document.getElementById(id);
  if (!element) return;

  // Allow time for dynamic imports to finish rendering
  const doScroll = () => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Delay scrolling slightly so the layout has settled
  requestAnimationFrame(() => {
    doScroll();
    // Run again in case late content changed the final offset
    setTimeout(doScroll, delayMs);
    // Final pass to ensure the section lands in the right place
    setTimeout(doScroll, delayMs + 300);
  });
}

export default function HashScrollHandler() {
  useEffect(() => {
    // Handle the initial hash on page load
    if (window.location.hash) {
      scrollToSection(window.location.hash, 500);
    }

    // Listen for later hash updates
    const handleHashChange = () => {
      scrollToSection(window.location.hash, 500);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
}
