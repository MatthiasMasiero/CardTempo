# CardTempo Premium Paywall - Complete Implementation Guide

> This file contains all code needed to implement the Stripe paywall. Copy/paste sections as you implement each phase.

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Database Migration](#2-database-migration)
3. [TypeScript Types](#3-typescript-types)
4. [Stripe Library](#4-stripe-library)
5. [API Routes](#5-api-routes)
6. [Subscription Store](#6-subscription-store)
7. [Auth Store Modifications](#7-auth-store-modifications)
8. [UI Components](#8-ui-components)
9. [Pricing Page](#9-pricing-page)
10. [Feature Gating Examples](#10-feature-gating-examples)
11. [Settings Page Subscription Section](#11-settings-page-subscription-section)
12. [Calculator Card Limit](#12-calculator-card-limit)
13. [Testing](#13-testing)

---

## 1. Environment Variables

Add to `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_MONTHLY=price_monthly_id_from_stripe
STRIPE_PRICE_ID_ANNUAL=price_annual_id_from_stripe

# Public (accessible in browser)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Database Migration

**File: `supabase/migrations/20260111_subscriptions.sql`**

```sql
-- Migration: Subscription System for Premium Paywall
-- Date: 2026-01-11
-- Description: Adds subscription tracking for Stripe integration

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

-- Update timestamp trigger (reuse existing function if available)
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
INSERT INTO subscriptions (user_id, tier, status, grandfathered_until)
SELECT
  id,
  'free',
  'active',
  NOW() + INTERVAL '90 days'  -- 90-day grace period
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
```

---

## 3. TypeScript Types

**Add to `src/types/index.ts`:**

```typescript
// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionTier = 'free' | 'premium';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export type BillingInterval = 'monthly' | 'annual';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  grandfatheredUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Feature flags for each tier
export interface TierFeatures {
  maxCards: number;
  hasWhatIfScenarios: boolean;
  hasPdfExport: boolean;
  hasCalendarExport: boolean;
  hasRecommendations: boolean;
  hasEmailReminders: boolean;
  hasPriorityAllocation: boolean;
  hasAdvancedAnalytics: boolean;
}

// Feature definitions per tier
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    maxCards: 2,
    hasWhatIfScenarios: false,
    hasPdfExport: false,
    hasCalendarExport: false,
    hasRecommendations: false,
    hasEmailReminders: false,
    hasPriorityAllocation: false,
    hasAdvancedAnalytics: false,
  },
  premium: {
    maxCards: Infinity,
    hasWhatIfScenarios: true,
    hasPdfExport: true,
    hasCalendarExport: true,
    hasRecommendations: true,
    hasEmailReminders: true,
    hasPriorityAllocation: true,
    hasAdvancedAnalytics: true,
  },
};

// Subscription plan info for pricing page
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceMonthly: number;  // in cents
  priceAnnual: number;   // in cents
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  features: string[];
}

// Feature descriptions for UI
export const FEATURE_DESCRIPTIONS: Record<keyof TierFeatures, {
  title: string;
  description: string;
  icon: string;
}> = {
  maxCards: {
    title: 'Unlimited Cards',
    description: 'Track all your credit cards in one place',
    icon: 'credit-card',
  },
  hasWhatIfScenarios: {
    title: 'What-If Scenarios',
    description: 'Test financial decisions before making them',
    icon: 'git-branch',
  },
  hasPdfExport: {
    title: 'PDF Export',
    description: 'Download payment plans as professional PDFs',
    icon: 'file-text',
  },
  hasCalendarExport: {
    title: 'Calendar Sync',
    description: 'Export payment dates to your calendar',
    icon: 'calendar',
  },
  hasRecommendations: {
    title: 'Card Recommendations',
    description: 'Get personalized credit card suggestions',
    icon: 'sparkles',
  },
  hasEmailReminders: {
    title: 'Email Reminders',
    description: 'Never miss a payment with smart reminders',
    icon: 'bell',
  },
  hasPriorityAllocation: {
    title: 'Smart Allocation',
    description: 'Optimize payment distribution across cards',
    icon: 'trending-up',
  },
  hasAdvancedAnalytics: {
    title: 'Advanced Analytics',
    description: 'Deep insights into your credit health',
    icon: 'bar-chart',
  },
};
```

---

## 4. Stripe Library

**Create `src/lib/stripe.ts`:**

```typescript
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Plan configuration
export const PLANS = {
  premium: {
    monthly: {
      priceId: process.env.STRIPE_PRICE_ID_MONTHLY!,
      amount: 999, // $9.99 in cents
    },
    annual: {
      priceId: process.env.STRIPE_PRICE_ID_ANNUAL!,
      amount: 7999, // $79.99 in cents
    },
  },
} as const;

// Supabase client with service role for subscription management
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Get existing Stripe customer or create a new one
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const supabase = getServiceSupabase();

  // Check if user already has a Stripe customer ID
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  // Save customer ID to database
  await supabase
    .from('subscriptions')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId);

  return customer.id;
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?upgrade=canceled`,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  });
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });
}

/**
 * Get subscription details from Stripe
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('[Stripe] Error fetching subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
```

---

## 5. API Routes

### 5a. Checkout Route

**Create `src/app/api/stripe/checkout/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  PLANS
} from '@/lib/stripe';

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'annual']),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = checkoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { interval } = validationResult.data;

    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email!);

    // Create checkout session
    const priceId = PLANS.premium[interval].priceId;
    const session = await createCheckoutSession(customerId, priceId, user.id);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('[Checkout] Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### 5b. Customer Portal Route

**Create `src/app/api/stripe/portal/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID from database
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: subscription } = await serviceSupabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // Create portal session
    const session = await createPortalSession(subscription.stripe_customer_id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Portal] Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

### 5c. Webhook Handler

**Create `src/app/api/webhooks/stripe/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

// Stripe events we care about
const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

// Disable body parsing - Stripe needs raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Initialize Supabase with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check for duplicate event (idempotency)
  const { data: existingEvent } = await supabase
    .from('stripe_events')
    .select('id, processed')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent) {
    console.log('[Webhook] Duplicate event, skipping:', event.id);
    return NextResponse.json({
      received: true,
      duplicate: true,
      processed: existingEvent.processed,
    });
  }

  // Log event for idempotency and debugging
  await supabase.from('stripe_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event,
    processed: false,
  });

  // Process relevant events
  if (RELEVANT_EVENTS.has(event.type)) {
    try {
      await handleStripeEvent(event, supabase);

      // Mark as processed
      await supabase
        .from('stripe_events')
        .update({ processed: true })
        .eq('stripe_event_id', event.id);

      console.log('[Webhook] Successfully processed:', event.type, event.id);
    } catch (error) {
      console.error('[Webhook] Error processing event:', error);

      // Log error but don't fail - Stripe will retry
      await supabase
        .from('stripe_events')
        .update({ error: String(error) })
        .eq('stripe_event_id', event.id);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>
) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session, supabase);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription, supabase);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription, supabase);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice, supabase);
      break;
    }
  }
}

async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createClient>
) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('[Webhook] No userId in checkout session metadata');
    return;
  }

  console.log('[Webhook] Checkout complete for user:', userId);

  // Fetch subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const interval = subscription.items.data[0]?.price.recurring?.interval;

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier: 'premium',
      status: subscription.status as string,
      billing_interval: interval === 'year' ? 'annual' : 'monthly',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      grandfathered_until: null, // Remove grace period on upgrade
    })
    .eq('user_id', userId);
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by Stripe customer ID
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!existingSub) {
      console.error('[Webhook] Cannot find user for subscription:', subscription.id);
      return;
    }

    await updateSubscription(existingSub.user_id, subscription, supabase);
  } else {
    await updateSubscription(userId, subscription, supabase);
  }
}

async function updateSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
) {
  const interval = subscription.items.data[0]?.price.recurring?.interval;
  const isActive = ['active', 'trialing'].includes(subscription.status);

  await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      tier: isActive ? 'premium' : 'free',
      status: subscription.status as string,
      billing_interval: interval === 'year' ? 'annual' : 'monthly',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq('user_id', userId);

  console.log('[Webhook] Updated subscription for user:', userId, 'status:', subscription.status);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
) {
  // Downgrade to free tier
  await supabase
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log('[Webhook] Subscription deleted:', subscription.id);
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof createClient>
) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', subscriptionId);

  console.log('[Webhook] Payment failed for subscription:', subscriptionId);

  // TODO: Send email notification about failed payment
}
```

---

## 6. Subscription Store

**Create `src/store/subscription-store.ts`:**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Subscription,
  SubscriptionTier,
  TierFeatures,
  TIER_FEATURES
} from '@/types';
import { supabase } from '@/lib/supabase';

interface SubscriptionState {
  // State
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;

  // Derived state (computed from subscription)
  tier: SubscriptionTier;
  features: TierFeatures;
  isPremium: boolean;
  isGrandfathered: boolean;

  // Actions
  loadSubscription: (userId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  clearSubscription: () => void;

  // Feature checks
  canAddCard: (currentCardCount: number) => boolean;
  canAccessFeature: (feature: keyof TierFeatures) => boolean;
  getRemainingCards: (currentCardCount: number) => number;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      subscription: null,
      isLoading: false,
      error: null,
      tier: 'free',
      features: TIER_FEATURES.free,
      isPremium: false,
      isGrandfathered: false,

      loadSubscription: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            // User might not have subscription row yet
            if (error.code === 'PGRST116') {
              set({
                subscription: null,
                tier: 'free',
                features: TIER_FEATURES.free,
                isPremium: false,
                isGrandfathered: false,
                isLoading: false,
              });
              return;
            }
            throw error;
          }

          // Check if grandfathered (grace period)
          const isGrandfathered = data.grandfathered_until
            ? new Date(data.grandfathered_until) > new Date()
            : false;

          // Determine effective tier
          const effectiveTier: SubscriptionTier =
            data.tier === 'premium' || isGrandfathered
              ? 'premium'
              : 'free';

          // Map database fields to TypeScript interface
          const subscription: Subscription = {
            id: data.id,
            userId: data.user_id,
            stripeCustomerId: data.stripe_customer_id,
            stripeSubscriptionId: data.stripe_subscription_id,
            tier: data.tier,
            status: data.status,
            billingInterval: data.billing_interval,
            currentPeriodStart: data.current_period_start
              ? new Date(data.current_period_start)
              : null,
            currentPeriodEnd: data.current_period_end
              ? new Date(data.current_period_end)
              : null,
            cancelAtPeriodEnd: data.cancel_at_period_end,
            canceledAt: data.canceled_at
              ? new Date(data.canceled_at)
              : null,
            grandfatheredUntil: data.grandfathered_until
              ? new Date(data.grandfathered_until)
              : null,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };

          set({
            subscription,
            tier: effectiveTier,
            features: TIER_FEATURES[effectiveTier],
            isPremium: effectiveTier === 'premium',
            isGrandfathered,
            isLoading: false,
          });
        } catch (error) {
          console.error('[SubscriptionStore] Error loading subscription:', error);
          set({
            error: String(error),
            isLoading: false,
            tier: 'free',
            features: TIER_FEATURES.free,
            isPremium: false,
          });
        }
      },

      refreshSubscription: async () => {
        const { subscription } = get();
        if (subscription?.userId) {
          await get().loadSubscription(subscription.userId);
        }
      },

      clearSubscription: () => {
        set({
          subscription: null,
          tier: 'free',
          features: TIER_FEATURES.free,
          isPremium: false,
          isGrandfathered: false,
          error: null,
        });
      },

      canAddCard: (currentCardCount: number) => {
        const { features } = get();
        return currentCardCount < features.maxCards;
      },

      canAccessFeature: (feature: keyof TierFeatures) => {
        const { features } = get();
        const value = features[feature];

        // Handle boolean features
        if (typeof value === 'boolean') {
          return value;
        }

        // Handle numeric features (like maxCards)
        return value > 0;
      },

      getRemainingCards: (currentCardCount: number) => {
        const { features } = get();
        if (features.maxCards === Infinity) {
          return Infinity;
        }
        return Math.max(0, features.maxCards - currentCardCount);
      },
    }),
    {
      name: 'subscription-storage',
      // Only persist minimal data for quick hydration
      partialize: (state) => ({
        tier: state.tier,
        isPremium: state.isPremium,
        isGrandfathered: state.isGrandfathered,
      }),
    }
  )
);
```

---

## 7. Auth Store Modifications

**Modify `src/store/auth-store.ts`:**

Add these imports at the top:

```typescript
// Add this import
import { useSubscriptionStore } from './subscription-store';
```

In the `login` function, after setting the user state, add:

```typescript
// After: set({ user, isAuthenticated: true, isLoading: false });

// Load subscription data
if (typeof window !== 'undefined') {
  useSubscriptionStore.getState().loadSubscription(user.id);
}
```

In the `signup` function (after email is confirmed and user is set), add:

```typescript
// After: set({ user, isAuthenticated: true, isLoading: false });

// Load subscription data (will create free tier)
if (typeof window !== 'undefined') {
  useSubscriptionStore.getState().loadSubscription(user.id);
}
```

In the `logout` function, add:

```typescript
// After: set({ user: null, isAuthenticated: false });

// Clear subscription data
if (typeof window !== 'undefined') {
  useSubscriptionStore.getState().clearSubscription();
}
```

In the `checkSession` function, after setting the user, add:

```typescript
// After: set({ user, isAuthenticated: true });

// Load subscription data
if (typeof window !== 'undefined') {
  useSubscriptionStore.getState().loadSubscription(user.id);
}
```

---

## 8. UI Components

### 8a. PremiumGate Component

**Create `src/components/PremiumGate.tsx`:**

```typescript
'use client';

import { ReactNode } from 'react';
import { useSubscriptionStore } from '@/store/subscription-store';
import { TierFeatures } from '@/types';
import { UpgradePrompt } from './UpgradePrompt';

interface PremiumGateProps {
  /** The feature to check access for */
  feature: keyof TierFeatures;
  /** Content to render if user has access */
  children: ReactNode;
  /** Custom fallback content (overrides default upgrade prompt) */
  fallback?: ReactNode;
  /** Whether to show upgrade prompt when blocked (default: true) */
  showUpgradePrompt?: boolean;
  /** Custom title for upgrade prompt */
  promptTitle?: string;
  /** Custom description for upgrade prompt */
  promptDescription?: string;
  /** Prompt variant */
  promptVariant?: 'card' | 'inline' | 'banner';
}

export function PremiumGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  promptTitle,
  promptDescription,
  promptVariant = 'card',
}: PremiumGateProps) {
  const { canAccessFeature } = useSubscriptionStore();

  // User has access - render children
  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        feature={feature}
        title={promptTitle}
        description={promptDescription}
        variant={promptVariant}
      />
    );
  }

  // No fallback, no prompt - render nothing
  return null;
}
```

### 8b. UpgradePrompt Component

**Create `src/components/UpgradePrompt.tsx`:**

```typescript
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Crown,
  Lock,
  Sparkles,
  CreditCard,
  GitBranch,
  FileText,
  Calendar,
  Bell,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { TierFeatures, FEATURE_DESCRIPTIONS } from '@/types';

const FEATURE_ICONS: Record<keyof TierFeatures, React.ReactNode> = {
  maxCards: <CreditCard className="h-6 w-6" />,
  hasWhatIfScenarios: <GitBranch className="h-6 w-6" />,
  hasPdfExport: <FileText className="h-6 w-6" />,
  hasCalendarExport: <Calendar className="h-6 w-6" />,
  hasRecommendations: <Sparkles className="h-6 w-6" />,
  hasEmailReminders: <Bell className="h-6 w-6" />,
  hasPriorityAllocation: <TrendingUp className="h-6 w-6" />,
  hasAdvancedAnalytics: <BarChart3 className="h-6 w-6" />,
};

interface UpgradePromptProps {
  /** Feature that triggered the prompt */
  feature?: keyof TierFeatures;
  /** Custom title (overrides feature title) */
  title?: string;
  /** Custom description (overrides feature description) */
  description?: string;
  /** Visual variant */
  variant?: 'card' | 'inline' | 'banner';
  /** Custom CTA text */
  ctaText?: string;
}

export function UpgradePrompt({
  feature,
  title,
  description,
  variant = 'card',
  ctaText = 'Upgrade to Premium',
}: UpgradePromptProps) {
  const featureInfo = feature ? FEATURE_DESCRIPTIONS[feature] : null;
  const displayTitle = title || featureInfo?.title || 'Premium Feature';
  const displayDescription =
    description || featureInfo?.description || 'Upgrade to unlock this feature';
  const Icon = feature ? FEATURE_ICONS[feature] : <Lock className="h-6 w-6" />;

  // Banner variant - horizontal, compact
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-amber-600">{Icon}</div>
          <div>
            <p className="font-medium text-amber-900">{displayTitle}</p>
            <p className="text-sm text-amber-700">{displayDescription}</p>
          </div>
        </div>
        <Link href="/pricing">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 gap-2">
            <Crown className="h-4 w-4" />
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  // Inline variant - minimal, inline with content
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span className="text-sm">{displayTitle}</span>
        <Link href="/pricing" className="text-sm text-primary hover:underline">
          Upgrade
        </Link>
      </div>
    );
  }

  // Card variant - default, centered, prominent
  return (
    <Card className="border-dashed border-2 border-muted bg-muted/30">
      <CardContent className="p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4 text-amber-600">
          {Icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{displayTitle}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {displayDescription}
        </p>
        <Link href="/pricing">
          <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Sparkles className="h-4 w-4" />
            {ctaText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

### 8c. PremiumBadge Component

**Create `src/components/PremiumBadge.tsx`:**

```typescript
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function PremiumBadge({
  className = '',
  size = 'md',
  showIcon = true,
}: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      className={cn(
        'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200 hover:from-amber-200 hover:to-orange-200',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Crown className={cn(iconSizes[size], 'mr-1')} />}
      Premium
    </Badge>
  );
}
```

### 8d. CardLimitBanner Component

**Create `src/components/CardLimitBanner.tsx`:**

```typescript
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscription-store';

interface CardLimitBannerProps {
  currentCardCount: number;
}

export function CardLimitBanner({ currentCardCount }: CardLimitBannerProps) {
  const { features, isPremium, getRemainingCards } = useSubscriptionStore();
  const remaining = getRemainingCards(currentCardCount);
  const isAtLimit = remaining === 0;

  // Premium users or users with remaining slots don't need to see this
  if (isPremium || remaining > 1) {
    return null;
  }

  // Warning when approaching limit (1 slot left)
  if (remaining === 1) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-900">
            One card slot remaining
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Free accounts can track up to {features.maxCards} cards.
            Upgrade for unlimited cards.
          </p>
        </div>
        <Link href="/pricing">
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  // At limit - can't add more
  if (isAtLimit) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
        <Crown className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-900">
            Card limit reached
          </p>
          <p className="text-sm text-amber-700 mt-1">
            You&apos;ve reached the {features.maxCards}-card limit on the free plan.
            Upgrade to Premium for unlimited cards and advanced features.
          </p>
        </div>
        <Link href="/pricing">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 gap-2">
            <Crown className="h-4 w-4" />
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
```

---

## 9. Pricing Page

**Create `src/app/pricing/page.tsx`:**

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { TIER_FEATURES, FEATURE_DESCRIPTIONS, TierFeatures } from '@/types';
import {
  Check,
  X,
  Crown,
  Loader2,
  Sparkles,
  CreditCard,
  GitBranch,
  FileText,
  Calendar,
  Bell,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

const MONTHLY_PRICE = 9.99;
const ANNUAL_PRICE = 79.99;
const ANNUAL_MONTHLY_EQUIVALENT = ANNUAL_PRICE / 12;
const ANNUAL_SAVINGS = Math.round(((MONTHLY_PRICE * 12 - ANNUAL_PRICE) / (MONTHLY_PRICE * 12)) * 100);

const FEATURE_ICONS: Record<keyof TierFeatures, React.ReactNode> = {
  maxCards: <CreditCard className="h-5 w-5" />,
  hasWhatIfScenarios: <GitBranch className="h-5 w-5" />,
  hasPdfExport: <FileText className="h-5 w-5" />,
  hasCalendarExport: <Calendar className="h-5 w-5" />,
  hasRecommendations: <Sparkles className="h-5 w-5" />,
  hasEmailReminders: <Bell className="h-5 w-5" />,
  hasPriorityAllocation: <TrendingUp className="h-5 w-5" />,
  hasAdvancedAnalytics: <BarChart3 className="h-5 w-5" />,
};

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { isPremium, tier } = useSubscriptionStore();

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      // Redirect to signup with return URL
      window.location.href = '/signup?redirect=/pricing';
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interval: isAnnual ? 'annual' : 'monthly'
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error('Checkout error:', error);
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(false);
    }
  };

  const features: Array<{ key: keyof TierFeatures; free: string; premium: string }> = [
    { key: 'maxCards', free: '2 cards', premium: 'Unlimited' },
    { key: 'hasWhatIfScenarios', free: '', premium: 'Included' },
    { key: 'hasPdfExport', free: '', premium: 'Included' },
    { key: 'hasCalendarExport', free: '', premium: 'Included' },
    { key: 'hasRecommendations', free: '', premium: 'Included' },
    { key: 'hasEmailReminders', free: '', premium: 'Included' },
    { key: 'hasPriorityAllocation', free: '', premium: 'Included' },
    { key: 'hasAdvancedAnalytics', free: '', premium: 'Included' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works for you. Upgrade anytime to unlock
            powerful features that help you optimize your credit score.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Label
            htmlFor="billing-toggle"
            className={!isAnnual ? 'font-semibold' : 'text-muted-foreground'}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label
            htmlFor="billing-toggle"
            className={isAnnual ? 'font-semibold' : 'text-muted-foreground'}
          >
            Annual
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Save {ANNUAL_SAVINGS}%
            </span>
          </Label>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>
                Get started with basic credit optimization
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map(({ key, free }) => (
                  <li key={key} className="flex items-center gap-3">
                    {free ? (
                      <>
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="flex items-center gap-2">
                          {FEATURE_ICONS[key]}
                          <span>{FEATURE_DESCRIPTIONS[key].title}</span>
                          <span className="text-muted-foreground text-sm">
                            ({free})
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                        <span className="flex items-center gap-2 text-muted-foreground/70">
                          {FEATURE_ICONS[key]}
                          <span>{FEATURE_DESCRIPTIONS[key].title}</span>
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {tier === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Link href="/signup" className="block">
                    <Button variant="outline" className="w-full">
                      Get Started Free
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-amber-300 shadow-lg">
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                Most Popular
              </span>
            </div>

            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" />
                Premium
              </CardTitle>
              <CardDescription>
                Everything you need to maximize your credit score
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${isAnnual ? ANNUAL_MONTHLY_EQUIVALENT.toFixed(2) : MONTHLY_PRICE}
                </span>
                <span className="text-muted-foreground">/month</span>
                {isAnnual && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Billed annually (${ANNUAL_PRICE}/year)
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map(({ key, premium }) => (
                  <li key={key} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="flex items-center gap-2">
                      {FEATURE_ICONS[key]}
                      <span>{FEATURE_DESCRIPTIONS[key].title}</span>
                      {key === 'maxCards' && (
                        <span className="text-amber-600 text-sm font-medium">
                          ({premium})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {isPremium ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    onClick={handleUpgrade}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Upgrade to Premium
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Questions? Check our{' '}
            <Link href="/faq" className="text-primary hover:underline">
              FAQ
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 10. Feature Gating Examples

### Calculator Page - Card Limit Check

**Modify `src/app/calculator/page.tsx`:**

```typescript
// Add imports
import { useSubscriptionStore } from '@/store/subscription-store';
import { CardLimitBanner } from '@/components/CardLimitBanner';

// Inside the component:
const { canAddCard, features } = useSubscriptionStore();
const cards = useCalculatorStore((state) => state.cards);

// Before the form, show limit banner
<CardLimitBanner currentCardCount={cards.length} />

// Modify the add card handler
const handleAddCard = (formData: CreditCardFormData) => {
  if (!canAddCard(cards.length)) {
    // Show toast or redirect to pricing
    toast.error(`Free plan limited to ${features.maxCards} cards. Upgrade for unlimited.`);
    return;
  }
  // ... existing add card logic
};

// Disable form when at limit
<CreditCardForm
  onSubmit={handleAddCard}
  disabled={!canAddCard(cards.length)}
/>
```

### Results Page - Export Buttons

**Modify `src/app/results/page.tsx`:**

```typescript
import { PremiumGate } from '@/components/PremiumGate';
import { PremiumBadge } from '@/components/PremiumBadge';
import { useSubscriptionStore } from '@/store/subscription-store';

// In the export buttons section:
const { canAccessFeature } = useSubscriptionStore();

// PDF Export
<PremiumGate
  feature="hasPdfExport"
  showUpgradePrompt={false}
  fallback={
    <Button variant="outline" disabled className="gap-2 opacity-60">
      <FileText className="h-4 w-4" />
      PDF Export
      <PremiumBadge size="sm" />
    </Button>
  }
>
  <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
    <Download className="h-4 w-4" />
    Download PDF
  </Button>
</PremiumGate>

// Calendar Export
<PremiumGate
  feature="hasCalendarExport"
  showUpgradePrompt={false}
  fallback={
    <Button variant="outline" disabled className="gap-2 opacity-60">
      <Calendar className="h-4 w-4" />
      Calendar
      <PremiumBadge size="sm" />
    </Button>
  }
>
  <Button variant="outline" onClick={handleCalendarExport} className="gap-2">
    <Calendar className="h-4 w-4" />
    Add to Calendar
  </Button>
</PremiumGate>
```

### Dashboard - Feature Links

**Modify `src/app/dashboard/page.tsx`:**

```typescript
import { PremiumGate } from '@/components/PremiumGate';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Lock } from 'lucide-react';

// Quick Actions section
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* What-If Scenarios */}
  <PremiumGate
    feature="hasWhatIfScenarios"
    showUpgradePrompt={false}
    fallback={
      <Card className="opacity-70 cursor-not-allowed">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <span>What-If Scenarios</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <PremiumBadge size="sm" />
          </div>
        </CardContent>
      </Card>
    }
  >
    <Link href="/dashboard/scenarios">
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardContent className="p-6 flex items-center gap-3">
          <GitBranch className="h-5 w-5" />
          <span>What-If Scenarios</span>
        </CardContent>
      </Card>
    </Link>
  </PremiumGate>

  {/* Priority Allocation */}
  <PremiumGate
    feature="hasPriorityAllocation"
    showUpgradePrompt={false}
    fallback={
      <Card className="opacity-70 cursor-not-allowed">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span>Smart Allocation</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <PremiumBadge size="sm" />
          </div>
        </CardContent>
      </Card>
    }
  >
    <Link href="/dashboard/priority">
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardContent className="p-6 flex items-center gap-3">
          <TrendingUp className="h-5 w-5" />
          <span>Smart Allocation</span>
        </CardContent>
      </Card>
    </Link>
  </PremiumGate>
</div>
```

### Full Page Gate - Scenarios

**Modify `src/app/dashboard/scenarios/page.tsx`:**

```typescript
import { PremiumGate } from '@/components/PremiumGate';

export default function ScenariosPage() {
  return (
    <PremiumGate
      feature="hasWhatIfScenarios"
      promptTitle="What-If Scenarios"
      promptDescription="Test different financial decisions and see exactly how they'll impact your credit score — before you make them. Simulate purchases, balance transfers, credit limit increases, and more."
    >
      {/* Existing scenarios page content */}
      <div>
        {/* ... */}
      </div>
    </PremiumGate>
  );
}
```

### Full Page Gate - Recommendations

**Modify `src/app/recommendations/page.tsx`:**

```typescript
import { PremiumGate } from '@/components/PremiumGate';

export default function RecommendationsPage() {
  return (
    <PremiumGate
      feature="hasRecommendations"
      promptTitle="Card Recommendations"
      promptDescription="Get personalized credit card recommendations based on your spending habits, credit score, and financial goals. Find the perfect cards to maximize your rewards."
    >
      {/* Existing recommendations page content */}
      <div>
        {/* ... */}
      </div>
    </PremiumGate>
  );
}
```

---

## 11. Settings Page Subscription Section

**Add to `src/app/settings/page.tsx`:**

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscriptionStore } from '@/store/subscription-store';
import { PremiumBadge } from '@/components/PremiumBadge';
import { Crown, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

function SubscriptionSection() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    subscription,
    isPremium,
    isGrandfathered,
    tier
  } = useSubscriptionStore();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const { url, error } = await response.json();

      if (error) {
        console.error('Portal error:', error);
        setIsLoading(false);
        return;
      }

      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Subscription
          {isPremium && <PremiumBadge />}
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPremium ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold">CardTempo Premium</p>
                <p className="text-sm text-muted-foreground">
                  {isGrandfathered ? (
                    <>Grace period until {format(subscription?.grandfatheredUntil!, 'MMM d, yyyy')}</>
                  ) : subscription?.billingInterval === 'annual' ? (
                    'Annual plan'
                  ) : (
                    'Monthly plan'
                  )}
                </p>
              </div>
            </div>

            {subscription?.cancelAtPeriodEnd && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Your subscription will end on{' '}
                {format(subscription.currentPeriodEnd!, 'MMMM d, yyyy')}.
                You can reactivate anytime before then.
              </div>
            )}

            {!isGrandfathered && subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd
                  ? 'Access until'
                  : 'Next billing date'}: {format(subscription.currentPeriodEnd, 'MMMM d, yyyy')}
              </p>
            )}

            {!isGrandfathered && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Crown className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Free Plan</p>
                <p className="text-sm text-muted-foreground">
                  Limited to 2 credit cards
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Upgrade to Premium to unlock unlimited cards, what-if scenarios,
              PDF exports, and more.
            </p>

            <Link href="/pricing">
              <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Crown className="h-4 w-4" />
                Upgrade to Premium
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Add <SubscriptionSection /> to your settings page layout
```

---

## 12. Calculator Card Limit

**Modify `src/store/calculator-store.ts`:**

Add validation to the `addCard` function:

```typescript
// Add import at top
import { useSubscriptionStore } from './subscription-store';

// In the addCard function, add this check at the beginning:
addCard: async (card) => {
  const { currentUserId, cards } = get();

  // Check card limit for subscription tier
  const { canAddCard, features } = useSubscriptionStore.getState();
  if (!canAddCard(cards.length)) {
    console.warn('[CalculatorStore] Card limit reached for tier');
    throw new Error(`Free plan limited to ${features.maxCards} cards. Upgrade for unlimited.`);
  }

  // ... rest of existing addCard logic
}
```

---

## 13. Testing

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Listen for webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test Commands

```bash
# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed

# Test specific scenarios
stripe trigger customer.subscription.updated --override subscription:status=past_due
```

### Unit Test Example

**Create `src/store/__tests__/subscription-store.test.ts`:**

```typescript
import { useSubscriptionStore } from '../subscription-store';
import { TIER_FEATURES } from '@/types';

describe('useSubscriptionStore', () => {
  beforeEach(() => {
    useSubscriptionStore.setState({
      subscription: null,
      tier: 'free',
      features: TIER_FEATURES.free,
      isPremium: false,
      isGrandfathered: false,
    });
  });

  describe('canAddCard', () => {
    test('returns true when under limit', () => {
      const { canAddCard } = useSubscriptionStore.getState();
      expect(canAddCard(0)).toBe(true);
      expect(canAddCard(1)).toBe(true);
    });

    test('returns false when at limit', () => {
      const { canAddCard } = useSubscriptionStore.getState();
      expect(canAddCard(2)).toBe(false);
      expect(canAddCard(5)).toBe(false);
    });

    test('premium users can add unlimited cards', () => {
      useSubscriptionStore.setState({
        tier: 'premium',
        features: TIER_FEATURES.premium,
        isPremium: true,
      });

      const { canAddCard } = useSubscriptionStore.getState();
      expect(canAddCard(100)).toBe(true);
    });
  });

  describe('canAccessFeature', () => {
    test('free tier cannot access premium features', () => {
      const { canAccessFeature } = useSubscriptionStore.getState();
      expect(canAccessFeature('hasWhatIfScenarios')).toBe(false);
      expect(canAccessFeature('hasPdfExport')).toBe(false);
      expect(canAccessFeature('hasRecommendations')).toBe(false);
    });

    test('premium tier can access all features', () => {
      useSubscriptionStore.setState({
        tier: 'premium',
        features: TIER_FEATURES.premium,
        isPremium: true,
      });

      const { canAccessFeature } = useSubscriptionStore.getState();
      expect(canAccessFeature('hasWhatIfScenarios')).toBe(true);
      expect(canAccessFeature('hasPdfExport')).toBe(true);
      expect(canAccessFeature('hasRecommendations')).toBe(true);
    });
  });

  describe('getRemainingCards', () => {
    test('calculates remaining slots correctly', () => {
      const { getRemainingCards } = useSubscriptionStore.getState();
      expect(getRemainingCards(0)).toBe(2);
      expect(getRemainingCards(1)).toBe(1);
      expect(getRemainingCards(2)).toBe(0);
    });

    test('premium users have infinite remaining', () => {
      useSubscriptionStore.setState({
        tier: 'premium',
        features: TIER_FEATURES.premium,
        isPremium: true,
      });

      const { getRemainingCards } = useSubscriptionStore.getState();
      expect(getRemainingCards(100)).toBe(Infinity);
    });
  });
});
```

### E2E Test Example

**Create `e2e/subscription.spec.ts`:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Subscription Flow', () => {
  test('free user sees card limit banner', async ({ page }) => {
    // Login as free user
    await page.goto('/login');
    await page.fill('[name="email"]', 'free@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to calculator
    await page.goto('/calculator');

    // Add 2 cards (at limit)
    // ... add card logic

    // Should see limit banner
    await expect(page.getByText('Card limit reached')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Upgrade' })).toBeVisible();
  });

  test('free user sees upgrade prompts on premium features', async ({ page }) => {
    await page.goto('/dashboard/scenarios');

    // Should see upgrade prompt instead of scenarios
    await expect(page.getByText('What-If Scenarios')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Upgrade to Premium' })).toBeVisible();
  });

  test('pricing page displays correct plans', async ({ page }) => {
    await page.goto('/pricing');

    // Free plan
    await expect(page.getByText('$0')).toBeVisible();
    await expect(page.getByText('2 cards')).toBeVisible();

    // Premium plan
    await expect(page.getByText('Premium')).toBeVisible();
    await expect(page.getByText('Unlimited')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upgrade to Premium' })).toBeVisible();
  });
});
```

---

## Stripe Dashboard Checklist

1. [ ] Create Product: "CardTempo Premium"
2. [ ] Create Monthly Price: $9.99/month
3. [ ] Create Annual Price: $79.99/year
4. [ ] Configure Customer Portal
   - Allow customers to cancel
   - Allow customers to update payment method
   - Allow plan changes (if multiple tiers later)
5. [ ] Create Webhook Endpoint
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
6. [ ] Copy API keys to `.env.local`

---

## Implementation Order

1. **Environment variables** - Add Stripe keys
2. **Database migration** - Run `supabase db push`
3. **Types** - Add subscription types to `src/types/index.ts`
4. **Stripe library** - Create `src/lib/stripe.ts`
5. **Subscription store** - Create `src/store/subscription-store.ts`
6. **Auth store** - Modify to load subscription
7. **API routes** - Create checkout, portal, webhook handlers
8. **UI components** - PremiumGate, UpgradePrompt, PremiumBadge
9. **Pricing page** - Create `/pricing`
10. **Feature gating** - Apply gates to calculator, results, dashboard, etc.
11. **Settings** - Add subscription management section
12. **Testing** - Unit and E2E tests

---

## Quick Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20260111_subscriptions.sql` | Database schema |
| `src/types/index.ts` | TypeScript types |
| `src/lib/stripe.ts` | Stripe client & helpers |
| `src/store/subscription-store.ts` | Subscription state |
| `src/app/api/stripe/checkout/route.ts` | Create checkout session |
| `src/app/api/stripe/portal/route.ts` | Customer portal |
| `src/app/api/webhooks/stripe/route.ts` | Webhook handler |
| `src/components/PremiumGate.tsx` | Feature gating component |
| `src/components/UpgradePrompt.tsx` | Upgrade CTA |
| `src/components/PremiumBadge.tsx` | Premium badge |
| `src/app/pricing/page.tsx` | Pricing page |
