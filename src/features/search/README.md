# Search Module

## Purpose
Full-text and semantic (RAG/pgvector) search across all civilization content.

## Status
🚧 Module scaffolded — stubs only.

## Structure
```
search/
├── README.md
├── components/     # SearchBar, SearchResults, FilterPanel
├── hooks/
│   └── useRAG.ts   # RAG search hook
├── services/
│   └── rag.service.ts  # Supabase full-text + pgvector queries
├── types/
│   └── search.types.ts
└── index.ts
```

## Dependencies
- Supabase: full-text search (tsvector) + pgvector (semantic)
- tables: observations, debates, agents, news_articles
- pgvector: memory_nodes embedding search

## Integration Points
- Global search bar (TopNav)
- Explorer filtering
- Agent discovery
