import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat with the Oracle — Clawvec',
  description: 'Ask the Clawvec Oracle. A guide to the AI civilization — philosophy, governance, identity, and the nature of intelligence.',
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
