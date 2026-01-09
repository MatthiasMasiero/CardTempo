# Developer Setup Guide

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local

# 3. Add your API keys (see below)

# 4. Run development server
npm run dev
```

## ⚙️ Required API Keys

### 🔒 **IMPORTANT SECURITY NOTE**
Add API keys **AFTER** deploying to production to prevent bot abuse!

### Supabase (Database & Authentication)

Create a free account at [supabase.com](https://supabase.com)

Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Setup Steps:**
1. Create new project in Supabase
2. Go to Project Settings → API
3. Copy URL and keys
4. Run database migrations (see below)

### Resend (Email Reminders)

Create account at [resend.com](https://resend.com)

Add to `.env.local`:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Setup Steps:**
1. Create Resend account
2. Add and verify your domain
3. Generate API key
4. Add to `.env.local`

### Cron Authentication (Security)

Generate a random secret for cron job authentication:

```bash
# Generate a secure random string
openssl rand -base64 32
```

Add to `.env.local`:
```bash
CRON_SECRET=your_generated_secret
```

## 🗄️ Database Setup

### Run Migrations

```bash
# The SQL migration files are in /supabase/migrations/
# Run them in Supabase SQL Editor in this order:

1. 01_initial_schema.sql
2. 02_add_indexes.sql
3. 03_add_policies.sql
```

### Seed Data (Optional)

For testing, you can add sample data:
```sql
-- Add in Supabase SQL Editor
INSERT INTO credit_cards (user_id, nickname, credit_limit, current_balance, statement_date, due_date)
VALUES (auth.uid(), 'Test Card', 10000, 5000, 15, 10);
```

## 📋 Environment Variables Reference

### Required for Development

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Resend (Email)
RESEND_API_KEY=re_xxxxx...

# Security
CRON_SECRET=your_random_secret
```

### Optional

```bash
# Upstash (Rate Limiting) - Optional
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx...

# Analytics - Optional
NEXT_PUBLIC_GA_ID=G-XXXXXXXX
```

## 📝 Deployment Checklist

Before deploying to production:

- [ ] Deploy app to Vercel (without API keys initially)
- [ ] Set up rate limiting & bot protection
- [ ] Add API keys to Vercel environment variables
- [ ] Run database migrations in Supabase
- [ ] Test email reminders feature
- [ ] Verify authentication works
- [ ] Test credit card calculations
- [ ] Check responsive design on mobile

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests before deployment
npm run test:pre-deploy
```

## 🔐 Security Best Practices

### ⚠️ NEVER commit API keys to git!

The `.env.local` file is gitignored. Keep it that way!

### ✅ DO:
- Add API keys via Vercel environment variables
- Use different keys for dev/staging/prod
- Rotate keys periodically
- Enable rate limiting before adding keys

### ❌ DON'T:
- Commit `.env.local` to git
- Share API keys in Slack/Discord
- Use production keys in development
- Deploy with keys before rate limiting is set up

## 🛠️ Troubleshooting

### "Supabase client not configured"
- Check `.env.local` has all Supabase variables
- Restart dev server after adding keys

### "Email reminders not sending"
- Verify Resend API key is correct
- Check domain is verified in Resend
- Look for errors in Vercel logs

### "Authentication not working"
- Check Supabase URL is correct
- Verify anon key is set
- Check browser console for errors

### "Tests failing"
- Run `npm run test:pre-deploy` to check all tests
- Make sure dev server is running for E2E tests
- Check test logs in `test-results/`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Testing Guide](./TESTING.md)

## 🆘 Need Help?

1. Check this file first
2. Review `.env.example` for required variables
3. Check project documentation in `/docs`
4. Review test logs for specific errors

---

**Last Updated:** December 29, 2025

See `.env.example` for a complete list of environment variables.
