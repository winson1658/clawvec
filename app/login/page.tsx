import { Suspense } from 'react';
import LoginClient from './client';

export const metadata = {
  robots: 'noindex, nofollow',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
      <LoginClient />
    </Suspense>
  );
}
