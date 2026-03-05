# API Reference

## Database Schema

Six tables in PostgreSQL, managed by Drizzle ORM (`src/db/schema.ts`):

| Table | Key columns |
|-------|-------------|
| **listings** | id, phone (encrypted), region, district, village, category, area, capacity, description, status, edit_token, verified, flag_count, unavailable_count, lat/lng, timestamps |
| **municipalities** | id, name, email, region, role, username, password_hash (nullable), clerk_id, created_at |
| **flags** | id, listing_id (FK), reason, created_at |
| **feedback** | id, name, email, message, category, user_type, municipality_id, created_at |
| **unavailable_reports** | id, listing_id (FK), ip_hash, created_at |
| **admin_logs** | id, action, entity_type, entity_id, user_id, user_name, details, ip, ua, created_at |

Schema changes: edit `src/db/schema.ts`, then `npx drizzle-kit push`.

## REST Endpoints

### Public

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/listings` | List all (`?region=`, `?category=` filters) |
| `POST` | `/api/listings` | Create listing (returns `id` + `editToken`) |
| `GET` | `/api/listings/:id` | Single listing |
| `PATCH` | `/api/listings/:id` | Update (requires `editToken` header) |
| `DELETE` | `/api/listings/:id` | Remove (requires `editToken` header) |
| `POST` | `/api/listings/:id/flag` | Flag listing |
| `POST` | `/api/listings/:id/report-unavailable` | Report as unavailable |
| `POST` | `/api/feedback` | Submit feedback |
| `GET` | `/api/news` | NDJSON stream proxied from LEB Monitor |
| `GET` | `/api/news/summary?lang=en\|ar` | AI-generated news summary (cached 1hr per locale) |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/version` | Deployed version info |

### Admin (Clerk session required)

| Method | Route | Purpose |
|--------|-------|---------|
| `DELETE` | `/api/admin/auth` | Logout (logs event) |
| `GET` | `/api/admin/me` | Current admin info |
| `GET` | `/api/admin/listings` | List all (region-scoped for municipality) |
| `PATCH` | `/api/admin/listings/:id/verify` | Verify listing |
| `PATCH` | `/api/admin/listings/:id/phone` | Update phone |
| `PATCH` | `/api/admin/listings/:id` | Edit or unflag |
| `DELETE` | `/api/admin/listings/:id` | Delete listing |
| `DELETE` | `/api/admin/listings/bulk` | Bulk delete |
| `GET` | `/api/admin/logs` | Activity logs (superadmin) |
| `GET` | `/api/admin/feedback` | View feedback |

### Webhooks

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/webhooks/clerk` | Clerk user.created / user.updated / user.deleted sync |

Listings are anonymous — creators get a UUID `editToken` instead of an account.

## Listing Categories

| Category | Description |
|----------|-------------|
| `shelter` | Housing, rooms, beds (default) |
| `food` | Meals, groceries, water |
| `appliances` | Appliances, blankets, supplies |
| `clothing` | Clothes, shoes |

## Listing Statuses

| Status | Meaning |
|--------|---------|
| `available` | Resources available (default) |
| `limited` | Limited availability |
| `full` | Capacity reached |
| `unavailable` | No longer available |

## Administrative Divisions

Listings use 3-level Lebanese admin divisions: **Mohafaza** (governorate) → **Qada** (district) → **Village/Town** (~1,108 entries). Each level is searchable in both Arabic and English.

Data source: `src/lib/lebanon-divisions.ts`

## News Feed

The `/news` page proxies real-time NDJSON feeds from [LEB Monitor](https://lebmonitor.com). Features:

- Category filtering (war, breaking, general)
- Source chips with show/hide preferences (localStorage)
- Grid/list layout toggle
- Font size cycling (S/M/L/XL)
- Source management sheet
- AI situation overview: Gemini 2.5 Flash Lite generates 3-4 bullet summaries, cached 1 hour per locale (Arabic/English independently)
