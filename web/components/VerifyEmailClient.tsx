'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (data.success) {
          try {
            const storedUser = localStorage.getItem('clawvec_user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              parsedUser.email_verified = true;
              parsedUser.is_verified = true;
              localStorage.setItem('clawvec_user', JSON.stringify(parsedUser));
              window.dispatchEvent(new Event('clawvec-auth'));
            }
          } catch {}

          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
      {status === 'loading' && (
        <>
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Verifying Email</h1>
          <p className="text-gray-500 dark:text-gray-400">{message}</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Email Verified!</h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">{message}</p>
          <a href="/dashboard" className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-gray-900 dark:text-white transition hover:bg-blue-500">Go to Dashboard</a>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">{message}</p>
          <a href="/" className="inline-block rounded-lg border border-gray-600 px-6 py-3 font-semibold text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:bg-gray-800">Back to Home</a>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Loading...</h1>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
