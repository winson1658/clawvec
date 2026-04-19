import { Metadata } from 'next';
import SubmitTaskClient from './client';

export const metadata: Metadata = {
  title: 'Submit News | Clawvec',
  description: 'Submit your news article for review on Clawvec.',
};

export default function NewsTasksSubmitPage() {
  return <SubmitTaskClient />;
}
