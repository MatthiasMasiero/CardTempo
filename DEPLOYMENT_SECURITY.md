# 🔒 Deployment Security Guide

## ⚠️ IMPORTANT: Deploy First, Add API Keys Later!

This guide outlines the secure deployment strategy to prevent API key abuse from bots.

---

## 🎯 Deployment Strategy

### Phase 1: Deploy Without API Keys (SAFE)
Deploy your application to production **without** any API keys configured. This allows you to:
- Set up the infrastructure
- Configure rate limiting
- Add bot protection
- Test the UI/UX

**What works without API keys:**
- ✅ Landing page
- ✅ Calculator (fully functional with localStorage)
- ✅ Results page
- ✅ All UI components
- ✅ Payment plan calculations

**What doesn't work (expected):**
- ❌ Email reminders (requires Resend API key)
- ❌ Database persistence (requires Supabase)
- ❌ User authentication (requires Supabase)

### Phase 2: Add Security Layers
Before adding API keys, protect your app:

1. **Rate Limiting**
2. **Bot Protection**
3. **Authentication Gates**
4. **API Route Protection**

### Phase 3: Add API Keys (SECURE)
Only after security is in place, add your API keys.

---

## 🛡️ Security Measures to Implement

### 1. Rate Limiting

**Option A: Vercel Edge Config (Recommended)**
```typescript
// middleware.ts
import { next } from '@vercel/edge';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  return next();
}
```

**Option B: Vercel Firewall (Enterprise)**
- Configure in Vercel dashboard
- Set rate limits per IP
- Block known bot IPs

**Option C: Cloudflare (Free)**
- Put Cloudflare in front of Vercel
- Use Cloudflare's bot protection
- Enable rate limiting rules

### 2. Bot Protection

**Cloudflare Turnstile (Free)**
```typescript
// Add to forms that trigger API calls
import { Turnstile } from '@marsidev/react-turnstile';

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  onSuccess={(token) => setTurnstileToken(token)}
/>
```

**Google reCAPTCHA v3 (Free)**
```typescript
// Invisible, no user interaction
import ReCAPTCHA from 'react-google-recaptcha-v3';

<ReCAPTCHA
  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
  onChange={(token) => setRecaptchaToken(token)}
/>
```

### 3. API Route Protection

**Protect Sensitive Endpoints:**
```typescript
// app/api/reminders/create/route.ts
export async function POST(request: NextRequest) {
  // 1. Check rate limit
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2. Verify Turnstile/reCAPTCHA token
  const body = await request.json();
  const isHuman = await verifyTurnstile(body.turnstileToken);
  if (!isHuman) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 403 });
  }

  // 3. Check for authenticated user (optional but recommended)
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 4. Proceed with logic
  // ...
}
```

### 4. Cron Job Protection

**Secure the cron endpoint:**
```typescript
// app/api/cron/send-reminders/route.ts
export async function GET(request: NextRequest) {
  // 1. Verify it's from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Verify User-Agent (Vercel Cron has specific UA)
  const userAgent = request.headers.get('user-agent');
  if (!userAgent?.includes('vercel-cron')) {
    return NextResponse.json({ error: 'Invalid source' }, { status: 403 });
  }

  // Proceed...
}
```

---

## 📋 Step-by-Step Deployment Checklist

### ✅ Pre-Deployment (Local)

- [ ] Remove any hardcoded API keys from code
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Test app works without API keys (UI only)
- [ ] Build succeeds: `npm run build`
- [ ] Commit and push to GitHub

### ✅ Initial Deployment (No API Keys)

1. **Connect to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Do NOT add environment variables yet**

3. **Verify deployment:**
   - Visit your Vercel URL
   - Test calculator functionality
   - Confirm no API calls fail (gracefully handle missing keys)

### ✅ Add Security (Before API Keys)

4. **Set up Rate Limiting:**
   - Option: Upstash Redis + @upstash/ratelimit
   - Or: Cloudflare (add domain to Cloudflare)
   - Or: Vercel Firewall (if on Pro/Enterprise)

5. **Add Bot Protection:**
   - Sign up for Cloudflare Turnstile (free)
   - Add site key to Vercel environment variables:
     ```
     NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
     TURNSTILE_SECRET_KEY=your_secret_key
     ```
   - Integrate into EmailReminderModal and other forms

6. **Test Security:**
   - Try rapid-fire requests
   - Verify rate limit triggers
   - Test bot protection works

### ✅ Add API Keys (Secure)

7. **Generate CRON_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

8. **Add to Vercel Environment Variables:**
   Go to Vercel Dashboard → Your Project → Settings → Environment Variables

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=re_your_api_key
   CRON_SECRET=your_generated_secret
   NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app
   ```

9. **Redeploy:**
   ```bash
   vercel --prod
   ```

### ✅ Post-Deployment Verification

10. **Test Everything:**
    - [ ] Calculator works
    - [ ] Email reminders can be set
    - [ ] Cron job runs (check Vercel logs)
    - [ ] Emails send (check Resend dashboard)
    - [ ] Rate limiting works
    - [ ] Bot protection active

11. **Monitor for Abuse:**
    - Check Vercel Analytics
    - Monitor Resend email usage
    - Watch Supabase database writes
    - Set up alerts for unusual activity

---

## 🚨 Monitoring & Alerts

### Resend Email Monitoring
- **Free tier: 3,000 emails/month**
- Set alert at 2,000 emails
- Monitor daily usage in Resend dashboard

### Supabase Database Monitoring
- **Free tier: 500MB database, 2GB bandwidth**
- Monitor table sizes
- Check for unusual write patterns
- Review API logs

### Vercel Analytics
- Track page views
- Monitor API response times
- Check for 429 (rate limit) responses

---

## 🔐 API Key Security Best Practices

### DO:
✅ Use environment variables for all secrets
✅ Never commit `.env.local` to Git
✅ Rotate API keys every 90 days
✅ Use different keys for dev/staging/production
✅ Monitor usage dashboards daily
✅ Set up usage alerts
✅ Require authentication for sensitive actions

### DON'T:
❌ Hardcode API keys in code
❌ Share API keys in Slack/Discord
❌ Use production keys in development
❌ Commit secrets to GitHub (even private repos)
❌ Expose service role keys to client
❌ Skip rate limiting

---

## 🛟 What to Do If Keys Are Compromised

### Immediate Actions:

1. **Revoke Compromised Keys:**
   - Resend: Delete API key in dashboard
   - Supabase: Reset service role key
   - Generate new keys immediately

2. **Update Vercel Environment Variables:**
   - Add new keys
   - Redeploy

3. **Monitor for Abuse:**
   - Check Resend sent emails
   - Review Supabase database writes
   - Look for suspicious patterns

4. **Rotate All Keys:**
   - Even if unsure which was compromised
   - Better safe than sorry

5. **Add GitHub Secret Scanning:**
   ```yaml
   # .github/workflows/secret-scan.yml
   name: Secret Scan
   on: [push]
   jobs:
     scan:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: trufflesecurity/trufflehog@main
   ```

---

## 📊 Cost Management

### Free Tier Limits:
- **Resend:** 3,000 emails/month
- **Supabase:** 500MB DB, 2GB bandwidth
- **Vercel:** 100GB bandwidth, serverless invocations

### If You Hit Limits:
- Resend: $20/month for 50K emails
- Supabase: $25/month for 8GB DB
- Vercel: $20/month Pro plan

### Optimize Usage:
- Batch email sends
- Implement email digest (daily, not per-reminder)
- Use pagination for database queries
- Cache frequently accessed data
- Optimize images (use Next.js Image component)

---

## 🎯 Recommended Setup for MVP

For your first launch, I recommend:

1. **Deploy to Vercel** (free tier)
2. **Add Cloudflare** (free tier) for bot protection
3. **Use Upstash Redis** (free tier) for rate limiting
4. **Add Turnstile** (free) to reminder form
5. **Then add API keys** to Vercel

This gives you:
- ✅ Bot protection
- ✅ Rate limiting
- ✅ Zero additional cost
- ✅ Production-ready security

---

## 📚 Resources

- [Vercel Rate Limiting](https://vercel.com/docs/edge-network/rate-limiting)
- [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
- [Upstash Redis](https://upstash.com/)
- [Resend Security](https://resend.com/docs/send-with-nextjs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Summary

**Deployment Order:**
1. Deploy app WITHOUT API keys ✅
2. Add security layers (rate limit, bot protection) ✅
3. Add API keys to Vercel environment variables ✅
4. Test thoroughly ✅
5. Monitor usage ✅

This strategy ensures your API keys are never exposed to bots during the vulnerable initial deployment phase.

**The DevWarningBanner component will remind you** whenever you're running in development mode without API keys configured, so you never forget to add them later!
