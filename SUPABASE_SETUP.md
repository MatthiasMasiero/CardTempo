# Supabase Database Setup Guide

This app is configured to work with **both** localStorage (current) and Supabase database (future). You can run the app NOW with localStorage, and add database support later when ready.

## Current Status

✅ **App works now** - Uses localStorage to save user cards
✅ **Database schema ready** - SQL is defined in `src/lib/supabase.ts`
✅ **Backward compatible** - Adding database won't break anything
⏳ **Database not connected** - Waiting for Supabase credentials

---

## Option 1: Keep Using localStorage (No Setup Needed)

The app works perfectly with localStorage right now:
- ✅ Cards persist across page refreshes
- ✅ No server required
- ✅ Fast and simple
- ❌ Data is local to each browser
- ❌ No cross-device sync

**To continue with localStorage only**: Do nothing! Keep using the app as-is.

---

## Option 2: Add Supabase Database (Optional)

When you're ready to add a database, follow these steps:

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Sign in
3. Click "New Project"
4. Fill in:
   - **Project Name**: Credit Optimizer (or whatever you want)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
5. Wait ~2 minutes for project to initialize

### Step 2: Get Your API Credentials

1. In your Supabase project, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (under "Project API keys")

### Step 3: Add Environment Variables

1. In your project root, create `.env.local` file (or edit existing)
2. Add these lines:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace `your-project-url-here` with your Project URL
4. Replace `your-anon-key-here` with your anon public key

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQwNTg0MCwiZXhwIjoxOTM4OTgxODQwfQ.example-signature-here
```

### Step 4: Run Database Migrations

1. In your Supabase project, click "SQL Editor" in the sidebar
2. Click "New Query"
3. Copy the entire SQL from `src/lib/supabase.ts` (lines 117-193)
4. Paste into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

This creates:
- ✅ `users` table
- ✅ `credit_cards` table
- ✅ `payment_reminders` table
- ✅ Row-level security policies
- ✅ Auto-signup trigger

### Step 5: Restart Your Dev Server

```bash
npm run dev
```

That's it! Your app now uses the database.

---

## How It Works (Hybrid Approach)

The app uses a **graceful fallback** system:

```
┌─────────────────────────────────────────┐
│ User adds a credit card                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ ✅ Save to localStorage (always works)  │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────┴────────┐
       │ Database setup? │
       └───────┬────────┘
               │
       ┌───────┴────────┐
       │                │
      YES              NO
       │                │
       ▼                ▼
┌──────────────┐  ┌─────────────┐
│ Also save to │  │ Done!       │
│ database     │  │ Using local │
└──────────────┘  └─────────────┘
```

**Benefits:**
- ✅ Works with OR without database
- ✅ No breaking changes
- ✅ Data always safe (localStorage as backup)
- ✅ Easy to migrate later

---

## Verifying Database Connection

After setup, check if database is working:

1. Open browser console (F12)
2. Look for one of these messages:
   - ✅ "Using database" → Database connected!
   - ⚠️ "Using localStorage (database not available)" → Using localStorage

---

## Troubleshooting

### "Using localStorage" message after setup

**Possible causes:**
1. Environment variables not set correctly
   - Check `.env.local` file exists in project root
   - Verify variable names: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Restart dev server after adding env vars

2. SQL migration not run
   - Go to Supabase → SQL Editor
   - Run the SQL from `src/lib/supabase.ts`

3. Row-level security blocking access
   - Check Supabase → Authentication → Users
   - Make sure you're signed in with the app

### Database connection errors

If you see errors in console:
1. Check Supabase project is not paused (free tier pauses after 1 week inactivity)
2. Verify API keys are correct (no extra spaces)
3. Check Supabase service status: [status.supabase.com](https://status.supabase.com)

---

## Data Migration (Future)

When you add database support, existing localStorage data will:
- ✅ Stay in localStorage (nothing lost)
- ✅ Continue working (backward compatible)
- ⏳ Not auto-migrate to database

To migrate existing data:
1. Export localStorage data (browser DevTools → Application → localStorage)
2. Manually re-add cards while database is connected
3. OR wait for future migration script (not yet implemented)

---

## Need Help?

**Database not required!** The app works great with localStorage alone. Add database only when you need:
- Cross-device sync
- Multi-user support
- Server-side features
- Production deployment

For questions, check:
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- This codebase: `src/lib/supabase.ts` for schema
- This codebase: `src/hooks/useCards.ts` for hybrid storage logic
