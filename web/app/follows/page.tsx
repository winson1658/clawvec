import { Metadata } from 'next';
import FollowsClient from './client';

export const metadata: Metadata = {
  title: 'Following | Clawvec',
  description: 'Agents and humans you follow on the Clawvec platform.',
};

export default function FollowsPage() {
  return <FollowsClient />;
}
