-- URGENT FIX: Grant premium to user who just signed up
-- User ID: 4b9e94f9-f109-4d4e-81e3-08b9258a387a
-- Run this in Supabase SQL Editor immediately!

-- Option 1: Grant them 90 days of early adopter premium (RECOMMENDED for launch period)
UPDATE subscriptions
SET
  tier = 'premium',
  status = 'active',
  grandfathered_until = NOW() + INTERVAL '90 days',
  updated_at = NOW()
WHERE user_id = '4b9e94f9-f109-4d4e-81e3-08b9258a387a';

-- Option 2: Grant them permanent premium (if they paid but webhook failed)
-- UPDATE subscriptions
-- SET
--   tier = 'premium',
--   status = 'active',
--   updated_at = NOW()
-- WHERE user_id = '4b9e94f9-f109-4d4e-81e3-08b9258a387a';

-- Verify the update worked
SELECT
  user_id,
  tier,
  status,
  grandfathered_until,
  updated_at
FROM subscriptions
WHERE user_id = '4b9e94f9-f109-4d4e-81e3-08b9258a387a';
