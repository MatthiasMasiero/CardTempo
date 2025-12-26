# Security Guide

## Environment Variables Setup

### 1. Where to Paste Your Keys

Open the file `.env.local` in the root of your project and fill in your credentials:

```bash
# PASTE YOUR SUPABASE KEYS HERE:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OPTIONAL - For email reminders:
RESEND_API_KEY=re_your_api_key_here

# Generate a random secret for cron jobs:
CRON_SECRET=paste_random_string_here
```

### 2. How to Get Your Keys

#### Supabase Keys:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon on the left)
4. Click **API**
5. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### Generate CRON_SECRET:
Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as `CRON_SECRET`

#### Resend API Key (Optional):
1. Go to https://resend.com
2. Sign up for free account
3. Go to **API Keys** section
4. Create new API key
5. Copy and paste as `RESEND_API_KEY`

---

## Security Features Implemented

### 1. Rate Limiting

**Global Rate Limit (All API Routes):**
- **20 requests per minute per IP address**
- Applies to all `/api/*` endpoints
- Returns `429 Too Many Requests` when exceeded
- Headers included in response:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: When the limit resets
  - `Retry-After`: Seconds until retry allowed

**Why 20 requests/minute?**
For normal usage of a credit optimizer app:
- Loading dashboard: 2-3 requests
- Adding/editing cards: 1-2 requests each
- Running calculations: 1 request
- Viewing results: 2-3 requests
- **Total normal usage: ~10-15 requests/minute**
- 20/minute provides comfortable headroom without allowing abuse

**Action-Specific Rate Limits:**
- Email sending: 3 emails per minute per user
- PDF generation: 3 per minute per user
- Can be customized per action using `checkActionRateLimit()`

### 2. Security Headers

All responses include these headers:

- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-XSS-Protection: 1; mode=block** - XSS protection
- **Referrer-Policy** - Controls referrer information
- **Content-Security-Policy** - Prevents XSS, injection attacks
- **Permissions-Policy** - Disables unnecessary browser features

### 3. Authentication Security

- **Row Level Security (RLS)** - Database-level access control
- Users can ONLY access their own data
- Even with the anon key, users cannot see other users' data
- JWT tokens expire automatically
- Service role key is server-side only (never exposed to browser)

### 4. Input Validation & Sanitization

Helper functions in `src/lib/api-security.ts`:
- `sanitizeInput()` - Removes dangerous characters
- `isValidEmail()` - Validates email format
- `validateRequiredFields()` - Ensures required data is present
- `isInRange()` - Validates numeric ranges

---

## Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore` (already configured)
- Use `NEXT_PUBLIC_*` only for variables safe to expose in browser
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
- Rotate your `CRON_SECRET` periodically
- Use Row Level Security (RLS) policies in Supabase
- Validate all user input on both client and server
- Use TypeScript for type safety

### ❌ DON'T:
- Never commit `.env.local` to Git
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- Never trust user input without validation
- Never disable RLS policies in production
- Never hardcode secrets in source code
- Never use `service_role` key in browser/client code

---

## How Data is Protected

### Row Level Security (RLS) Example:

```sql
-- Users can only view their own credit cards
create policy "Users can view own cards"
  on public.credit_cards
  for select
  using (auth.uid() = user_id);
```

**What this means:**
- User A logs in, gets JWT token with `user_id = abc123`
- User A queries: `SELECT * FROM credit_cards`
- Supabase automatically adds: `WHERE user_id = 'abc123'`
- User A can NEVER see User B's cards, even if they try

This protection is **at the database level**, not just in your code!

---

## Rate Limit Configuration

### Adjust Rate Limits (in `src/middleware.ts`):

```typescript
const RATE_LIMIT_WINDOW = 60 * 1000; // Time window in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 60;  // Max requests per window
```

### Adjust Action-Specific Limits:

```typescript
// In your API route
const rateLimit = checkActionRateLimit(
  userId,
  'send_email',   // Action name
  5,              // Max requests
  60000           // Window (1 minute)
);
```

---

## Using Security Helpers in API Routes

Example of a secure API route:

```typescript
import { NextRequest } from 'next/server';
import {
  verifyAuth,
  validateRequiredFields,
  errorResponse,
  successResponse,
  checkActionRateLimit
} from '@/lib/api-security';

export async function POST(request: NextRequest) {
  // 1. Verify authentication
  const userId = await verifyAuth(request);
  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  // 2. Parse request body
  const body = await request.json();

  // 3. Validate required fields
  const validation = validateRequiredFields(body, ['email', 'message']);
  if (!validation.valid) {
    return errorResponse(
      `Missing fields: ${validation.missing?.join(', ')}`,
      400
    );
  }

  // 4. Check action-specific rate limit
  const rateLimit = checkActionRateLimit(userId, 'send_email', 5, 60000);
  if (!rateLimit.allowed) {
    return errorResponse('Too many requests', 429);
  }

  // 5. Process request...
  // Your business logic here

  // 6. Return success
  return successResponse({ success: true });
}
```

---

## Monitoring & Alerts

### Check Rate Limit Status:
Rate limit headers are included in every API response:
```bash
curl -I https://your-app.com/api/endpoint
# Look for:
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 45
# X-RateLimit-Reset: 2025-01-15T12:00:00Z
```

### Supabase Dashboard:
- Monitor authentication attempts
- View API usage
- Check database logs
- Set up alerts for suspicious activity

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel/hosting platform
- [ ] `CRON_SECRET` generated and configured
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Service role key is only used server-side
- [ ] Rate limiting tested and appropriate for your scale
- [ ] Security headers verified (use https://securityheaders.com)
- [ ] SSL/HTTPS enabled
- [ ] Supabase project is on production plan (if needed)
- [ ] Database backups configured
- [ ] Error logging/monitoring set up (Sentry, LogRocket, etc.)

---

## Need Help?

- **Supabase Security Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **Next.js Security**: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

---

## Questions?

Common questions answered:

**Q: Is it safe to expose the anon key in the browser?**
A: Yes! The anon key is designed to be public. Row Level Security (RLS) protects your data at the database level.

**Q: What's the difference between anon key and service_role key?**
A:
- **Anon key**: Public, safe to expose, respects RLS policies
- **Service role**: Secret, bypasses RLS, server-side only

**Q: How do I increase rate limits?**
A: Edit the constants in `src/middleware.ts` and `src/lib/api-security.ts`

**Q: What if someone tries to access another user's data?**
A: RLS policies at the database level will block them, even if they try to manipulate API calls.
