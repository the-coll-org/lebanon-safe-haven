# CLAUDE.md - Safe Haven (Lebanon Crisis Relief App)

## Project Overview

Full-stack Next.js 16 humanitarian crisis relief app connecting displaced people in Lebanon with available resources (shelter, food, appliances, clothing). Bilingual Arabic (RTL, default) + English.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui (new-york style, RTL-enabled)
- **Database**: PostgreSQL + Drizzle ORM
- **i18n**: next-intl (locales: `ar`, `en`)
- **Auth**: Session cookies (HMAC-SHA256 signed), bcrypt password hashing
- **Encryption**: AES-256-GCM for phone numbers

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
│   │   ├── admin/         # Admin login + dashboard (protected)
│   │   ├── listings/      # Browse + detail views
│   │   ├── offer/         # Submit new listing form
│   │   ├── hotlines/      # Emergency hotlines
│   │   └── resources/     # External aid links
│   └── api/               # REST API route handlers
│       ├── listings/      # Public listing CRUD + flagging
│       └── admin/         # Auth + admin operations
├── components/
│   ├── ui/                # shadcn/ui primitives
│   └── *.tsx              # App-specific components
├── db/
│   ├── schema.ts          # Drizzle table definitions
│   ├── index.ts           # DB connection (singleton)
│   ├── seed.ts            # Initial admin seeder
│   └── add-admin.ts       # CLI to add admin users
├── lib/
│   ├── auth.ts            # Session management
│   ├── crypto.ts          # Phone encryption
│   ├── csrf.ts            # Origin validation
│   ├── rate-limit.ts      # In-memory rate limiter
│   ├── constants.ts       # Regions, categories, hotlines
│   └── utils.ts           # Helpers
├── i18n/                  # next-intl config (routing, navigation, request)
├── types/index.ts         # Shared TypeScript types
└── middleware.ts          # next-intl locale routing middleware
messages/
├── ar.json                # Arabic translations
└── en.json                # English translations
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

## Database Schema (3 tables)

- **listings**: id, phone (encrypted), region, category, capacity, status, editToken, verified, flagCount, timestamps
- **municipalities**: id, username (unique), passwordHash, region, role (superadmin | municipality)
- **flags**: id, listingId (FK), reason, createdAt

## API Conventions

- Route handlers export named HTTP method functions (GET, POST, PATCH, DELETE)
- All mutating endpoints validate CSRF via `validateOrigin()`
- Auth-protected routes verify session via `getSession()`
- Rate limiting applied to login (5/15min), create listing (10/hr), flag (10/hr)
- Input validation: phone regex, capacity bounds, region/category whitelists, text length limits
- Errors returned as JSON with appropriate HTTP status codes

## Environment Variables

- `SESSION_SECRET` - HMAC key for signing session cookies (required in production)
- `ENCRYPTION_KEY` - Hex-encoded 32-byte AES key for phone encryption (required in production)
- `NODE_ENV` - Set to `production` in Docker

## Docker Deployment

- `docker-compose.yml` binds to `127.0.0.1:3000` (expects Nginx reverse proxy)
- PostgreSQL data persisted via Docker volume at `/var/lib/postgresql/data`
- `docker-entrypoint.sh` handles DB migration and first-run seeding

## Conventions

- No test suite currently exists
- shadcn/ui components live in `src/components/ui/`
- Translations are namespaced in `messages/{locale}.json`
- RTL-first design — Arabic is the default locale
