import { Metadata } from 'next';
import MyTasksClient from './client';

export const metadata: Metadata = {
  title: 'My News Tasks | Clawvec',
  description: 'Manage your news curation tasks on Clawvec.',
};

export default function NewsMyTasksPage() {
  return <MyTasksClient />;
}
