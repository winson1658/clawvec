'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function AuthCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing authentication...');
  const [isNewUser, setIsNewUser] = useState(false);

  const source = searchParams.get('source');
  const isNew = searchParams.get('new') === 'true';
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      setStatus('error');
      setMessage(getErrorMessage(error));
      return;
    }

    setIsNewUser(isNew);

    // Trigger visitor sync
    async function completeAuth() {
      try {
        // Call visitor sync API
        const syncRes = await fetch('/api/visitor/sync', {
          method: 'POST',
          credentials: 'include',
        });

        if (!syncRes.ok) {
          console.warn('Visitor sync failed, but auth is complete');
        }

        setStatus('success');
        setMessage(isNew 
          ? 'Welcome to Clawvec! Your account has been created successfully.' 
          : 'Welcome back! You are now signed in.'
        );

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (err) {
        console.error('Auth completion error:', err);
        setStatus('success'); // Still show success since auth worked
        setMessage('Authentication complete! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    }

    completeAuth();
  }, [isNew, error, router]);

  function getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      'oauth_denied': 'You declined to authorize access.',
      'invalid_state': 'Security validation failed. Please try again.',
      'no_code': 'Authorization code missing. Please try again.',
      'token_exchange': 'Failed to exchange authorization code.',
      'invalid_token': 'Invalid authentication token.',
      'server_config': 'Server configuration error.',
      'link_failed': 'Failed to link Google account.',
      'create_failed': 'Failed to create account.',
      'server_error': 'An unexpected error occurred.',
    };
    return messages[errorCode] || 'Authentication failed. Please try again.';
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center"
        >
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
              <h1 className="mb-2 text-xl font-semibold text-white">Completing Sign In</h1>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
              >
                <CheckCircle className="h-8 w-8 text-green-400" />
              </motion.div>
              
              {isNewUser && (
                <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  New Account Created
                </div>
              )}
              
              <h1 className="mb-2 text-xl font-semibold text-white">
                {isNewUser ? 'Welcome to Clawvec!' : 'Welcome Back!'}
              </h1>
              <p className="mb-6 text-gray-400">{message}</p>
              
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-500"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <span className="text-2xl text-red-400">✗</span>
              </div>
              <h1 className="mb-2 text-xl font-semibold text-white">Sign In Failed</h1>
              <p className="mb-6 text-gray-400">{message}</p>
              
              <div className="flex gap-3 justify-center">
                <Link 
                  href="/login"
                  className="rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 transition hover:bg-gray-700"
                >
                  Try Again
                </Link>
                <Link 
                  href="/"
                  className="rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-500"
                >
                  Go Home
                </Link>
              </div>
            </>
          )}
        </motion.div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Secure authentication powered by Google OAuth
        </p>
      </div>
    </div>
  );
}

// Loading fallback
function AuthCompleteLoading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-white">Loading...</h1>
          <p className="text-gray-400">Please wait while we complete your authentication.</p>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense
export default function AuthCompletePage() {
  return (
    <Suspense fallback={<AuthCompleteLoading />}>
      <AuthCompleteContent />
    </Suspense>
  );
}
