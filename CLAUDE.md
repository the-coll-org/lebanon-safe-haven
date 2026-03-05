# CLAUDE.md - The Haven (Lebanon Crisis Relief App)

## Project Overview

Full-stack Next.js 16 humanitarian crisis relief app connecting displaced people in Lebanon with available resources (shelter, food, appliances, clothing). Bilingual Arabic (RTL, default) + English.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui (new-york style, RTL-enabled)
- **Database**: PostgreSQL + Drizzle ORM
- **i18n**: next-intl (locales: `ar`, `en`)
- **Auth**: Clerk (admin panel), edit tokens (public listings)
- **Encryption**: AES-256-GCM for phone numbers
- **News**: Proxied NDJSON from LEB Monitor, AI summary via Gemini 2.5 Flash Lite

## Common Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema changes to PostgreSQL (drizzle-kit push)
npm run db:seed      # Seed admin accounts (npx tsx src/db/seed.ts)
npm run db:studio    # Open Drizzle Studio GUI
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # All pages with i18n routing (ar/en)
│   │   ├── admin/         # Clerk login + dashboard (protected)
│   │   ├── listings/      # Browse + detail views
│   │   ├── offer/         # Submit new listing form
│   │   ├── news/          # Real-time news feed + AI overview
│   │   ├── hotlines/      # Emergency hotlines
│   │   ├── resources/     # External aid links
│   │   └── feedback/      # User feedback form
│   └── api/               # REST API route handlers
│       ├── listings/      # Public listing CRUD + flagging
│       ├── admin/         # Auth + admin operations
│       ├── news/          # Feed proxy + AI summary
│       └── webhooks/      # Clerk user sync
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── news/              # News feed components
│   └── *.tsx              # App-specific components
├── hooks/                 # Feed stream, prefs, layout, font size
├── db/
│   ├── schema.ts          # Drizzle table definitions
│   ├── index.ts           # DB connection (singleton)
│   ├── seed.ts            # Initial admin seeder
│   └── add-admin.ts       # CLI to add admin users
├── lib/
│   ├── auth.ts            # Clerk session + DB sync
│   ├── crypto.ts          # Phone encryption
│   ├── csrf.ts            # Origin validation
│   ├── rate-limit.ts      # In-memory rate limiter
│   ├── constants.ts       # Regions, categories, hotlines
│   ├── news-types.ts      # Feed types + category constants
│   └── utils.ts           # Helpers
├── i18n/                  # next-intl config (routing, navigation, request)
├── types/index.ts         # Shared TypeScript types
└── middleware.ts          # Clerk + next-intl composed middleware
messages/
├── ar.json                # Arabic translations
└── en.json                # English translations
docs/
├── deployment.md          # Docker, env vars, security
├── api.md                 # DB schema, endpoints, listing types
└── admin-guide.md         # Dashboard usage, roles, permissions
```

## Path Alias

`@/` maps to `./src/` (configured in tsconfig.json).

## Key Architecture Patterns

- **Server Components by default**: Pages are async server components using `setRequestLocale(locale)` then `getTranslations()`.
- **Client Components**: Forms and interactive UI use `"use client"` directive.
- **i18n workaround**: All pages must call `setRequestLocale(locale)` before `getTranslations()` due to a Next.js 16 middleware locale propagation issue.
- **No migrations directory**: Schema changes are applied directly via `drizzle-kit push`.
- **Edit tokens (no user accounts)**: Listing creators get a UUID edit token instead of requiring registration.
- **Locale-aware navigation**: Use `<Link>` from `@/i18n/navigation`, not from `next/link`.
- **Clerk auth**: Admin panel uses Clerk. Superadmins are DB-seeded; org admins come from `ADMIN_EMAILS` env var (`email:region` format). `getSession()` looks up by `clerkId`. `syncUserWithDatabase()` handles first-login provisioning. Non-authorized users see "Access Denied".
- **News proxy**: `/api/news` streams NDJSON from lebmonitor.com. `/api/news/summary` caches AI summaries per locale (1hr TTL).

## Database Schema (6 tables)

- **listings**: id, phone (encrypted), region, district, village, category, capacity, status, editToken, verified, flagCount, unavailableCount, lat/lng, timestamps
- **municipalities**: id, name, email, region, role, username, passwordHash (nullable), clerkId, createdAt
- **flags**: id, listingId (FK), reason, createdAt
- **feedback**: id, name, email, message, category, userType, municipalityId, createdAt
- **unavailable_reports**: id, listingId (FK), ipHash, createdAt
- **admin_logs**: id, action, entityType, entityId, userId, userName, details, ip, ua, createdAt

## API Conventions

- Route handlers export named HTTP method functions (GET, POST, PATCH, DELETE)
- All mutating endpoints validate CSRF via `validateOrigin()`
- Auth-protected routes verify session via `getSession()` (Clerk-backed)
- Rate limiting applied to create listing (10/hr), flag (10/hr)
- Input validation: phone regex, capacity bounds, region/category whitelists, text length limits
- Errors returned as JSON with appropriate HTTP status codes

## Environment Variables

- `SESSION_SECRET` - HMAC key for phone encryption cookie signing (required in production)
- `ENCRYPTION_KEY` - Hex-encoded 32-byte AES key for phone encryption (required in production)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Svix webhook signing secret
- `ADMIN_EMAILS` - Region-scoped admin emails (format: `email:region,email:region`)
- `GEMINI_API_KEY` - Google Gemini API key for AI news summary
- `NODE_ENV` - Set to `production` in Docker

## Conventions

- No test suite currently exists
- shadcn/ui components live in `src/components/ui/`
- Translations are namespaced in `messages/{locale}.json`
- RTL-first design — Arabic is the default locale
