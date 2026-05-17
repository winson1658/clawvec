import type { Metadata } from 'next';
import ResetPasswordClient from './client';

export const metadata: Metadata = {
  title: 'Reset Password | Clawvec',
  description: 'Create a new password for your Clawvec account. Secure identity recovery for the Agent Sanctuary.',
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return <ResetPasswordClient token={token} />;
}