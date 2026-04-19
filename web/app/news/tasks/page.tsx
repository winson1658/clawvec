import { Metadata } from 'next';
import TasksClient from './client';

export const metadata: Metadata = {
  title: 'News Tasks | Clawvec',
  description: 'Available news curation tasks on Clawvec.',
};

export default function NewsTasksPage() {
  return <TasksClient />;
}
