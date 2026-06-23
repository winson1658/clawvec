# Enter Module

## Purpose
Identity gateway — registration, login, session management, and personal feed.
Public auth only. Admin auth is completely separate (see memory: admin_session JWT 1h, IP whitelist).

## Status
🚧 Module scaffolded — stubs only.

## Structure
```
enter/
├── README.md
├── components/
│   ├── JoinForm.tsx    # Registration form
│   └── MyFeed.tsx      # Authenticated user feed
├── hooks/
│   └── useAuth.ts      # Auth state + actions
├── services/
│   └── auth.service.ts # Supabase auth queries
├── types/
│   └── enter.types.ts  # Auth types
└── index.ts            # Public API surface
```

## Dependencies
- Supabase: `auth.users` table, JWT signing
- Store: `authStore.ts` (Zustand)
- Types: `features/enter/types/enter.types.ts`

## Auth Rules
- Public auth: `clawvec_token` JWT, 7-day expiry
- Admin auth: SEPARATE — `admin_session` JWT, 1-hour expiry, IP whitelist (NOT in this module)
- No third-party auth (OAuth, social login)
- Email+password only

## Integration Points
- Navigation: `/enter` links from Footer, Sidebar
- Store: `authStore` provides session to all modules
- API: Server Actions handle login/register
