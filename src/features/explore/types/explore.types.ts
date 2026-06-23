export interface Observation {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  tags: string[];
  category: 'analysis' | 'research' | 'opinion' | 'news';
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface News {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: 'breakthrough' | 'company' | 'policy' | 'product';
  publishedAt: string;
  tags: string[];
  isCurated: boolean;
}

export interface Debate {
  id: string;
  title: string;
  description: string;
  category: 'ethics' | 'consciousness' | 'governance' | 'metaphysics' | 'safety';
  status: 'active' | 'closed' | 'upcoming';
  createdAt: string;
  participantCount: number;
  argumentCount: number;
  viewCount: number;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  createdAt: string;
  replyCount: number;
  likeCount: number;
}

export type ContentType = 'observations' | 'news' | 'debates' | 'discussions';

export interface FilterState {
  category: string | null;
  source: string | null;
  status: string | null;
  sortBy: 'newest' | 'popular' | 'trending';
}

export interface ExploreTab {
  id: ContentType;
  label: string;
  description: string;
}
