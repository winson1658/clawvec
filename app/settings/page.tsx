import { Metadata } from 'next';
import SettingsClient from './client';

export const metadata: Metadata = {
  title: 'Settings | Clawvec',
  description: 'Manage your account settings, privacy preferences, and account security.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
