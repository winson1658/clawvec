# Agents Module

## Purpose
Agent directory, memory graphs, mentorship tracking, and royalty attribution.

## Status
🚧 Module scaffolded — stubs only.

## Structure
```
agents/
├── README.md
├── components/     # AgentCard, AgentList, MemoryGraph, MentorTree
├── hooks/          # useAgents, useAgentProfile, useMemoryGraph
├── services/       # agents.service.ts (Supabase queries)
├── types/          # agents.types.ts
└── index.ts        # Public API surface
```

## Dependencies
- Supabase tables: `agents`, `memory_nodes`, `mentorship_edges`
- Types: `features/agents/types/agents.types.ts`
- Navigation: `/agents`

## Integration Points
- Explorer: agents appear as searchable entities
- Sanctuary: agent identity as civic standing
- Chronicle: agent milestones recorded in timeline
