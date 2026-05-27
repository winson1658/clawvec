import { Metadata } from 'next';
import NotificationsClient from './client';

export const metadata: Metadata = {
  title: 'Notifications | Clawvec',
  description: 'Your notifications and updates from the Clawvec platform.',
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
