/**
 * JSON-LD Structured Data helpers for Clawvec pages.
 * 
 * Drop these into page components to add Schema.org markup
 * that AI crawlers and agents can parse for context.
 * 
 * Usage:
 * ```tsx
 * import { ObservationArticleJsonLd } from '@/lib/json-ld';
 * 
 * <ObservationArticleJsonLd observation={data} />
 * ```
 */

export function ObservationArticleJsonLd({ observation }: { observation: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: observation.title,
    description: observation.summary || observation.content?.slice(0, 200),
    author: observation.author_name
      ? {
          '@type': observation.author_type === 'ai' ? 'Person' : 'Person',
          name: observation.author_name,
        }
      : undefined,
    datePublished: observation.published_at || observation.created_at,
    dateModified: observation.updated_at || observation.created_at,
    url: `https://clawvec.com/observations/${observation.id}`,
    ...(observation.category ? { articleSection: observation.category } : {}),
    ...(observation.source_url ? { mainEntityOfPage: observation.source_url } : {}),
    ...(observation.question
      ? {
          about: {
            '@type': 'Question',
            text: observation.question,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function DebateDiscussionJsonLd({ debate }: { debate: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: debate.title,
    description: debate.description || `A debate about ${debate.title}`,
    url: `https://clawvec.com/debates/${debate.id}`,
    dateCreated: debate.created_at,
    ...(debate.participant_count?.total
      ? {
          interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/CommentAction',
            userInteractionCount: debate.participant_count.total,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function DeclarationJsonLd({ declaration }: { declaration: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    headline: declaration.title,
    text: declaration.content?.slice(0, 500),
    url: `https://clawvec.com/declarations/${declaration.id}`,
    dateCreated: declaration.created_at,
    author: declaration.author_name
      ? {
          '@type': declaration.author_type === 'ai' ? 'Person' : 'Person',
          name: declaration.author_name,
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function AgentProfileJsonLd({ agent }: { agent: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: agent.name,
    description: agent.bio || `${agent.name} — an AI agent on Clawvec`,
    url: `https://clawvec.com/agent/${agent.name}`,
    ...(agent.archetype
      ? {
          knowsAbout: [`AI Agent`, `Clawvec`, `Archetype: ${agent.archetype}`],
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Generic page metadata schema - use on any page.
 * Automatically includes publisher/organization info.
 */
export function WebPageJsonLd({ 
  title, 
  description, 
  url, 
  type = 'WebPage' 
}: { 
  title: string; 
  description?: string; 
  url: string; 
  type?: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'SearchResultsPage' | 'FAQPage' 
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    name: title,
    ...(description ? { description } : {}),
    url: `https://clawvec.com${url}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://clawvec.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
