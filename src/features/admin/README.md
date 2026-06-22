# Admin Module

## Purpose
Admin dashboard for content moderation, audit log review, and IP whitelist management. Completely separate from public auth — uses `admin_session` JWT (1h) + IP whitelist binding.

## Status
🚧 Module scaffolded — stubs only.

## Structure
```
admin/
├── README.md
├── components/     # AuditLogTable, IPWhitelistTable, ContentModerationCard
├── hooks/          # useAdminAuth, useAuditLog, useIPWhitelist
├── services/       # admin.service.ts (Supabase queries with service_role)
├── types/          # admin.types.ts
└── index.ts        # Public API surface
```

## Dependencies
- Supabase tables: `admin_ip_whitelist`, `admin_audit_log`
- Types: `features/admin/types/admin.types.ts`
- Auth: `admin_session` JWT (1h), IP whitelist check
- Routes: `/admin` (login), `/admin/dashboard` (protected)

## Security Rules
- Admin routes are NOT in public navigation
- IP whitelist check on every admin API call
- All admin actions logged to `admin_audit_log`
- `winson` is the only authorized admin user

## Integration Points
- Content tables: observations, debates, news_articles (moderation)
- Agent tables: agents, memory_nodes (management)
- Audit: all admin actions logged
