-- DIAGNOSTIC: Find out why webhook didn't grant premium
-- Run this in Supabase SQL Editor after granting emergency access

-- 1. Check if there are ANY Stripe events for this user
SELECT
  se.id,
  se.stripe_event_id,
  se.event_type,
  se.processed,
  se.error,
  se.created_at,
  se.payload->>'customer' as customer_id,
  se.payload->>'subscription' as subscription_id
FROM stripe_events se
ORDER BY se.created_at DESC
LIMIT 20;

-- 2. Check the user's subscription record details
SELECT
  s.user_id,
  s.tier,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.billing_interval,
  s.current_period_start,
  s.current_period_end,
  s.created_at,
  s.updated_at,
  u.email
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.user_id = '4b9e94f9-f109-4d4e-81e3-08b9258a387a';

-- 3. Check for failed/unprocessed webhook events
SELECT
  stripe_event_id,
  event_type,
  processed,
  error,
  created_at,
  payload
FROM stripe_events
WHERE processed = false OR error IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Look for checkout sessions that might not have been processed
SELECT
  stripe_event_id,
  event_type,
  processed,
  payload->'metadata'->>'userId' as user_id_from_metadata,
  payload->>'customer' as customer_id,
  created_at
FROM stripe_events
WHERE event_type = 'checkout.session.completed'
ORDER BY created_at DESC
LIMIT 10;
