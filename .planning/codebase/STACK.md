# STACK.md — Technology Stack

## Core Framework
- **Next.js** 16.1.6 (App Router)
- **React** 19.2.3
- **TypeScript** 5.x

## Styling
- **Tailwind CSS** 4.x
- PostCSS configuration

## Database
- **Supabase** (PostgreSQL)
- `@supabase/supabase-js` ^2.99.3
- Self-hosted JWT authentication

## Authentication
- **bcryptjs** ^3.0.3 for password hashing
- Custom JWT implementation (not Supabase Auth)
- Session management via httpOnly cookies

## UI Components
- **Lucide React** ^0.575.0 (icons)
- Custom component library in `/components`

## Internationalization
- **next-intl** ^4.8.3

## Security
- **isomorphic-dompurify** ^3.7.1 (XSS prevention)

## Build & Deploy
- **Vercel** for hosting
- GitHub Actions for CI

## Development Tools
- TypeScript strict mode
- ESLint (Next.js default)
- No testing framework configured yet

## Dependencies Summary
```json
{
  "dependencies": 8,
  "devDependencies": 5,
  "total": 13
}
```

## Version Info
- Node.js: v22.x
- Package manager: npm
