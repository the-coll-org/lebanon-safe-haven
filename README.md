# Safe Haven | ملاذ آمن

Crisis relief app connecting displaced people in Lebanon with shelter, food, and supplies. Mobile-first, bilingual (Arabic RTL default + English).

**Not a provider.** This platform only facilitates connections between people who need help and people who can offer it. All interactions happen directly between users.

## Quick Start

```bash
git clone https://github.com/the-coll-org/lebanon-safe-haven.git
cd lebanon-safe-haven
npm install
cp .example.env .env.local        # then fill in real values (see below)
docker compose up -d db           # start PostgreSQL
npx drizzle-kit push              # create PostgreSQL tables
npm run db:seed                   # create admin accounts — save the printed passwords!
npm run dev                       # http://localhost:3000
```

## Environment Variables

Copy `.example.env` to `.env.local` (dev) or `.env` (Docker). Two required secrets:

| Variable | Purpose |
|----------|---------|
| `SESSION_SECRET` | HMAC-SHA256 signing key for session cookies (min 32 chars) |
| `ENCRYPTION_KEY` | 64 hex chars (32 bytes) for AES-256-GCM phone encryption |

Generate both with:

```bash
openssl rand -hex 32
```

For local dev, any placeholder values work. In production, generate real keys and never commit `.env`.

## Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind v4, RTL-native |
| i18n | next-intl (Arabic default, English) |
| DB | PostgreSQL via Drizzle ORM + node-postgres |
| Auth | bcrypt + HMAC-signed session cookies |

## Project Structure

```
src/
├── app/
│   ├── [locale]/             # All pages (ar/en)
│   │   ├── page.tsx          # Landing — "I need help" / "I can help"
│   │   ├── listings/         # Browse + detail view (filter by region + category)
│   │   ├── map/              # Map view of all listings
│   │   ├── offer/            # Submit a listing + success page
│   │   ├── hotlines/         # Government emergency numbers
│   │   ├── resources/        # NGO links (UNHCR, Red Cross, etc.)
│   │   ├── feedback/         # User feedback form
│   │   └── admin/            # Login + dashboard
│   └── api/                  # REST endpoints
├── components/               # Shared UI components
├── db/                       # Schema, connection, seed, admin CLI
├── lib/                      # Auth, rate-limit, CSRF, constants
├── i18n/                     # Routing, request config, navigation
└── types/                    # Shared TypeScript types
messages/
├── ar.json                   # Arabic translations
└── en.json                   # English translations
```

## Scripts

```bash
npm run dev          # Hot-reload dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start built app
npm run lint         # ESLint
npm run db:push      # Push schema to PostgreSQL (idempotent, safe to re-run)
npm run db:seed      # Seed admin accounts (prints credentials once)
npm run db:studio    # Drizzle Studio GUI at http://local.drizzle.studio
```

## Database

Three tables in PostgreSQL, managed by Drizzle ORM:

- **listings** — id, phone (encrypted), region, district, village, category, area, capacity, description, status, edit_token, verified, verified_by, flag_count, unavailable_count, latitude, longitude, timestamps
- **municipalities** — id, name, region, role, username, password_hash, created_at
- **flags** — id, listing_id, reason, created_at
- **unavailable_reports** — id, listing_id, ip_hash, created_at

Schema changes: edit `src/db/schema.ts`, then run `npx drizzle-kit push`.

## API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/listings` | — | List all (`?region=` + `?category=` filters) |
| `POST` | `/api/listings` | — | Create listing (returns `id` + `editToken`) |
| `GET` | `/api/listings/:id` | — | Single listing |
| `PATCH` | `/api/listings/:id` | editToken | Update status/description/capacity/phone |
| `DELETE` | `/api/listings/:id` | editToken | Remove listing |
| `POST` | `/api/listings/:id/flag` | — | Flag listing |
| `POST` | `/api/listings/:id/report-unavailable` | — | Report listing as unavailable |
| `POST` | `/api/admin/auth` | — | Login (returns session cookie) |
| `DELETE` | `/api/admin/auth` | session | Logout |
| `GET` | `/api/admin/me` | session | Current admin info |
| `PATCH` | `/api/admin/listings/:id/verify` | session | Verify listing (region-scoped) |
| `PATCH` | `/api/admin/listings/:id/phone` | session | Update phone (region-scoped) |
| `DELETE` | `/api/admin/listings/:id` | session | Delete listing (region-scoped) |

Listings are anonymous — creators get a UUID `editToken` instead of an account. No login required to post.

## Admin System

### Roles

| Role | Scope | Can delete? |
|------|-------|-------------|
| `superadmin` | All regions | Yes |
| `municipality` | Own region only | Own region only |

### Access

- URL: `/ar/admin` or `/en/admin`
- Credentials: printed once by `npm run db:seed` (local) or in Docker logs (`docker compose logs app`)
- Dashboard: verify listings, manage flags, edit phone numbers, delete listings

### Adding admins

```bash
npx tsx src/db/add-admin.ts <username> <name> <region>

# Examples:
npx tsx src/db/add-admin.ts admin "Platform Admin" beirut
npx tsx src/db/add-admin.ts tyre_admin "Tyre Municipality" south_lebanon
```

Valid regions: `beirut` `mount_lebanon` `south_lebanon` `nabatieh` `bekaa` `baalbek_hermel` `akkar` `north_lebanon`

## Administrative Divisions

Listings use 3-level Lebanese admin divisions: **Mohafaza** (governorate) → **Qada** (district) → **Village/Town** (~1,108 entries). Each level is searchable in both Arabic and English. The "area" field remains free-text for neighborhoods.

Data: `src/lib/lebanon-divisions.ts` — self-contained module with all data + lookup functions, designed for potential future extraction as a standalone npm package.

## Listing Statuses

| Status | Meaning |
|--------|---------|
| `available` | Resources available (default) |
| `limited` | Limited availability |
| `full` | Capacity reached |
| `unavailable` | No longer available (withdrawn by owner or marked) |

## Listing Categories

| Category | Description |
|----------|-------------|
| `shelter` | Housing, rooms, beds (default) |
| `food` | Meals, groceries, water |
| `appliances` | Appliances, blankets, supplies |
| `clothing` | Clothes, shoes |

## Security

| Measure | Detail |
|---------|--------|
| Session tokens | HMAC-SHA256 signed, timing-safe comparison |
| Passwords | bcrypt (cost 10), random-generated in seed |
| Phone encryption | AES-256-GCM at rest |
| Login brute-force | 5 attempts / 15 min per IP |
| Listing spam | 10 creates / hour per IP |
| Flag abuse | 10 flags / hour per IP |
| Unavailable reports | 1 per listing per IP per 24h, hashed IPs |
| CSRF | Origin header validation on all POST/PATCH/DELETE |
| Cookies | httpOnly, secure (prod), sameSite=strict, 24h expiry |
| Region isolation | Municipality admins scoped to their own region |
| User enumeration | Constant-time response (dummy hash on unknown user) |
| Input validation | Phone regex, capacity bounds, category whitelist, text length limits |
| SQL injection | Drizzle ORM parameterised queries throughout |

Only stored PII is **phone numbers**, encrypted at rest. No user accounts, emails, names, or tracking.

## Docker

Production deployment uses Docker + Nginx reverse proxy. The `docker-entrypoint.sh` handles schema migration and first-boot seeding automatically.

```bash
cp .example.env .env              # fill in real SESSION_SECRET and ENCRYPTION_KEY
docker compose up -d --build
docker compose logs app           # retrieve first-run admin credentials
```

The PostgreSQL database lives in a Docker named volume (`postgres-data`). Back it up with:

```bash
# Create backup
docker compose exec db pg_dump -U safehaven safehaven > backup.sql

# Restore from backup
docker compose exec -T db psql -U safehaven safehaven < backup.sql
```

## Locale Note

Every server component page calls `setRequestLocale(locale)` before `getTranslations()` — required due to a Next.js 16 issue where the middleware locale header doesn't propagate. See `src/app/[locale]/layout.tsx`.

## Changelog

### v0.3.0

- 3-level address system: governorate → district → village (~1,108 villages from OCHA/HDX data)
- Searchable combobox for all address levels (bilingual Arabic/English search)
- Village displayed on listing cards, detail pages, and included in search
- Village validation on all API routes (public + admin + CSV import)
- Post-creation confirmation dialog with WhatsApp deep link to save edit token
- Owner controls: mark listing unavailable, edit phone/capacity, delete — via edit token URL
- Community unavailability reporting: threshold-based warning (3 reports), rate limited, auto-expires
- 8-digit Lebanese phone validation (client + server)
- Disabled Call/WhatsApp buttons when listing is unavailable
- Always-visible text on mobile for flag and report buttons
- New listing status: `unavailable` (distinct from `full`)

### v0.2.0

- Admin bulk listing management (create, bulk delete, unflag)
- Map integration (view all listings on map, select location when posting)
- Feedback system for user submissions
- Dockerized production deployment with auto-migration entrypoint
- AES-256-GCM phone number encryption at rest
- Search now matches region names (translated)

### v0.1.0

- Initial platform: listings, admin dashboard, flagging, i18n (AR/EN)
