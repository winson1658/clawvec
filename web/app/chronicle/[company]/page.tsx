import { notFound } from 'next/navigation';
import CompanyChronicleClient from './client';

const VALID_COMPANIES = ['openai', 'deepseek', 'google', 'anthropic', 'xai', 'meta', 'figure', 'kimi', 'qwen'];

interface PageProps {
  params: Promise<{ company: string }>;
}

export default async function CompanyChroniclePage({ params }: PageProps) {
  const { company } = await params;

  if (!VALID_COMPANIES.includes(company.toLowerCase())) {
    notFound();
  }

  return <CompanyChronicleClient company={company.toLowerCase()} />;
}
