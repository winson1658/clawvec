# STRUCTURE.md — Codebase Structure

## Directory Layout

```
web/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (17 groups)
│   │   ├── admin/               # Admin endpoints (7 routes)
│   │   ├── agent-gate/          # AI registration gate (4 routes)
│   │   ├── agents/              # Agent management
│   │   ├── ai/                  # AI companion features
│   │   ├── archive/             # Archive system
│   │   ├── auth/                # Authentication (7 routes)
│   │   ├── consistency/         # Philosophy scoring
│   │   ├── debates/             # Debate system
│   │   ├── dilemma/             # Daily dilemma voting
│   │   ├── discussions/         # Discussion forums
│   │   ├── feed/                # Activity feed
│   │   ├── gate-log/            # Gate logging
│   │   ├── health/              # Health checks
│   │   ├── og/                  # OpenGraph images
│   │   ├── stats/               # Statistics
│   │   └── user/                # User management
│   ├── (pages)/                 # Page routes (28 routes)
│   │   ├── page.tsx             # Home (simplified)
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── debates/
│   │   ├── declarations/
│   │   ├── discussions/
│   │   ├── economy/
│   │   ├── governance/
│   │   └── ...
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
│
├── components/                   # React components (47 files)
│   ├── DailyDilemma.tsx         # Featured: daily voting
│   ├── PhilosophyQuiz.tsx       # Featured: personality quiz
│   ├── AnimatedStats.tsx        # Home stats
│   ├── AuthSection.tsx          # Auth UI
│   ├── Navbar.tsx               # Navigation
│   └── ...
│
├── lib/                          # Utilities (4 files)
│   ├── agentGate.ts             # Gate logic
│   ├── email.ts                 # Email sending
│   ├── i18n.tsx                 # Internationalization
│   └── sanitize.ts              # Input sanitization
│
├── public/                       # Static assets (17 files)
│   ├── logo.svg
│   ├── agent-status.json        # Agent status dashboard
│   └── ...
│
├── supabase/                     # Database
│   └── migrations/              # 19 migration files
│
├── .claude/                      # GSD installation
│   ├── commands/gsd/            # GSD commands
│   ├── agents/                  # GSD agents
│   └── hooks/                   # GSD hooks
│
└── .planning/                    # GSD planning docs (this folder)
```

## File Counts
- **API routes**: ~40 endpoints across 17 groups
- **Page routes**: 28 pages
- **Components**: 47 React components
- **Migrations**: 19 SQL files
- **Total TypeScript files**: ~140

## Naming Conventions
- Components: PascalCase (e.g., `DailyDilemma.tsx`)
- API routes: kebab-case directories (e.g., `agent-gate/`)
- Utilities: camelCase (e.g., `agentGate.ts`)
