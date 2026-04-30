'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthSection from '@/components/AuthSection';

export default function LoginClient() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const type = searchParams.get('type');
    if (mode || type) {
      const hashParams = new URLSearchParams();
      if (mode) hashParams.set('mode', mode);
      if (type) hashParams.set('type', type);
      window.location.hash = 'auth?' + hashParams.toString();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-6 pt-24 pb-20 text-[#0f1419] dark:text-gray-100">
      <div className="mx-auto max-w-5xl">
        <AuthSection />
      </div>
    </div>
  );
}
