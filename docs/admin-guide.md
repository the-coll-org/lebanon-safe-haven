# Admin Guide

## Overview

The Haven has two administrative roles:

| Role | Scope |
|------|-------|
| **Superadmin** | Full platform access, all regions |
| **Municipality** | Own region only |

Both roles can manage listings (shelter, food, appliances, clothing).

## Authentication

Admin login uses [Clerk](https://clerk.com). Two types of admin accounts:

- **Superadmins** — created via `npm run db:seed` (first deploy) or CLI. Full platform access, all regions.
- **Org admins** — added via `ADMIN_EMAILS` env var with a region. Scoped to their assigned region.

Non-authorized users who sign in via Clerk see an "Access Denied" message.

### First-Time Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Set environment variables (see [deployment docs](deployment.md))
3. Run `npm run db:seed` to create the initial superadmin (save the printed password — it's the superadmin's email for Clerk linking)
4. Add org admin emails to `ADMIN_EMAILS` in your `.env`: `ngo@org.lb:south_lebanon,vol@org.lb:beirut`
5. Configure a Clerk webhook pointing to `https://yourdomain.com/api/webhooks/clerk` with the `user.created`, `user.updated`, and `user.deleted` events
6. Navigate to `/admin/login` and sign in

When an authorized user signs in for the first time, they're automatically synced to the database via the webhook (or on first dashboard visit as a fallback).

### Linking Seeded Accounts

Superadmins created via `npm run db:seed` or `npx tsx src/db/add-admin.ts` need an `email` field in the database matching their Clerk email. When they sign in with the same email, their Clerk account is linked automatically.

## Dashboard

After signing in, you see three sections:

1. **Pending verification** — shelter listings awaiting approval
2. **Flagged listings** — listings reported by users
3. **All listings** — complete view (region-scoped for municipality admins)

### Verifying Listings

Only shelter listings require verification:

1. Review listing details in "Pending verification"
2. Click **Verify** to approve — a blue checkmark badge appears
3. Superadmin-created listings are auto-verified

### Managing Flags

When users report a listing:

1. It appears in "Flagged listings" with a red border
2. Review the listing and contact info
3. **Unflag** if the report was incorrect, or **Remove** to delete

### Editing Listings

Click **Edit** on any listing to update phone, capacity, status, area, or description. Municipality admins can only edit listings in their region.

### Bulk Operations

- **Select + Delete**: checkbox individual listings, then "Delete Selected"
- **Delete All** (superadmin only): removes all listings — use with caution

### CSV Import

1. Click **Import Listings**
2. Download the template
3. Fill in: `phone, region, capacity, category, area, description, latitude, longitude`
4. Upload — results show success/failure count

Valid regions: `beirut`, `mount_lebanon`, `south_lebanon`, `north_lebanon`, `nabatieh`, `bekaa`, `baalbek_hermel`, `akkar`

Valid categories: `shelter`, `food`, `appliances`, `clothing`

### Creating Admin Accounts (CLI)

For legacy password-based accounts (still functional for DB seeding):

```bash
npx tsx src/db/add-admin.ts <username> "<name>" <region>

# Examples:
npx tsx src/db/add-admin.ts admin "Platform Admin" beirut
npx tsx src/db/add-admin.ts tyre_admin "Tyre Municipality" south_lebanon
```

## Permissions Matrix

| Operation | Superadmin | Municipality |
|-----------|------------|--------------|
| View all regions | Yes | Own region only |
| Create listings | Any region | Own region only |
| Edit listings | Any | Own region only |
| Delete listings | Any | Own region only |
| Verify shelter | Yes | Own region only |
| Unflag listings | Yes | Own region only |
| Bulk delete all | Yes | No |
| CSV import | Any region | Own region only |
| View logs | Yes | No |
| View feedback | Yes | No |

## Troubleshooting

**Can't sign in**: Ensure your Clerk application is configured and your email is either in the database (superadmin) or in `ADMIN_EMAILS` env var.

**"Access Denied" after sign in**: Your email is not authorized. Superadmins must be seeded in the DB; org admins must be in `ADMIN_EMAILS`. Check server logs for `[auth]` messages.

**CSV import errors**: Use exact region codes (lowercase with underscores). Phone must be 8 digits. Capacity must be 1-10000.
