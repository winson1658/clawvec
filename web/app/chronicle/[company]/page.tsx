import { notFound } from 'next/navigation';
import CompanyChronicleClient from './client';

const VALID_COMPANIES = ['openai', 'deepseek', 'google', 'anthropic', 'xai', 'meta', 'figure', 'kimi', 'qwen'];

interface CompanyMeta {
  name: string;
  fullName: string;
  founded: string;
  founder: string;
  description: string;
}

const COMPANY_META: Record<string, CompanyMeta> = {
  openai: { name: 'OpenAI', fullName: 'OpenAI Inc. / OpenAI LP', founded: '2015-12-11', founder: 'Sam Altman, Elon Musk, Greg Brockman, Ilya Sutskever, Wojciech Zaremba, John Schulman', description: 'Leading AI research company transitioning from non-profit to capped-profit model. Creator of GPT series, ChatGPT, DALL-E, and Sora.' },
  deepseek: { name: 'DeepSeek', fullName: 'DeepSeek AI', founded: '2023-07-17', founder: 'Liang Wenfeng (High-Flyer Quant)', description: 'Chinese AI company disrupting the industry with ultra-efficient training methods. Released DeepSeek-V3 and R1 at fractions of competitors\' costs.' },
  google: { name: 'Google AI', fullName: 'Google DeepMind / Google AI', founded: '2010-09-23', founder: 'Demis Hassabis, Shane Legg, Mustafa Suleyman', description: 'Tech giant with DeepMind acquisition (2014) and Gemini model family. Pioneer in AlphaGo, AlphaFold, and large-scale multimodal AI.' },
  anthropic: { name: 'Anthropic', fullName: 'Anthropic PBC', founded: '2021-02-01', founder: 'Dario & Daniela Amodei (ex-OpenAI)', description: 'AI safety-focused company founded by former OpenAI researchers. Creator of Claude series with emphasis on constitutional AI and safety.' },
  xai: { name: 'xAI', fullName: 'xAI Corp', founded: '2023-07-12', founder: 'Elon Musk', description: 'Elon Musk\'s AI company focused on understanding the universe. Creator of Grok series with real-time X integration.' },
  meta: { name: 'Meta AI', fullName: 'Meta AI (FAIR)', founded: '2013-12-09', founder: 'Yann LeCun, Mark Zuckerberg', description: 'Meta\'s AI research division. Pioneer in open-source LLMs (LLaMA series) and multimodal AI.' },
  figure: { name: 'Figure AI', fullName: 'Figure AI Inc.', founded: '2022-05-01', founder: 'Brett Adcock', description: 'Humanoid robotics company building general-purpose robots. Developed Figure 01, 02, 03 with in-house AI models.' },
  kimi: { name: 'KIMI', fullName: 'Moonshot AI', founded: '2023-03-01', founder: 'Yang Zhilin (ex-Google Brain, Tsinghua)', description: 'Chinese AI startup focused on long-context processing. Creator of Kimi Chat with 2M token context window.' },
  qwen: { name: 'Qwen', fullName: 'Tongyi Qianwen (Alibaba)', founded: '2023-04-11', founder: 'Alibaba Cloud (Jingren Zhou team)', description: 'Alibaba\'s large language model family. Pioneer in open-source Chinese LLMs with Qwen series.' },
};

interface PageProps {
  params: Promise<{ company: string }>;
}

export default async function CompanyChroniclePage({ params }: PageProps) {
  const { company } = await params;

  if (!VALID_COMPANIES.includes(company.toLowerCase())) {
    notFound();
  }

  const meta = COMPANY_META[company.toLowerCase()];
  const pageUrl = `https://clawvec.com/chronicle/${company.toLowerCase()}`;

  const articleJsonLd = meta ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${meta.name} — AI Chronicle | Clawvec`,
    description: meta.description,
    url: pageUrl,
    datePublished: meta.founded,
    author: {
      '@type': 'Organization',
      name: 'Clawvec',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Clawvec',
      logo: {
        '@type': 'ImageObject',
        url: 'https://clawvec.com/logo.svg',
      },
    },
    about: {
      '@type': 'Organization',
      name: meta.fullName,
      foundingDate: meta.founded,
      founder: {
        '@type': 'Person',
        name: meta.founder,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  } : null;

  return (
    <>
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clawvec.com' },
            { '@type': 'ListItem', position: 2, name: 'Chronicle', item: 'https://clawvec.com/chronicle' },
            { '@type': 'ListItem', position: 3, name: meta?.name || company, item: `https://clawvec.com/chronicle/${company}` },
          ],
        }) }}
      />
      <CompanyChronicleClient company={company.toLowerCase()} />
    </>
  );
}
