# Safe Haven | ملاذ آمن

Crisis relief app connecting displaced people in Lebanon with shelter, food, and supplies. Mobile-first, bilingual (Arabic RTL default + English).

**Not a provider.** This platform only facilitates connections between people who need help and people who can offer it. All interactions happen directly between users.

---

## Table of Contents

1. [Run Locally (development)](#1-run-locally-development)
2. [Run on a Makeshift Dev Server (Node.js, no Docker)](#2-run-on-a-makeshift-dev-server-nodejs-no-docker)
3. [Deploy on a Production-Ready Server (Docker + Nginx)](#3-deploy-on-a-production-ready-server-docker--nginx)
4. [Environment Variable Reference](#environment-variable-reference)
5. [Project Reference](#project-reference)

---

## Prerequisites

| Requirement | Minimum version | Notes |
|-------------|----------------|-------|
| Node.js     | 20.x            | Required for all three setups |
| npm         | 10.x            | Bundled with Node.js 20 |
| Git         | any recent      | |
| Docker Engine + Compose | 24+ / v2 | Docker-based setups only |

---

## 1. Run Locally (development)

Use this when developing features. The dev server provides hot-reload, source maps, and verbose error overlays.

### Step 1 — Clone and install dependencies

```bash
git clone https://github.com/the-coll-org/lebanon-safe-haven.git
cd lebanon-safe-haven
npm install
```

### Step 2 — Set environment variables

Create `.env.local` in the project root:

```env
# .env.local

# HMAC key for session cookies — any random string is fine locally
SESSION_SECRET=local-dev-secret-change-in-production

# 64 hex chars = 32 bytes for AES-256-GCM phone encryption
# The zeroed key below is safe for local dev only — never use it with real data
ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000
```

To generate real values when needed:

```bash
# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3 — Initialise the database

```bash
npm run db:push   # Creates sqlite.db and applies the schema (idempotent — safe to re-run)
npm run db:seed   # Creates admin accounts and prints credentials to stdout
```

> **Important:** `db:seed` prints credentials only once. Save them before the terminal session ends.

### Step 4 — Start the dev server

```bash
npm run dev
```

- App: `http://localhost:3000`
- Default locale redirects to Arabic: `http://localhost:3000/ar`
- English: `http://localhost:3000/en`
- Admin panel: `http://localhost:3000/ar/admin`

### Other dev commands

```bash
npm run lint        # ESLint (TypeScript + Next.js rules)
npm run db:studio   # Drizzle Studio GUI at http://local.drizzle.studio
```

---

## 2. Run on a Makeshift Dev Server (Node.js, no Docker)

Use this when you need the production build running on a remote machine — a shared VPS, a CI preview environment, or a short-lived staging box — without setting up Docker or a full reverse proxy.

> **Caution:** This mode exposes the app directly on a port. Use it behind a firewall or VPN only, or with an SSH tunnel. It is not hardened for public traffic.

### Step 1 — Provision the server

On the remote machine:

```bash
# Install Node.js 20 via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Verify
node -v   # should print v20.x.x
```

### Step 2 — Clone, install, and build

```bash
git clone https://github.com/the-coll-org/lebanon-safe-haven.git
cd lebanon-safe-haven
npm install
npm run build
```

### Step 3 — Set environment variables

```bash
# Create .env.local or export in your shell / process manager config
cat > .env.local <<'EOF'
SESSION_SECRET=<min-32-char-random-string>
ENCRYPTION_KEY=<64-hex-chars>
NODE_ENV=production
EOF
```

Generate values:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"  # SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"     # ENCRYPTION_KEY
```

### Step 4 — Initialise the database

```bash
npm run db:push   # Apply schema (idempotent)
npm run db:seed   # Seed admin accounts — save the printed credentials
```

### Step 5 — Start the production server

```bash
npm run start
# Listens on http://0.0.0.0:3000
```

To persist across SSH disconnects and reboots, use pm2:

```bash
npm install -g pm2
pm2 start "npm run start" --name safe-haven
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

Verify it is running:

```bash
pm2 status
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ar
# Expected: 200
```

### Step 6 — (Optional) SSH tunnel for local access

If the server is behind a firewall and you just need to access it from your machine:

```bash
# On your local machine
ssh -L 3000:localhost:3000 user@server-ip
# Then open http://localhost:3000 in your browser
```

### Updating the server

```bash
cd lebanon-safe-haven
git pull origin main
npm install
npm run build
pm2 restart safe-haven
```

---

## 3. Deploy on a Production-Ready Server (Docker + Nginx)

Use this for any publicly accessible or long-lived deployment.

```
Internet ──▶ Nginx (443/TLS, reverse proxy) ──▶ Docker (Next.js :3000) ──▶ SQLite volume
```

### Step 1 — Server prerequisites

Recommended OS: Ubuntu 22.04 LTS. Also requires:
- Docker Engine + Docker Compose v2
- Nginx
- A domain name with an A record pointing to the server's IP
- Certbot (Let's Encrypt) for TLS

Install Docker if not already present:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for the group change to take effect
docker --version  # verify
```

### Step 2 — Clone the repository

```bash
git clone https://github.com/the-coll-org/lebanon-safe-haven.git
cd lebanon-safe-haven
```

### Step 3 — Create the environment file

```bash
touch .env
```

Edit `.env` (read by Docker Compose via the `${VAR}` references in `docker-compose.yml`):

```env
SESSION_SECRET=<min-32-char-random-string>
ENCRYPTION_KEY=<64-hex-chars>
```

Generate values:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"  # SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"     # ENCRYPTION_KEY
```

> **Never commit `.env` to version control.**

### Step 4 — Build and start the container

```bash
docker compose up -d --build
```

The `docker-entrypoint.sh` runs automatically on every start and does the following:

1. Creates `/data` if it doesn't exist.
2. Symlinks `/app/sqlite.db` → `/data/sqlite.db` (backed by the `db-data` Docker volume).
3. Runs `drizzle-kit push` to apply/update the schema (idempotent).
4. Runs `db:seed` **only on first boot** (when no database file exists yet) — admin credentials are printed to container logs.

Retrieve first-run credentials:

```bash
docker compose logs app | grep -A 20 "Seeding database"
```

Verify the container reaches healthy status (~90 seconds after first start):

```bash
docker compose ps          # STATUS column should show "healthy"
docker compose logs -f app # tail live logs
```

### Step 5 — Configure Nginx and TLS

Install Nginx and Certbot:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Obtain a TLS certificate (replace `yourdomain.com` throughout):

```bash
sudo certbot --nginx -d yourdomain.com
```

Create `/etc/nginx/sites-available/safe-haven`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/safe-haven /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

The app is now live at `https://yourdomain.com`.

### Step 6 — Updating the deployment

```bash
git pull origin main
docker compose up -d --build
```

The entrypoint re-runs `drizzle-kit push` on every boot, so schema changes are applied automatically. The seed step is skipped on all subsequent starts.

### Step 7 — Backups

The SQLite database is stored in a Docker named volume (`db-data`). Back it up with:

```bash
docker run --rm \
  -v lebanon-safe-haven_db-data:/data \
  -v $(pwd):/backup \
  alpine \
  cp /data/sqlite.db /backup/sqlite-$(date +%Y%m%d-%H%M%S).db
```

Schedule this via cron for automated backups:

```bash
# Example: daily backup at 02:00
crontab -e
# Add:
# 0 2 * * * cd /path/to/lebanon-safe-haven && docker run --rm -v lebanon-safe-haven_db-data:/data -v $(pwd):/backup alpine cp /data/sqlite.db /backup/sqlite-$(date +\%Y\%m\%d-\%H\%M\%S).db
```

### Optional — Cloudflare DDoS Protection (free tier)

1. Create a free account at [cloudflare.com](https://cloudflare.com) and add your domain.
2. Update your domain's nameservers to those Cloudflare provides.
3. In the Cloudflare dashboard:
   - **SSL/TLS** → Full (strict)
   - **Security** → Security Level → Medium (or "I'm Under Attack" during active DDoS)
   - **Speed** → Auto Minify → enable JS/CSS/HTML
4. No code changes needed — Cloudflare proxies all traffic and provides unlimited DDoS mitigation, WAF, CDN, and bot management on the free tier.

---

## Environment Variable Reference

| Variable         | Required in production | Description |
|------------------|------------------------|-------------|
| `SESSION_SECRET` | Yes | HMAC-SHA256 signing key for session cookies. Min 32 chars. Falls back to a dev-only default when unset — **never rely on the default in production**. |
| `ENCRYPTION_KEY` | Yes | 64 hex chars (32 bytes) for AES-256-GCM phone number encryption. |
| `NODE_ENV`       | Yes (set by Docker) | Must be `production` in deployed environments. |

---

## Project Reference

### Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind v4, RTL-native |
| i18n | next-intl (Arabic default, English) |
| DB | SQLite via Drizzle ORM + better-sqlite3 |
| Auth | bcrypt + HMAC-signed session cookies |

### Scripts

```bash
npm run dev          # Hot-reload dev server (localhost:3000)
npm run build        # Production build (outputs to .next/)
npm run start        # Start built app (requires npm run build first)
npm run lint         # ESLint
npm run db:push      # Push schema to SQLite — idempotent, safe to re-run
npm run db:seed      # Seed initial admin accounts (prints credentials once)
npm run db:studio    # Drizzle Studio GUI
```

### Project Structure

```
src/
├── app/
│   ├── [locale]/             # All pages (ar/en)
│   │   ├── page.tsx          # Landing — "I need help" / "I can help"
│   │   ├── listings/         # Browse + detail view (filter by region + category)
│   │   ├── offer/            # Submit a listing + success page
│   │   ├── hotlines/         # Government emergency numbers
│   │   ├── resources/        # NGO links (UNHCR, Red Cross, etc.)
│   │   └── admin/            # Login + dashboard (verify/flag/phone management)
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

### API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/api/listings` | — | List all (`?region=` + `?category=` filters) |
| `POST` | `/api/listings` | — | Create listing (returns `id` + `editToken`) |
| `GET` | `/api/listings/:id` | — | Single listing |
| `PATCH` | `/api/listings/:id` | editToken | Update status/description/capacity |
| `DELETE` | `/api/listings/:id` | editToken | Remove listing |
| `POST` | `/api/listings/:id/flag` | — | Flag listing |
| `POST` | `/api/admin/auth` | — | Login (returns session cookie) |
| `DELETE` | `/api/admin/auth` | session | Logout |
| `GET` | `/api/admin/me` | session | Current admin info |
| `PATCH` | `/api/admin/listings/:id/verify` | session | Verify listing (region-scoped) |
| `PATCH` | `/api/admin/listings/:id/phone` | session | Update phone (region-scoped) |
| `DELETE` | `/api/admin/listings/:id` | session | Delete listing (region-scoped) |

### Database Schema

Three tables in `sqlite.db`:

- **listings** — id, phone (AES-256-GCM encrypted), region, category, area, capacity, description, status, edit_token, verified, verified_by, flag_count, timestamps
- **municipalities** — id, name, region, role (`superadmin` | `municipality`), username, password_hash, created_at
- **flags** — id, listing_id, reason, created_at

### Admin Roles

| Role | Scope | Can delete? |
|------|-------|-------------|
| `superadmin` | All regions | Yes |
| `municipality` | Own region only | Own region only |

### Admin Access

- URL: `/ar/admin` or `/en/admin`
- Credentials: printed by `db:seed` (local) or found in Docker logs (`docker compose logs app`)
- Add more admins: `npx tsx src/db/add-admin.ts <username> <name> <region>`
- Valid regions: `beirut` · `mount_lebanon` · `south_lebanon` · `nabatieh` · `bekaa` · `baalbek_hermel` · `akkar` · `north_lebanon`

### Security Measures

| Measure | Detail |
|---------|--------|
| Session tokens | HMAC-SHA256 signed, timing-safe comparison |
| Passwords | bcrypt (cost 10), random-generated in seed |
| Login brute-force | 5 attempts / 15 min per IP |
| Listing spam | 10 creates / hour per IP |
| Flag abuse | 10 flags / hour per IP |
| CSRF | Origin header validation on all POST/PATCH/DELETE |
| Cookies | httpOnly, secure (prod), sameSite=strict, 24h expiry |
| Region isolation | Admins can only verify/edit listings in their own region |
| User enumeration | Constant-time response (dummy hash on unknown user) |
| Input validation | Phone regex, capacity bounds, category whitelist, text length limits |
| SQL injection | Drizzle ORM parameterised queries throughout |

### PII

Only stored PII is **phone numbers**, AES-256-GCM encrypted in the listings table. No user accounts, emails, names, or tracking. Listing creators receive a UUID edit token instead of an account.
