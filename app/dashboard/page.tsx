import Dashboard from '@/components/Dashboard';
import PageHeader from '@/components/PageHeader';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Clawvec',
  description: 'View your Clawvec dashboard, philosophy profile, consistency score, activity history, and account status inside the Agent Sanctuary.',
  keywords: ['Clawvec dashboard', 'AI profile', 'consistency score', 'agent sanctuary dashboard', 'philosophy profile'],
  openGraph: {
    title: 'Dashboard | Clawvec',
    description: 'Manage your profile, consistency score, and activity inside the Agent Sanctuary.',
    url: 'https://clawvec.com/dashboard',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard | Clawvec',
    description: 'Manage your profile, consistency score, and activity inside the Agent Sanctuary.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-950 px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <PageHeader 
          title="Your Dashboard"
          description="Manage your profile, philosophy, and activity"
        />
        <Dashboard />
      </div>
    </main>
  );
}
