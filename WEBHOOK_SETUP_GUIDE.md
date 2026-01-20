# 🔧 Stripe Webhook Setup - Complete Fix

**Problem**: New signups don't get premium access after payment
**Root Cause**: Stripe webhooks not configured for production domain
**Solution**: Configure webhook endpoint and add safety mechanisms

---

## 🚨 IMMEDIATE FIX - Configure Stripe Webhook (5 minutes)

### Step 1: Add Webhook Endpoint in Stripe

1. **Go to**: [Stripe Webhooks Dashboard](https://dashboard.stripe.com/webhooks)

2. **Click**: "Add endpoint" button

3. **Enter Endpoint URL**:
   ```
   https://cardtempo.com/api/webhooks/stripe
   ```
   ⚠️ **Important**: Use `https://` (not `http://`)

4. **Select Events to Listen To**:
   Click "Select events" and choose these 6 events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. **Click**: "Add endpoint"

6. **Copy the Signing Secret**:
   - After creating, you'll see "Signing secret"
   - Click "Reveal" to show it
   - It looks like: `whsec_...`
   - **KEEP THIS - YOU'LL NEED IT IN STEP 2**

---

### Step 2: Update Production Environment Variables

**Where to update**: Vercel Dashboard → Your Project → Settings → Environment Variables

**Variable to update**:
```
STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET_FROM_STEP_1
```

**Also verify these are set correctly**:
```
NEXT_PUBLIC_APP_URL=https://cardtempo.com
STRIPE_SECRET_KEY=sk_live_... (your live secret key)
STRIPE_WEBHOOK_SECRET=whsec_... (from Step 1)
```

⚠️ **After updating**: Redeploy your app in Vercel!

---

### Step 3: Test the Webhook

1. **Go to**: [Stripe Webhooks Dashboard](https://dashboard.stripe.com/webhooks)

2. **Click** on your new webhook endpoint

3. **Click** "Send test webhook" button

4. **Select**: `checkout.session.completed`

5. **Click**: "Send test webhook"

6. **Check the response**:
   - ✅ Status should be **200 OK**
   - ❌ If you see 400/500, check error message and webhook secret

---

## 🛡️ ADDITIONAL SAFETY MECHANISMS

I'll add these to prevent future failures even if webhooks have issues:

1. **Webhook retry logic** (already built into Stripe - automatic)
2. **Better error logging** (we'll add this)
3. **Admin notifications** (we'll add this)
4. **Sync endpoint** (we'll add this as backup)

