# The Haven

Crisis relief platform connecting displaced people in Lebanon with available shelter, food, and supplies. Mobile-first, bilingual (Arabic RTL default + English).

**Not a provider.** This platform only facilitates connections between people who need help and people who can offer it. All interactions happen directly between users.

## Quick Start

```bash
git clone https://github.com/the-coll-org/lebanon-safe-haven.git
cd lebanon-safe-haven
npm install
cp .example.env .env.local        # fill in values (see docs/deployment.md)
docker compose up -d db           # start PostgreSQL
npx drizzle-kit push              # create tables
npm run db:seed                   # create admin accounts — save the printed passwords!
npm run dev                       # http://localhost:3000
```

## Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router), React 19 |
| UI | shadcn/ui + Tailwind CSS v4, RTL-native |
| i18n | next-intl (Arabic default, English) |
| DB | PostgreSQL + Drizzle ORM |
| Auth | Clerk (admin panel), edit tokens (listings) |
| News | Proxied from [LEB Monitor](https://lebmonitor.com), AI summary via Gemini |

## Project Structure

```
src/
├── app/
│   ├── [locale]/              # All pages (ar/en)
│   │   ├── page.tsx           # Landing
│   │   ├── listings/          # Browse + detail
│   │   ├── map/               # Map view
│   │   ├── offer/             # Submit listing + success
│   │   ├── news/              # Real-time news feed + AI overview
│   │   ├── hotlines/          # Emergency numbers
│   │   ├── resources/         # NGO links
│   │   ├── feedback/          # User feedback form
│   │   └── admin/             # Clerk login + dashboard
│   └── api/                   # REST endpoints
│       ├── listings/          # Public CRUD + flagging
│       ├── admin/             # Auth + admin operations
│       ├── news/              # Feed proxy + AI summary
│       └── webhooks/clerk/    # Clerk user sync
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   └── news/                  # News feed components
├── hooks/                     # Feed stream, prefs, layout, font size
├── db/                        # Schema, connection, seed, admin CLI
├── lib/                       # Auth, crypto, rate-limit, CSRF, constants
├── i18n/                      # Routing, request config, navigation
└── types/                     # Shared TypeScript types
messages/
├── ar.json                    # Arabic translations
└── en.json                    # English translations
```

## Scripts

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start built app
npm run lint         # ESLint
npm run db:push      # Push schema to PostgreSQL
npm run db:seed      # Seed admin accounts
npm run db:studio    # Drizzle Studio GUI
```

## Documentation

| Doc | Contents |
|-----|----------|
| [Deployment](docs/deployment.md) | Docker, environment variables, security, production setup |
| [API Reference](docs/api.md) | Database schema, REST endpoints, listing types |
| [Admin Guide](docs/admin-guide.md) | Dashboard usage, roles, permissions, troubleshooting |

## Changelog

### v0.4.0

- Clerk authentication for admin panel (replaces username/password)
- Real-time news feed proxied from LEB Monitor (categories, source filters, grid/list toggle, font size, source management)
- AI situation overview (Gemini 2.5 Flash Lite) with bilingual per-locale caching
- Rebranded from "Safe Haven" to "The Haven"

### v0.3.0

- 3-level address system: governorate → district → village (~1,108 villages from OCHA/HDX data)
- Searchable combobox for all address levels (bilingual Arabic/English search)
- Owner controls: mark listing unavailable, edit phone/capacity, delete — via edit token URL
- Community unavailability reporting with threshold-based warnings
- Post-creation WhatsApp deep link to save edit token

### v0.2.0

- Admin bulk listing management (create, bulk delete, unflag)
- Map integration (view + select location)
- Feedback system
- Dockerized deployment with auto-migration entrypoint
- AES-256-GCM phone encryption at rest

### v0.1.0

- Initial platform: listings, admin dashboard, flagging, i18n (AR/EN)
