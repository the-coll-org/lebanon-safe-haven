# Admin Guide

## Overview

The Haven has two administrative roles:

| Role | Scope |
|------|-------|
| **Superadmin** | Full platform access, all regions |
| **Municipality** | Own region only |

Both roles can manage listings (shelter, food, appliances, clothing).

## Authentication

Admin login uses [Clerk](https://clerk.com). Only emails listed in the `ALLOWED_ADMIN_EMAILS` environment variable can access the dashboard.

### First-Time Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Set environment variables (see [deployment docs](deployment.md))
3. Add admin emails to `ALLOWED_ADMIN_EMAILS`
4. Configure a Clerk webhook pointing to `https://yourdomain.com/api/webhooks/clerk` with the `user.created`, `user.updated`, and `user.deleted` events
5. Navigate to `/admin/login` and sign in

When a whitelisted user signs in for the first time, they're automatically synced to the database via the webhook (or on first dashboard visit as a fallback).

### Legacy Password Accounts

Existing accounts created via `npm run db:seed` or `npx tsx src/db/add-admin.ts` remain in the database. To migrate them to Clerk, ensure their email is whitelisted — they'll be linked automatically when they sign in with the same email.

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

**Can't sign in**: Ensure your email is in `ALLOWED_ADMIN_EMAILS` and your Clerk application is configured.

**Signed in but redirected to login**: Your email may not be whitelisted, or the Clerk webhook hasn't synced your account yet. Check server logs.

**CSV import errors**: Use exact region codes (lowercase with underscores). Phone must be 8 digits. Capacity must be 1-10000.
