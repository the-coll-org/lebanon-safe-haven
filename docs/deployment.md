# Deployment

## Environment Variables

Copy `.example.env` to `.env.local` (dev) or `.env` (Docker).

### Required

| Variable | Purpose |
|----------|---------|
| `SESSION_SECRET` | HMAC-SHA256 signing key (min 32 chars). Generate: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | 64 hex chars (32 bytes) for AES-256-GCM phone encryption. Generate: `openssl rand -hex 32` |

### Clerk Authentication

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (starts with `pk_`) |
| `CLERK_SECRET_KEY` | Clerk secret key (starts with `sk_`) |
| `CLERK_WEBHOOK_SECRET` | Svix webhook signing secret (starts with `whsec_`) |
| `ADMIN_EMAILS` | Region-scoped admin emails. Format: `email:region,email:region` (e.g. `ngo@org.lb:south_lebanon`) |

### Optional

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI news summary |
| `DB_USER` | PostgreSQL user (default: `safehaven`) |
| `DB_PASSWORD` | PostgreSQL password (default: `safehaven`) |
| `DB_NAME` | PostgreSQL database name (default: `safehaven`) |
| `DB_PORT` | PostgreSQL port (default: `5432`) |

## Docker (Production)

The app runs behind an Nginx reverse proxy. `docker-entrypoint.sh` handles schema migration and first-boot seeding automatically.

```bash
cp .example.env .env              # fill in all values
docker compose up -d --build
docker compose logs app           # retrieve first-run admin credentials
```

The compose file binds to `127.0.0.1:3000` — configure Nginx to proxy to it.

### Backups

PostgreSQL data lives in a Docker named volume (`postgres-data`).

```bash
# Create backup
docker compose exec db pg_dump -U safehaven safehaven > backup.sql

# Restore from backup
docker compose exec -T db psql -U safehaven safehaven < backup.sql
```

### SSL

```bash
./setup-ssl.sh    # runs certbot for safehaven.thecoll.org
```

## Security

| Measure | Detail |
|---------|--------|
| Admin auth | Clerk (OAuth/email). Superadmins via DB seed; org admins via `ADMIN_EMAILS` env var |
| Phone encryption | AES-256-GCM at rest (app refuses to start without key in production) |
| Login brute-force | Clerk handles rate limiting |
| Listing spam | 10 creates / hour per IP |
| Flag abuse | 10 flags / hour per IP |
| Unavailable reports | 1 per listing per IP per 24h, hashed IPs |
| CSRF | Origin header validation on all mutations |
| Region isolation | Municipality admins scoped to their own region |
| Input validation | Phone regex, capacity bounds, category whitelist, text length limits |
| SQL injection | Drizzle ORM parameterised queries throughout |

Only stored PII is **phone numbers**, encrypted at rest. No user accounts, emails, names, or tracking for public users.

## Locale Note

Every server component page calls `setRequestLocale(locale)` before `getTranslations()` — required due to a Next.js 16 issue where the middleware locale header doesn't propagate. See `src/app/[locale]/layout.tsx`.
