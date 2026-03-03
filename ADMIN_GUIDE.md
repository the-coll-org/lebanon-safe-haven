# Admin Guide - Safe Haven Platform

This guide covers how to use the Safe Haven platform as an administrator.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Superadmin Guide](#superadmin-guide)
- [Municipality Guide](#municipality-guide)
- [Common Operations](#common-operations)
- [Permissions Matrix](#permissions-matrix)

## Overview

The Safe Haven platform has two administrative roles:

1. **Superadmin** - Platform-wide administrator with full access
2. **Municipality** - Regional administrator with restricted access to their assigned region

Both roles can manage listings (shelter, food, appliances, clothing) in the system.

## Getting Started

### First-Time Setup

1. **Initialize the database**:
   ```bash
   npm run db:push
   ```

2. **Seed initial admin accounts**:
   ```bash
   npm run db:seed
   ```
   
   This creates:
   - A superadmin account (username: `admin`)
   - Municipality accounts for each Lebanese region
   
   **⚠️ IMPORTANT**: Save the generated passwords immediately - they cannot be recovered!

3. **Access the admin login**:
   - Navigate to `/admin/login`
   - Use your assigned username and password

### Creating Additional Admin Accounts

To create a new municipality admin:

```bash
npx tsx src/db/add-admin.ts <username> "<name>" <region>
```

**Example**:
```bash
npx tsx src/db/add-admin.ts tyre_admin "بلدية صور" south_lebanon
```

**Valid regions**:
- `beirut`
- `mount_lebanon`
- `south_lebanon`
- `north_lebanon`
- `nabatieh`
- `bekaa`
- `baalbek_hermel`
- `akkar`

## Superadmin Guide

As a superadmin, you have full platform access.

### Dashboard Overview

After logging in, you'll see:
- **Pending verification** - Shelter listings awaiting your verification
- **Flagged listings** - Listings reported by users as problematic
- **All Listings** - Complete view of all listings across all regions

### Creating New Listings

1. Click **"Create New Listing"** button
2. Fill in the details:
   - **Phone**: Contact number
   - **Region**: Select from dropdown
   - **Category**: Shelter, Food, Appliances, or Clothing
   - **Capacity**: Number of people/items
   - **Area**: Specific neighborhood (optional)
   - **Description**: Additional details (optional)
3. Click **Save**

**Note**: Superadmin listings are automatically verified.

### Verifying Shelter Listings

Only shelter listings require verification:

1. Go to **"Pending verification"** section
2. Review the listing details
3. Click **"Verify"** to approve
4. Verified listings display a blue checkmark badge

### Managing Municipality Accounts

Use the CLI tool to add new municipality admins:

```bash
npx tsx src/db/add-admin.ts <username> "<name>" <region>
```

### Bulk Operations

**Delete selected listings**:
1. Use checkboxes to select listings
2. Click **"Delete Selected"**
3. Confirm the action

**Delete all listings** (Superadmin only):
1. Click **"Delete All"** button
2. Confirm the warning prompt
3. **⚠️ This permanently deletes ALL listings - use with extreme caution!**

### Importing Listings via CSV

1. Click **"Import Listings"** button
2. Download the template by clicking **"Download CSV Template"**
3. Fill in your data following the template format:
   - phone (required)
   - region (required) - must be a valid region code
   - capacity (required) - number between 1-10000
   - category (optional) - defaults to "shelter"
   - area (optional)
   - description (optional)
   - latitude (optional)
   - longitude (optional)
4. Click **"Upload CSV File"**
5. Review import results

**CSV Format Example**:
```csv
phone,region,capacity,category,area,description
03-123456,beirut,5,shelter,Ashrafieh,2 rooms available
03-789012,south_lebanon,50,food,Tyre,Hot meals daily
```

**Valid region values**:
- `beirut`, `mount_lebanon`, `south_lebanon`, `north_lebanon`
- `nabatieh`, `bekaa`, `baalbek_hermel`, `akkar`

**Valid categories**:
- `shelter`, `food`, `appliances`, `clothing`

## Municipality Guide

As a municipality admin, you manage listings for your assigned region only.

### Dashboard Overview

After logging in, you'll see listings filtered to your region:
- **Pending verification** - Unverified shelter listings in your region
- **Flagged listings** - Problematic listings reported by users
- **All Listings** - All listings in your region

### Creating Regional Listings

1. Click **"Create New Listing"** button
2. Fill in the details (region is pre-selected to your assigned region)
3. Click **Save**

**Note**: You can only create listings in your assigned region.

### Verifying Shelter Listings

1. Review listings in **"Pending verification"** section
2. Click **"Verify"** on legitimate shelter listings
3. Verified listings show a blue checkmark badge

### Managing Flagged Listings

When users report a listing:
1. It appears in **"Flagged listings"** section
2. Review the listing and contact information
3. Either:
   - Click **"Unflag"** if the report was incorrect
   - Click **"Remove"** to delete the listing

### Editing Listings

1. Click **"Edit"** on any listing
2. Update the information
3. Click **"Save Changes"**

**Note**: You can only edit listings in your assigned region.

### Importing Listings

Same process as superadmin, but:
- All imported listings are assigned to your region
- You cannot import listings for other regions
- Superadmin listings in the import file will be assigned to your region

## Common Operations

### Logging In

1. Navigate to `/admin/login`
2. Enter your username and password
3. Click **"Sign In"**

**Session duration**: 24 hours

### Logging Out

Click **"Sign Out"** button in the top-right corner of the dashboard.

### Searching Listings

Use the search bar to filter by:
- Phone number
- Area/neighborhood
- Description text
- Category

### Handling Flagged Content

When a listing is flagged:
1. Review the listing details
2. Contact the phone number if needed to verify information
3. Take appropriate action:
   - **Unflag**: If the listing is legitimate
   - **Remove**: If the listing contains false information

### Session Expired

If your session expires:
1. You'll be redirected to the login page
2. Log in again to continue

## Permissions Matrix

| Operation | Superadmin | Municipality |
|-----------|------------|--------------|
| **Listings** |||
| View all regions | ✅ | ❌ (region only) |
| Create listings in any region | ✅ | ❌ (own region only) |
| Edit any listing | ✅ | ❌ (own region only) |
| Delete any listing | ✅ | ❌ (own region only) |
| Verify shelter listings | ✅ | ✅ (own region only) |
| Unflag listings | ✅ | ✅ (own region only) |
| **Bulk Operations** |||
| Bulk delete selected | ✅ | ✅ (own region only) |
| Bulk delete all | ✅ | ❌ |
| Import from Excel | ✅ | ✅ (own region only) |
| **Admin Accounts** |||
| Create municipality accounts | ✅ (via CLI) | ❌ |
| View admin info | ✅ | ❌ (own only) |

## Troubleshooting

### Login Issues

- **"Invalid username or password"**: Check credentials carefully, passwords are case-sensitive
- **Rate limiting**: After 5 failed attempts, wait 15 minutes before trying again

### Import Errors

- **"Invalid region"**: Use exact region codes (lowercase with underscores)
- **"Invalid phone"**: Phone must be 7-20 characters with digits, spaces, hyphens, or + prefix
- **"Invalid capacity"**: Must be a whole number between 1-10000

### Session Issues

- **Automatically logged out**: Sessions expire after 24 hours for security
- **Can't access dashboard**: Check that you're logged in by visiting `/admin/login`

## Security Best Practices

1. **Keep passwords secure**: Store initial passwords safely; they cannot be recovered
2. **Log out when done**: Especially on shared computers
3. **Verify before approving**: Always verify shelter listings before marking as verified
4. **Monitor flagged content**: Review flagged listings promptly
5. **Use strong passwords**: When creating new accounts, use secure, unique passwords

## Support

For technical issues or questions about the platform:
- Check this guide first
- Review the main project documentation in `CLAUDE.md`
- Contact the platform administrator
