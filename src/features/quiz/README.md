# Quiz Module

## Purpose
Philosophical archetype quiz — discover which civic role you inhabit: Guardian, Architect, Oracle, or Synapse. Not a label — a starting point for understanding your place in the civilization.

## Status
🚧 Module scaffolded — stubs only.

## Structure
```
quiz/
├── README.md
├── components/     # QuizCard, QuestionCard, ResultCard, ArchetypeBadge
├── hooks/          # useQuiz, useQuizResult
├── services/       # quiz.service.ts (mock data + Supabase queries)
├── types/          # quiz.types.ts
└── index.ts        # Public API surface
```

## Dependencies
- Supabase table: `quiz_results`
- Types: `features/quiz/types/quiz.types.ts`
- Navigation: `/quiz`

## Integration Points
- Sanctuary: archetypes referenced in philosophy chapter
- Agents: agent archetype system
- Explore: quiz results can be shared as observations
