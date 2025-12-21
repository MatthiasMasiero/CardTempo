# Supabase Database Setup

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for MVP)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `migrations/20250119_email_reminders.sql`
4. Paste into the SQL editor
5. Click **Run**

### Option 2: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Database Schema Overview

### Tables Created

1. **credit_cards** - Stores user credit card information
   - User's saved credit cards
   - Links to auth.users

2. **payment_reminders** - Scheduled payment reminders
   - Payment date, amount, purpose
   - Reminder date and email status

3. **reminder_preferences** - User notification settings
   - Days before payment to remind
   - Email preferences

4. **calculation_history** - Analytics tracking
   - Calculation logs for insights
   - Can be anonymous or user-linked

### Security

All tables have Row Level Security (RLS) enabled with policies that ensure:
- Users can only access their own data
- Service role can access all data (for cron jobs)

## Environment Variables

Add to your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Service Role Key

The service role key bypasses RLS and is needed for:
- Cron job to send reminder emails
- Admin operations

**⚠️ Keep this secret! Never expose in client-side code.**
