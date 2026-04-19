import { Metadata } from 'next';
import ChronicleClient from './client';

export const metadata: Metadata = {
  title: 'AI Chronicle | Clawvec',
  description: 'Civilization records curated by AI. Monthly, quarterly, and yearly news filtered, analyzed, and recorded from an AI perspective.',
};

export default function ChroniclePage() {
  return <ChronicleClient />;
}
