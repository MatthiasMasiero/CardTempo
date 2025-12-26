# Quick Setup Guide - Paste Your Keys Here

## Step 1: Get Your Supabase Keys

1. Go to https://supabase.com/dashboard
2. Click on your project (or create a new one)
3. Click **Settings** (gear icon) → **API**
4. You'll see this screen:

```
Project URL
https://xxxxxxxxxxxxx.supabase.co    [Copy]

API Keys
┌─────────────────────────────────────┐
│ anon public                         │
│ eyJhbGciOiJIUzI1NiIsInR5cCI...     │  [Copy]
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ service_role (secret!)              │
│ eyJhbGciOiJIUzI1NiIsInR5cCI...     │  [Copy]
└─────────────────────────────────────┘
```

---

## Step 2: Paste Keys in .env.local

Open `.env.local` and paste your keys:

```bash
# 1. PASTE PROJECT URL HERE (from step 1)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# 2. PASTE ANON PUBLIC KEY HERE (from step 1)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

# 3. PASTE SERVICE ROLE KEY HERE (from step 1)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

---

## Step 3: Generate CRON_SECRET

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

You'll get output like:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Copy this and paste in `.env.local`:

```bash
CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## Step 4: Set Up Database (One-Time)

1. Go to your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone default timezone('utc'::text, now()) not null,
  target_utilization decimal(5,4) default 0.05 not null,
  reminder_days_before integer default 3 not null,
  email_notifications boolean default true not null
);

-- Credit cards table
create table public.credit_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  nickname text not null,
  credit_limit decimal(12,2) not null,
  current_balance decimal(12,2) not null,
  statement_date integer not null check (statement_date >= 1 and statement_date <= 31),
  due_date integer not null check (due_date >= 1 and due_date <= 31),
  apr decimal(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payment reminders table
create table public.payment_reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  card_id uuid references public.credit_cards on delete cascade not null,
  reminder_date timestamp with time zone not null,
  amount decimal(12,2) not null,
  purpose text not null check (purpose in ('optimization', 'balance')),
  status text default 'pending' not null check (status in ('pending', 'sent', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) policies
alter table public.users enable row level security;
alter table public.credit_cards enable row level security;
alter table public.payment_reminders enable row level security;

-- Users can only access their own data
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Credit cards policies
create policy "Users can view own cards" on public.credit_cards for select using (auth.uid() = user_id);
create policy "Users can insert own cards" on public.credit_cards for insert with check (auth.uid() = user_id);
create policy "Users can update own cards" on public.credit_cards for update using (auth.uid() = user_id);
create policy "Users can delete own cards" on public.credit_cards for delete using (auth.uid() = user_id);

-- Payment reminders policies
create policy "Users can view own reminders" on public.payment_reminders for select using (auth.uid() = user_id);
create policy "Users can insert own reminders" on public.payment_reminders for insert with check (auth.uid() = user_id);
create policy "Users can update own reminders" on public.payment_reminders for update using (auth.uid() = user_id);
create policy "Users can delete own reminders" on public.payment_reminders for delete using (auth.uid() = user_id);

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"

---

## Step 5: Verify Setup

Run your app:

```bash
npm run dev
```

Check the console - you should NOT see any Supabase errors.

---

## Optional: Email Reminders (Resend)

If you want email reminders to work:

1. Go to https://resend.com
2. Sign up (free - 100 emails/day)
3. Go to **API Keys**
4. Click **Create API Key**
5. Copy the key (starts with `re_`)
6. Paste in `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Your Final .env.local Should Look Like:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend (optional)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Security
CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Troubleshooting

**"Supabase client is not configured"**
- Make sure you pasted the keys without extra spaces
- Restart your dev server: `npm run dev`

**"Row Level Security policy violation"**
- Make sure you ran the SQL from Step 4
- Check that RLS policies are enabled in Supabase dashboard

**"Invalid API key"**
- Double-check you copied the full key (they're very long!)
- Make sure you copied from the correct project

---

## You're Done!

Security features automatically enabled:
✅ Rate limiting (60 requests/minute per IP)
✅ Security headers (XSS, clickjacking protection)
✅ Row Level Security (users can only see their own data)
✅ Input validation and sanitization
✅ Environment variables protected (.gitignore)

Read `SECURITY.md` for more details!
