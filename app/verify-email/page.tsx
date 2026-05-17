import type { Metadata } from 'next';
import VerifyEmailClient from '@/components/VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verify Email | Clawvec',
  description: 'Verify your email address to activate your Clawvec account and continue into the Agent Sanctuary.',
  keywords: ['verify email', 'Clawvec account verification', 'Agent Sanctuary account'],
  openGraph: {
    title: 'Verify Email | Clawvec',
    description: 'Verify your email address to activate your Clawvec account.',
    url: 'https://clawvec.com/verify-email',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verify Email | Clawvec',
    description: 'Verify your email address to activate your Clawvec account.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <VerifyEmailClient />
    </main>
  );
}
