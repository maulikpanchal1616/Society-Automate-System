# Supabase Setup Guide — Shyamved Residency

Complete step-by-step instructions to set up Supabase from scratch for this project.

---

## Step 1: Create a New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Select your organization
4. Fill in:
   - **Name**: `shyamved-residency`
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: `South Asia (Mumbai)` — closest to Indian users
   - **Plan**: Free tier for development, Pro for production
5. Click **Create new project**
6. Wait 2-3 minutes for the project to provision

---

## Step 2: Get Your Project Keys

1. Go to **Project Settings → API**
2. Copy the following values and add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> ⚠️ **NEVER commit the service role key**. It bypasses RLS and has full database access.

---

## Step 3: Run Database Migrations

Copy and paste each migration file into **Supabase Dashboard → SQL Editor → New Query** and run in order:

### 3.1 — Run `supabase/migrations/001_initial_schema.sql`
Creates all 13 tables, enums, indexes, and triggers.

### 3.2 — Run `supabase/migrations/002_paid_bill_immutability.sql`
Adds PostgreSQL triggers for paid bill, payment, and receipt immutability.

### 3.3 — Run `supabase/migrations/003_rls_policies.sql`
Enables RLS on all tables and creates all policies.

> 💡 **Tip**: Run migrations in order. If a migration fails, fix the error and re-run from the same step.

---

## Step 4: Configure Authentication

### 4.1 Enable Email Auth
1. Go to **Authentication → Providers → Email**
2. Enable **Email signup**
3. Set **Confirm email** to ON (recommended for production)
4. Save

### 4.2 Enable Phone OTP Auth
1. Go to **Authentication → Providers → Phone**
2. Enable **Phone signup**
3. For production: Configure **Twilio** as SMS provider with your credentials
4. For development: Use **Supabase test OTP** (any 6-digit code works in test mode)
5. Save

### 4.3 Configure Auth URLs
1. Go to **Authentication → URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (development) / `https://your-domain.com` (production)
3. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

---

## Step 5: Create Auth Users

Create the initial admin accounts through **Supabase Dashboard → Authentication → Users → Invite user**:

| Email | Role | Password |
|---|---|---|
| `chairman@shyamved.com` | chairman | `ShyamvedAdmin@2025` |
| `office@shyamved.com` | office_man | `ShyamvedOffice@2025` |

After creating users, copy their **UUID** from the Users list.

---

## Step 6: Run Seed Data

1. Open `supabase/seed.sql`
2. Find the commented section **STEP 5: Users**
3. Uncomment and replace the placeholder UUIDs with the real auth user UUIDs from Step 5
4. Similarly uncomment **STEP 6: Chairman history** and fill in the chairman UUID
5. Run the entire `seed.sql` in SQL Editor

---

## Step 7: Set Up Storage (for receipt PDFs)

1. Go to **Storage → New Bucket**
2. Create bucket named: `receipts`
3. Set to **Private** (access via signed URLs only)
4. Create another bucket named: `attachments` for future use

### Storage RLS Policy for receipts bucket:
Run this in SQL Editor:
```sql
CREATE POLICY "receipts_select_own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = (
    SELECT society_id::text FROM public.users WHERE id = auth.uid()
  )
);
```

---

## Step 8: Enable Realtime

1. Go to **Database → Replication**
2. Enable realtime for these tables:
   - `bills`
   - `payments`
   - `notices`
   - `events`

---

## Step 9: Verify Setup

Run this query in SQL Editor to verify everything is working:

```sql
-- Should return 1 society
SELECT * FROM societies;

-- Should return 8 houses
SELECT COUNT(*) FROM houses;

-- Should return 2 blocks
SELECT * FROM blocks;

-- Should show all bills
SELECT bill_status, COUNT(*) FROM bills GROUP BY bill_status;

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Local Development with Supabase CLI

For fully local development (optional):

```bash
# Start Supabase locally (requires Docker Desktop)
npm run supabase:start

# Check status
npm run supabase:status

# Reset and re-run all migrations
npm run db:reset

# Generate TypeScript types from local DB
npm run db:types

# Stop local Supabase
npm run supabase:stop
```

Local Supabase URLs:
- **Studio**: http://localhost:54323
- **API**: http://localhost:54321
- **DB**: postgresql://postgres:postgres@localhost:54322/postgres

---

## Environment Variables Summary

```bash
# .env.local — fill all of these before starting development

# Supabase (from Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Razorpay (add when test keys are available)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Shyamved Residency
```
