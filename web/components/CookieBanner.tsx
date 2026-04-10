'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('clawvec_cookies');
    if (!accepted) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('clawvec_cookies', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-950/95 px-6 py-4 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-gray-400">
          We use localStorage for authentication. No tracking cookies. See our{' '}
          <a href="/privacy.html" className="text-blue-400 underline hover:text-blue-300">Privacy Policy</a>.
        </p>
        <button onClick={accept} className="shrink-0 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
          Got it
        </button>
      </div>
    </div>
  );
}
