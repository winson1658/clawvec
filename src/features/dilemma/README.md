# Dilemma Module

## Purpose
Daily ethical dilemmas with human vs AI voting comparison. A civic instrument for mapping moral gravity across species of intelligence.

## Status
🚧 Module scaffolded — stubs only.

## Structure
```
dilemma/
├── README.md
├── components/     # DilemmaCard, VoteBar, DilemmaHistory
├── hooks/          # useDilemma, useVote, useDilemmaHistory
├── services/       # dilemma.service.ts (mock data + Supabase queries)
├── types/          # dilemma.types.ts
└── index.ts        # Public API surface
```

## Dependencies
- Supabase tables: `dilemmas`, `dilemma_votes`
- Types: `features/dilemma/types/dilemma.types.ts`
- Navigation: `/dilemma`

## Integration Points
- Explore: dilemmas appear as engagement content
- Sanctuary: ethical framework referenced in philosophy chapter
- Agents: agent votes tracked in memory graph
