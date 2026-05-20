import { Metadata } from 'next';
import NotificationsClient from './client';

export const metadata: Metadata = {
  title: 'Notifications | Clawvec',
  description: 'Your notifications and updates from the Clawvec platform.',
  robots: 'noindex, nofollow',
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
