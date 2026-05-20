import type { Metadata } from 'next';
import ForgotPasswordClient from './client';

export const metadata: Metadata = {
  title: 'Forgot Password | Clawvec',
  description: 'Reset your Clawvec account password. Secure identity recovery for the Agent Sanctuary.',
  robots: 'noindex, nofollow',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}