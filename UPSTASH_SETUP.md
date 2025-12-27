# Upstash Redis Setup for Rate Limiting

## Why This Is Needed

Your original rate limiting used in-memory storage (`Map`), which **doesn't work in serverless environments** like Vercel. Each serverless function gets fresh memory, so rate limits reset on every request!

Upstash Redis provides **distributed, persistent rate limiting** that works across all serverless function instances.

---

## Option 1: Upstash Redis (Recommended - Free Tier Available)

### Step 1: Create Upstash Account
1. Go to https://upstash.com
2. Click "Sign up" (free)
3. Sign up with GitHub, Google, or email

### Step 2: Create Redis Database
1. After logging in, click "Create Database"
2. Choose settings:
   - **Name:** `credit-optimizer-ratelimit`
   - **Type:** Global (for best worldwide performance) or Regional (faster, cheaper)
   - **Region:** Choose closest to your users (e.g., US East)
   - **Primary Region:** us-east-1 (or your choice)
   - **Read Regions:** (optional, for global apps)

3. Click "Create"

### Step 3: Get Credentials
After creation, you'll see the database dashboard:

1. Click on your database name
2. Scroll to "REST API" section
3. You'll see:
   ```
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AYxxx...xxxxx
   ```

### Step 4: Add to Environment Variables

**For Local Development:**
Add to your `.env.local` file:
```bash
# Upstash Redis for Rate Limiting
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYxxx...your-token-here
```

**For Vercel Deployment:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add both variables:
   - `UPSTASH_REDIS_REST_URL` = `https://xxxxx.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` = `AYxxx...your-token-here`
3. Select "Production", "Preview", and "Development"
4. Click "Save"

### Step 5: Verify It Works

Restart your dev server:
```bash
npm run dev
```

You should see in the console:
```
✓ Ready in 2s
```

And NO warning about in-memory rate limiting!

If you see:
```
⚠️  Using in-memory rate limiting - NOT suitable for production!
```

Then the environment variables aren't set correctly.

---

## Option 2: Vercel KV (Alternative - Requires Vercel Pro)

If you're already on Vercel Pro ($20/month), you can use Vercel KV instead:

### Step 1: Enable Vercel KV
1. Go to Vercel Dashboard → Storage tab
2. Click "Create Database" → "KV"
3. Name it `credit-optimizer-ratelimit`
4. Select your project
5. Click "Create"

### Step 2: Connect to Project
Vercel automatically adds these environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### Step 3: Update Middleware
If using Vercel KV, update `src/middleware.ts`:

```typescript
// Change these lines:
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

// To:
if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
```

---

## Free Tier Limits

### Upstash Redis Free Tier:
- ✅ **10,000 commands per day**
- ✅ **256 MB storage**
- ✅ **Unlimited databases**
- ✅ **Global replication** (optional)

**For Your App:**
- Each API request = 1-2 Redis commands
- 10,000 commands = ~5,000-10,000 API requests per day
- More than enough for testing and small apps!

### When to Upgrade:
Upgrade to Upstash Pro ($10/month) when you reach:
- 300,000+ API requests per day
- Need 99.99% uptime SLA
- Need dedicated support

---

## Testing Rate Limiting

### Test 1: Verify Redis Connection
```bash
# Start your app
npm run dev

# Check console - should NOT see:
# ⚠️  Using in-memory rate limiting

# Should see normal startup
```

### Test 2: Trigger Rate Limit
```bash
# Make 25 rapid requests (limit is 20/minute)
for i in {1..25}; do
  curl http://localhost:3002/api/pdf/generate -X POST \
    -H "Content-Type: application/json" \
    -d '{"result":{}}' &
done

# Last 5 requests should return:
# {
#   "error": "Too many requests",
#   "message": "You have exceeded the rate limit...",
#   "retryAfter": 60
# }
```

### Test 3: Check Redis Dashboard
1. Go to Upstash dashboard
2. Click your database
3. Click "Data Browser"
4. You should see keys like:
   ```
   ratelimit:127.0.0.1
   ratelimit:192.168.1.1
   ```

These are your rate limit counters!

---

## Troubleshooting

### Issue: "Using in-memory rate limiting" warning
**Solution:** Check environment variables are set:
```bash
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

If empty, add to `.env.local` and restart server.

---

### Issue: "Failed to initialize Upstash rate limiter"
**Possible Causes:**
1. **Wrong credentials:** Copy-paste error
2. **Database deleted:** Check Upstash dashboard
3. **Network issues:** Check internet connection

**Solution:**
```bash
# Test connection manually
curl -X POST https://your-redis-url.upstash.io/ping \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: {"result":"PONG"}
```

---

### Issue: Rate limiting not working
**Check:**
1. Environment variables set correctly
2. Middleware is running (check `/api/*` routes)
3. IP address being captured correctly

**Debug:**
```typescript
// Add to middleware.ts temporarily
console.log('IP:', ip);
console.log('Rate limit result:', rateLimitResult);
```

---

## Cost Comparison

| Solution | Free Tier | Pro Tier | Best For |
|----------|-----------|----------|----------|
| Upstash Redis | 10k cmds/day | $10/mo unlimited | Small-medium apps |
| Vercel KV | Not available | $20/mo (Pro plan) | Vercel-native apps |
| In-memory | Free | N/A | **Development only** |

**Recommendation:** Start with Upstash free tier, upgrade when needed.

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Upstash Redis database created
- [ ] Environment variables added to Vercel
- [ ] Tested rate limiting locally
- [ ] Verified no "in-memory" warning
- [ ] Tested with actual API calls
- [ ] Monitored Upstash dashboard for usage
- [ ] Set up billing alerts (if on paid tier)

---

## Security Notes

### ✅ Good Practices:
- Environment variables in `.env.local` (gitignored)
- Separate databases for dev/staging/prod
- Rotate tokens periodically
- Monitor usage in Upstash dashboard

### ❌ Don't:
- Commit tokens to git
- Use same database for dev and production
- Share tokens publicly
- Hardcode tokens in code

---

## Next Steps

1. **Now:** Set up Upstash Redis (10 minutes)
2. **Test:** Verify rate limiting works
3. **Deploy:** Add env vars to Vercel
4. **Monitor:** Check Upstash dashboard weekly

Your rate limiting will now work correctly in production! 🎉
