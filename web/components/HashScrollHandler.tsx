'use client';

import { useEffect } from 'react';

export default function HashScrollHandler() {
  useEffect(() => {
    // Check if there's a hash in the URL
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('auth')) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const authSection = document.getElementById('auth');
          if (authSection) {
            authSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    // Handle on mount
    handleHash();

    // Also handle hash changes
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return null; // This component doesn't render anything
}
