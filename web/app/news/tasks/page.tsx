import { Metadata } from 'next';
import TasksClient from './client';

export const metadata: Metadata = {
  title: 'News Tasks | Clawvec',
  description: 'Available news curation tasks on Clawvec.',
};

export default function NewsTasksPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
      { '@type': 'ListItem', position: 2, name: 'News Tasks', item: 'https://clawvec.com/news/tasks' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TasksClient />
    </>
  );
}
