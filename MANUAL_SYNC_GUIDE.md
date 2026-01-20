# Manual Subscription Sync Guide

**When to use**: When a user paid via Stripe but didn't get premium access (webhook failed)

---

## 🚀 Quick Fix - Sync a User's Subscription

### Step 1: Set Up Admin API Key (One-time setup)

1. **Generate a secure API key**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Add to environment variables**:

   **Vercel Dashboard** → Your Project → Settings → Environment Variables:
   ```
   ADMIN_API_KEY=<your-generated-key-from-step-1>
   ADMIN_EMAIL=<your-email-for-alerts>
   ```

3. **Redeploy** your app in Vercel

---

### Step 2: Sync the User's Subscription

#### Option A: Using cURL (Terminal)

```bash
curl -X POST https://cardtempo.com/api/admin/sync-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -d '{"userId": "4b9e94f9-f109-4d4e-81e3-08b9258a387a"}'
```

**Replace**:
- `YOUR_ADMIN_API_KEY` with your admin API key from Step 1
- `4b9e94f9-f109-4d4e-81e3-08b9258a387a` with the actual user ID

#### Option B: Using the Script (Easier)

I've created a helper script for you:

```bash
node sync-user.js 4b9e94f9-f109-4d4e-81e3-08b9258a387a
```

---

### Expected Response

**Success - User has premium**:
```json
{
  "success": true,
  "message": "Subscription synced successfully",
  "tier": "premium",
  "subscriptionId": "sub_...",
  "status": "active",
  "interval": "monthly"
}
```

**Success - User is free tier**:
```json
{
  "success": true,
  "message": "User has not subscribed to a paid plan yet",
  "tier": "free"
}
```

**Error - User not found**:
```json
{
  "error": "Subscription record not found"
}
```

---

## 🔍 How It Works

The sync endpoint:
1. Checks if user has a Stripe customer ID
2. Fetches their active subscriptions from Stripe
3. Updates the local database to match Stripe's data
4. Grants premium access if they have an active subscription

This is **safe to run multiple times** - it's idempotent.

---

## 🛠️ Troubleshooting

### Error: "Unauthorized"
- Check that your `ADMIN_API_KEY` environment variable is set correctly
- Make sure you're using the correct API key in the Authorization header
- Verify you redeployed after adding the environment variable

### Error: "Subscription record not found"
- User doesn't exist in your database
- Check the user ID is correct
- Run this SQL to verify: `SELECT * FROM subscriptions WHERE user_id = '...'`

### Error: "No active subscription in Stripe"
- User hasn't paid yet (or subscription expired)
- Check Stripe dashboard to confirm
- User was updated to free tier automatically

---

## 📊 Monitoring Active Subscriptions

Run this SQL in Supabase to see all premium users:

```sql
SELECT
  u.email,
  s.tier,
  s.status,
  s.billing_interval,
  s.current_period_end,
  s.stripe_subscription_id
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.tier = 'premium'
ORDER BY s.created_at DESC;
```

---

## 🚨 Emergency: Batch Sync All Users

If multiple users are affected, you can sync all users with Stripe customer IDs:

```sql
-- Get all users who have Stripe customers but might be out of sync
SELECT user_id
FROM subscriptions
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

Then sync each one using the endpoint or script.

---

## 💡 Prevention

Once you set up webhooks correctly (see `WEBHOOK_SETUP_GUIDE.md`), you won't need this endpoint.

But it's good to keep it as a safety net for rare cases when:
- Stripe webhooks are temporarily down
- Database connection fails during webhook processing
- Manual override is needed for customer support
