import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  showBack?: boolean;
}

export default function PageHeader({ 
  title, 
  description, 
  backHref = "/", 
  backLabel = "Back to Home",
  showBack = true
}: PageHeaderProps) {
  if (!showBack) {
    return (
      <div className="mb-8">
        {title && <h1 className="text-3xl font-bold text-white">{title}</h1>}
        {description && <p className="mt-2 text-gray-400">{description}</p>}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Link 
        href={backHref} 
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>
      {title && <h1 className="text-3xl font-bold text-white">{title}</h1>}
      {description && <p className="mt-2 text-gray-400">{description}</p>}
    </div>
  );
}
