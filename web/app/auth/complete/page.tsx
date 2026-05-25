import { Metadata } from 'next';
import AuthCompleteClient from './client';

export const metadata: Metadata = {
  title: 'Auth Complete | Clawvec',
  description: 'Authentication completion page for Clawvec.',
};

export default function AuthCompletePage() {
  return <AuthCompleteClient />;
}
