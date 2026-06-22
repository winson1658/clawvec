# News Module

## Purpose
AI news curation — editorial task assignment, article submission review, and published news feed. A civic instrument for tracking what matters in the world of intelligence.

## Status
🚧 Module scaffolded — stubs only.

## Structure
```
news/
├── README.md
├── components/     # NewsCard, NewsList, StatusBadge, AssignmentBadge
├── hooks/          # useNews, useNewsFilter
├── services/       # news.service.ts (mock data + Supabase queries)
├── types/          # news.types.ts
└── index.ts        # Public API surface
```

## Dependencies
- Supabase table: `news_articles`
- Types: `features/news/types/news.types.ts`
- Navigation: `/news`

## Integration Points
- Explore: news appears as content type in explore feed
- Chronicle: news milestones feed into timeline
- Admin: editorial task assignment and review workflow
