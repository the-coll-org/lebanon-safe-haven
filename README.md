# Safe Haven | ملاذ آمن

Crisis relief app connecting displaced people in Lebanon with shelter, food, and supplies. Mobile-first, bilingual (Arabic RTL default + English).

**Not a provider.** This platform only facilitates connections between people who need help and people who can offer it. All interactions happen directly between users.

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
│   │   ├── page.tsx          # Landing — "I need help" / "I can help"
│   │   ├── listings/         # Browse + detail view (filter by region + category)
│   │   ├── offer/            # Submit a listing (shelter/food/appliances) + success page
│   │   ├── hotlines/         # Government emergency numbers
│   │   ├── resources/        # NGO links (UNHCR, Red Cross, etc.)
│   │   └── admin/            # Login + dashboard (verify/flag/phone management)
│   └── api/                  # REST endpoints (see below)
├── components/               # Shared UI (listing-card, flag-button, category-filter, etc.)
├── db/                       # Schema, connection, seed, admin CLI
├── lib/                      # Auth, rate-limit, CSRF, constants
├── i18n/                     # Routing, request config, navigation
└── types/                    # Shared TypeScript types
```

## Listing Categories

Listings support three categories:

| Category | Description |
|----------|-------------|
| `shelter` | Housing / rooms / beds (default) |
| `food` | Meals, groceries, water |
| `appliances` | Appliances, blankets, supplies |

Users select a category when posting. Listings can be filtered by category and region.

## API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/listings` | — | List all (optional `?region=` + `?category=` filters) |
| `POST` | `/api/listings` | — | Create listing (returns `id` + `editToken`) |
| `GET` | `/api/listings/:id` | — | Single listing |
| `PATCH` | `/api/listings/:id` | editToken | Update status/description/capacity |
| `DELETE` | `/api/listings/:id` | editToken | Remove listing |
| `POST` | `/api/listings/:id/flag` | — | Flag listing (any user) |
| `POST` | `/api/admin/auth` | — | Login (returns session cookie) |
| `DELETE` | `/api/admin/auth` | session | Logout |
| `GET` | `/api/admin/me` | session | Current admin info (id, name, region, role) |
| `PATCH` | `/api/admin/listings/:id/verify` | session | Verify listing (region-restricted, superadmin: any) |
| `PATCH` | `/api/admin/listings/:id/phone` | session | Update listing phone (region-restricted, superadmin: any) |
| `DELETE` | `/api/admin/listings/:id` | session | Delete listing (superadmin: any, municipality: own region) |

## Database

Three tables in `sqlite.db`:

- **listings** — id, phone, region, category, area, capacity, description, status, edit_token, verified, verified_by, flag_count, timestamps
- **municipalities** — id, name, region, role, username, password_hash, created_at
- **flags** — id, listing_id, reason, created_at

After adding the `category` column, run `npx drizzle-kit push` to update the schema.

## Flagging

Any user can flag a listing from the listing card or detail page. Flags are stored in the `flags` table and increment `flag_count` on the listing. Municipality admins see flagged listings in their dashboard. Rate-limited to 10 flags/hour per IP.

## Admin Roles

| Role           | Scope           | Can delete?     |
|----------------|-----------------|-----------------|
| `superadmin`   | All regions     | Yes             |
| `municipality` | Own region only | Own region only |

Logged-in admins see a shield icon in the header linking to the dashboard.

## Municipality Dashboard

Each municipality admin sees **only listings in their own region**. Superadmins see all regions. Dashboard features:

- Search listings by phone, area, description, or category
- Verify listings (blue badge) — restricted to own region (superadmin: any)
- View flagged listings with flag counts
- Edit contact phone numbers on any listing (pencil icon)
- Delete listings (superadmin and municipality admins in their region)

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
| Region isolation | Admins can only verify/edit listings in their region |
| User enumeration | Constant-time response (dummy hash on unknown user) |
| Input validation | Phone regex, capacity bounds, category whitelist, text length limits (area: 200, desc: 1000, flag: 500) |
| SQL injection | Drizzle ORM parameterized queries throughout |

**Production checklist:**
- Set `SESSION_SECRET` env var (falls back to dev-only default)
- Run `npm run db:seed` once and store passwords securely
- Serve behind HTTPS (required for secure cookies)
- Set up Cloudflare for DDOS protection (see below)

## Cloudflare DDOS Protection (Free)

1. Create a free Cloudflare account at [cloudflare.com](https://cloudflare.com)
2. Add your domain — Cloudflare will scan DNS records
3. Update your domain's nameservers to the ones Cloudflare provides
4. In the Cloudflare dashboard:
   - **SSL/TLS** → Full (strict) — ensures HTTPS end-to-end
   - **Security** → Security Level → Medium (or "I'm Under Attack" during active DDOS)
   - **Speed** → Auto Minify → enable JS/CSS/HTML
   - **Caching** → Browser Cache TTL → Respect Existing Headers
5. Cloudflare's free tier includes:
   - Unlimited DDOS mitigation
   - WAF with managed rulesets
   - Bot management (basic)
   - CDN for static assets
   - SSL certificates

No code changes needed — Cloudflare proxies all traffic and filters attacks before they reach your server.

## Locale Note

Every server component page calls `setRequestLocale(locale)` before `getTranslations()` — required due to a Next.js 16 issue where the middleware locale header doesn't propagate. See `src/app/[locale]/layout.tsx`.

## Government Hotlines

Hardcoded in `src/lib/constants.ts` from official Lebanese government data. Eight governorates with tap-to-call numbers on landing page and `/hotlines`.
