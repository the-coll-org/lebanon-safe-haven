# Safe Haven | ملاذ آمن

Crisis relief app connecting displaced people in Lebanon with available shelter. Mobile-first, bilingual (Arabic RTL default + English).

**Not a shelter provider.** This platform only facilitates connections between people who need space and people who have it. All interactions happen directly between users.

## Quick Start

```bash
npm install
npx drizzle-kit push        # Create SQLite tables
npm run db:seed              # Create admin accounts (prints passwords — save them!)
npm run dev                  # http://localhost:3000
```

## Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind v4, RTL-native |
| i18n | next-intl (Arabic default, English) |
| DB | SQLite via Drizzle ORM + better-sqlite3 |
| Auth | bcrypt + HMAC-signed session cookies |

## Project Structure

```
src/
├── app/
│   ├── [locale]/             # All pages (ar/en)
│   │   ├── page.tsx          # Landing — "I need shelter" / "I have space"
│   │   ├── listings/         # Browse + detail view
│   │   ├── offer/            # Submit a space + success page
│   │   ├── hotlines/         # Government emergency numbers
│   │   ├── resources/        # NGO links (UNHCR, Red Cross, etc.)
│   │   └── admin/            # Login + dashboard (verify/flag management)
│   └── api/                  # REST endpoints (see below)
├── components/               # Shared UI (listing-card, hotline-card, etc.)
├── db/                       # Schema, connection, seed, admin CLI
├── lib/                      # Auth, rate-limit, CSRF, constants
├── i18n/                     # Routing, request config, navigation
└── types/                    # Shared TypeScript types
```

## API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/listings` | — | List all (optional `?region=` filter) |
| `POST` | `/api/listings` | — | Create listing (returns `id` + `editToken`) |
| `GET` | `/api/listings/:id` | — | Single listing |
| `PATCH` | `/api/listings/:id` | editToken | Update status/description/capacity |
| `DELETE` | `/api/listings/:id` | editToken | Remove listing |
| `POST` | `/api/listings/:id/flag` | — | Flag listing |
| `POST` | `/api/admin/auth` | — | Login (returns session cookie) |
| `DELETE` | `/api/admin/auth` | session | Logout |
| `PATCH` | `/api/admin/listings/:id/verify` | session | Verify listing (blue badge) |

## Database

Three tables in `sqlite.db`:

- **listings** — id, phone, region, area, capacity, description, status, edit_token, verified, verified_by, flag_count, timestamps
- **municipalities** — id, name, region, username, password_hash, created_at
- **flags** — id, listing_id, reason, created_at

## PII

Only stored PII is **phone numbers** in the listings table. No user accounts, no emails, no names, no tracking. Listings are anonymous — hosts get a UUID edit token instead of an account.

## Admin Accounts

### Seed (first-time setup)

```bash
npm run db:seed
```

Prints all usernames + randomly generated passwords to stdout. **Save them immediately** — they're bcrypt-hashed and cannot be recovered.

Creates:
- 1 super-admin (`admin`)
- 8 municipality accounts (one per governorate)

### Add accounts later

```bash
npx tsx src/db/add-admin.ts <username> <name> <region>

# Examples:
npx tsx src/db/add-admin.ts admin "Platform Admin" beirut
npx tsx src/db/add-admin.ts tyre_admin "بلدية صور" south_lebanon
```

Valid regions: `beirut`, `mount_lebanon`, `south_lebanon`, `nabatieh`, `bekaa`, `baalbek_hermel`, `akkar`, `north_lebanon`

## Security

| Measure | Detail |
|---------|--------|
| Session tokens | HMAC-SHA256 signed, timing-safe comparison |
| Passwords | bcrypt (cost 10), random-generated in seed |
| Login brute-force | 5 attempts / 15 min per IP |
| Listing spam | 10 creates / hour per IP |
| Flag abuse | 10 flags / hour per IP |
| CSRF | Origin header validation on all POST/PATCH/DELETE |
| Cookies | httpOnly, secure (prod), sameSite=strict, 24h expiry |
| Dashboard | Server-side auth guard redirects to login |
| User enumeration | Constant-time response (dummy hash on unknown user) |
| Input validation | Phone regex, capacity bounds, text length limits (area: 200, desc: 1000, flag: 500) |
| SQL injection | Drizzle ORM parameterized queries throughout |

**Production checklist:**
- Set `SESSION_SECRET` env var (falls back to dev-only default)
- Run `npm run db:seed` once and store passwords securely
- Serve behind HTTPS (required for secure cookies)

## Locale Note

Every server component page calls `setRequestLocale(locale)` before `getTranslations()` — required due to a Next.js 16 issue where the middleware locale header doesn't propagate. See `src/app/[locale]/layout.tsx`.

## Government Hotlines

Hardcoded in `src/lib/constants.ts` from official Lebanese government data. Eight governorates with tap-to-call numbers on landing page and `/hotlines`.
