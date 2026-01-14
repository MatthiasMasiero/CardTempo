-- Migration: Subscription System for Premium Paywall
-- Date: 2026-01-12
-- Description: Adds subscription tracking for Stripe integration
-- SAFE: This migration only creates NEW tables, does not modify existing ones

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

-- Subscription tier levels
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Subscription status (mirrors Stripe statuses)
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active',
    'canceled',
    'past_due',
    'trialing',
    'unpaid',
    'incomplete',
    'incomplete_expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Billing interval
DO $$ BEGIN
  CREATE TYPE billing_interval AS ENUM ('monthly', 'annual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Stripe identifiers
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Subscription details
  tier subscription_tier DEFAULT 'free' NOT NULL,
  status subscription_status DEFAULT 'active' NOT NULL,
  billing_interval billing_interval,

  -- Billing period
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Grace period for existing users (optional)
  grandfathered_until TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- STRIPE EVENTS TABLE (for webhook idempotency)
-- ============================================

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  payload JSONB NOT NULL,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer
  ON subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription
  ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tier
  ON subscriptions(tier);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id
  ON stripe_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type
  ON stripe_events(event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_events_processed
  ON stripe_events(processed);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update/delete subscriptions (webhooks)
CREATE POLICY "Service role manages subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Only service role can access stripe events
CREATE POLICY "Service role manages stripe events"
  ON stripe_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- TRIGGERS
-- ============================================

-- Reuse existing update_updated_at_column function (created in email_reminders migration)
-- If it doesn't exist, create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- AUTO-CREATE SUBSCRIPTION ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_subscription();

-- ============================================
-- MIGRATE EXISTING USERS (Run once after creating table)
-- ============================================

-- Create free subscriptions for all existing users who don't have one
-- Gives them a 90-day grace period to experience premium features
INSERT INTO subscriptions (user_id, tier, status, grandfathered_until)
SELECT
  id,
  'free',
  'active',
  NOW() + INTERVAL '90 days'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- HELPFUL VIEWS (Optional)
-- ============================================

CREATE OR REPLACE VIEW active_premium_users AS
SELECT
  s.user_id,
  u.email,
  s.tier,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.tier = 'premium' AND s.status = 'active';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE subscriptions IS 'User subscription data synced with Stripe';
COMMENT ON TABLE stripe_events IS 'Webhook event log for idempotency and debugging';
COMMENT ON COLUMN subscriptions.grandfathered_until IS 'Existing users get premium features until this date';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'User has cancelled but subscription active until period end';
