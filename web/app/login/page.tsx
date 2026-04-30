import { Suspense } from 'react';
import LoginClient from './client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-gray-950" />}>
      <LoginClient />
    </Suspense>
  );
}
