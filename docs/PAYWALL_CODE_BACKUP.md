# Paywall Code Backup

> All paywall-specific code from Payment branch. Copy these to re-implement after resetting to main.

---

## Files to CREATE (new files)

### 1. `src/lib/stripe.ts`
```typescript
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe client (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
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
// This bypasses RLS for webhook operations
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
 * Allows users to manage their subscription, update payment method, etc.
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
 * User keeps access until current billing period ends
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

### 2. `src/store/subscription-store.ts`
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
  tier: SubscriptionTier;
  features: TierFeatures;
  isPremium: boolean;
  isGrandfathered: boolean;

  // Actions
  loadSubscription: (userId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  clearSubscription: () => void;

  // Helpers
  canAddCard: (currentCardCount: number) => boolean;
  canAccessFeature: (feature: keyof TierFeatures) => boolean;
  getRemainingCards: (currentCardCount: number) => number;
}

// Store the current user ID for refresh functionality
let currentUserId: string | null = null;

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state - defaults to free tier
      subscription: null,
      isLoading: false,
      tier: 'free',
      features: TIER_FEATURES.free,
      isPremium: false,
      isGrandfathered: false,

      loadSubscription: async (userId: string) => {
        currentUserId = userId;
        set({ isLoading: true });

        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.error('[SubscriptionStore] Error loading subscription:', error);
            // User might not have a subscription record yet - treat as free
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

          // Map database fields to TypeScript interface
          const subscription: Subscription = {
            id: data.id,
            userId: data.user_id,
            stripeCustomerId: data.stripe_customer_id,
            stripeSubscriptionId: data.stripe_subscription_id,
            tier: data.tier,
            status: data.status,
            billingInterval: data.billing_interval,
            currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : null,
            currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
            cancelAtPeriodEnd: data.cancel_at_period_end,
            canceledAt: data.canceled_at ? new Date(data.canceled_at) : null,
            grandfatheredUntil: data.grandfathered_until ? new Date(data.grandfathered_until) : null,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };

          // Determine effective tier (check grandfathered status)
          const isGrandfathered = subscription.grandfatheredUntil
            ? new Date() < subscription.grandfatheredUntil
            : false;

          // User gets premium features if:
          // 1. They have an active premium subscription, OR
          // 2. They're in their grandfathered period
          const effectiveTier: SubscriptionTier =
            (subscription.tier === 'premium' && subscription.status === 'active') || isGrandfathered
              ? 'premium'
              : 'free';

          const isPremium = effectiveTier === 'premium';

          set({
            subscription,
            tier: effectiveTier,
            features: TIER_FEATURES[effectiveTier],
            isPremium,
            isGrandfathered,
            isLoading: false,
          });
        } catch (error) {
          console.error('[SubscriptionStore] Unexpected error:', error);
          set({
            subscription: null,
            tier: 'free',
            features: TIER_FEATURES.free,
            isPremium: false,
            isGrandfathered: false,
            isLoading: false,
          });
        }
      },

      refreshSubscription: async () => {
        if (currentUserId) {
          await get().loadSubscription(currentUserId);
        }
      },

      clearSubscription: () => {
        currentUserId = null;
        set({
          subscription: null,
          tier: 'free',
          features: TIER_FEATURES.free,
          isPremium: false,
          isGrandfathered: false,
          isLoading: false,
        });
      },

      canAddCard: (currentCardCount: number) => {
        const { features } = get();
        return currentCardCount < features.maxCards;
      },

      canAccessFeature: (feature: keyof TierFeatures) => {
        const value = get().features[feature];
        // For boolean features, return the value directly
        // For number features (like maxCards), check if > 0
        return typeof value === 'boolean' ? value : value > 0;
      },

      getRemainingCards: (currentCardCount: number) => {
        const { features } = get();
        if (features.maxCards === Infinity) return Infinity;
        return Math.max(0, features.maxCards - currentCardCount);
      },
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        subscription: state.subscription,
        tier: state.tier,
        features: state.features,
        isPremium: state.isPremium,
        isGrandfathered: state.isGrandfathered,
      }),
    }
  )
);
```

### 3. `src/components/PremiumGate.tsx`
```typescript
'use client';

import { ReactNode } from 'react';
import { useSubscriptionStore } from '@/store/subscription-store';
import { TierFeatures, FEATURE_DESCRIPTIONS } from '@/types';
import { UpgradePrompt } from './UpgradePrompt';

interface PremiumGateProps {
  /** The feature to check access for */
  feature: keyof TierFeatures;
  /** Content to show when user has access */
  children: ReactNode;
  /** Custom fallback when access is denied (defaults to UpgradePrompt) */
  fallback?: ReactNode;
  /** Variant of the default upgrade prompt */
  promptVariant?: 'card' | 'inline' | 'banner';
}

/**
 * Conditionally renders children based on subscription tier.
 * Shows an upgrade prompt if the user doesn't have access to the feature.
 *
 * @example
 * <PremiumGate feature="hasWhatIfScenarios">
 *   <ScenariosContent />
 * </PremiumGate>
 *
 * @example
 * <PremiumGate feature="hasPdfExport" fallback={<DisabledButton />}>
 *   <ExportButton />
 * </PremiumGate>
 */
export function PremiumGate({
  feature,
  children,
  fallback,
  promptVariant = 'card',
}: PremiumGateProps) {
  const { canAccessFeature } = useSubscriptionStore();

  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Use custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Get feature info for the upgrade prompt
  const featureInfo = FEATURE_DESCRIPTIONS[feature];

  return (
    <UpgradePrompt
      variant={promptVariant}
      feature={featureInfo.title}
      description={featureInfo.description}
    />
  );
}

interface PremiumGateForCardsProps {
  /** Current number of cards the user has */
  currentCardCount: number;
  /** Content to show when user can add more cards */
  children: ReactNode;
  /** Custom fallback when at card limit */
  fallback?: ReactNode;
}

/**
 * Special gate for the card limit feature.
 * Shows upgrade prompt when user has reached their card limit.
 */
export function PremiumGateForCards({
  currentCardCount,
  children,
  fallback,
}: PremiumGateForCardsProps) {
  const { canAddCard, features } = useSubscriptionStore();

  if (canAddCard(currentCardCount)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradePrompt
      variant="banner"
      feature="Unlimited Cards"
      description={`You've reached the limit of ${features.maxCards} cards on the free plan. Upgrade to Premium to track all your credit cards.`}
    />
  );
}
```

### 4. `src/components/UpgradePrompt.tsx`
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lock, Crown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/subscription-store';

interface UpgradePromptProps {
  /** Visual variant of the prompt */
  variant?: 'card' | 'inline' | 'banner';
  /** Feature name being gated */
  feature?: string;
  /** Description of what the feature does */
  description?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Prompts user to upgrade to Premium.
 * Three variants: card (full card), inline (compact), banner (horizontal).
 */
export function UpgradePrompt({
  variant = 'card',
  feature,
  description,
  className,
}: UpgradePromptProps) {
  const router = useRouter();

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Lock className="h-4 w-4" />
        <span>{feature ? `${feature} requires Premium` : 'Premium feature'}</span>
        <Button variant="link" size="sm" className="h-auto p-0" onClick={handleUpgradeClick}>
          Upgrade
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              {feature || 'Premium Feature'}
            </p>
            {description && (
              <p className="text-sm text-amber-700 dark:text-amber-300">{description}</p>
            )}
          </div>
        </div>
        <Button
          onClick={handleUpgradeClick}
          className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Upgrade
        </Button>
      </div>
    );
  }

  // Default: card variant
  return (
    <Card className={cn('border-dashed', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
          <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <CardTitle className="text-lg">
          {feature || 'Premium Feature'}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={handleUpgradeClick} className="w-full sm:w-auto">
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to Premium
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Starting at $9.99/month
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Small badge indicating a premium feature.
 * Use next to feature names or buttons.
 */
export function PremiumBadge({ className }: { className?: string }) {
  const { isPremium } = useSubscriptionStore();

  // Don't show badge if user is already premium
  if (isPremium) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/50 dark:to-orange-900/50 dark:text-amber-300',
        className
      )}
    >
      <Sparkles className="mr-1 h-3 w-3" />
      Premium
    </Badge>
  );
}

/**
 * Banner shown when user is approaching or at card limit.
 */
export function CardLimitBanner({
  currentCount,
  className,
}: {
  currentCount: number;
  className?: string;
}) {
  const { features, isPremium } = useSubscriptionStore();
  const router = useRouter();

  // Don't show if premium or not near limit
  if (isPremium || currentCount < features.maxCards - 1) return null;

  const isAtLimit = currentCount >= features.maxCards;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg p-4',
        isAtLimit
          ? 'border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
          : 'border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
        className
      )}
    >
      <div>
        <p
          className={cn(
            'font-medium',
            isAtLimit
              ? 'text-red-900 dark:text-red-100'
              : 'text-amber-900 dark:text-amber-100'
          )}
        >
          {isAtLimit
            ? `Card limit reached (${currentCount}/${features.maxCards})`
            : `${features.maxCards - currentCount} card slot remaining`}
        </p>
        <p
          className={cn(
            'text-sm',
            isAtLimit
              ? 'text-red-700 dark:text-red-300'
              : 'text-amber-700 dark:text-amber-300'
          )}
        >
          {isAtLimit
            ? 'Upgrade to Premium for unlimited cards'
            : 'Upgrade to track all your credit cards'}
        </p>
      </div>
      <Button
        onClick={() => router.push('/pricing')}
        variant={isAtLimit ? 'destructive' : 'default'}
        className={
          !isAtLimit
            ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500'
            : ''
        }
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Upgrade
      </Button>
    </div>
  );
}
```

### 5. `src/app/api/stripe/checkout/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  PLANS,
  getOrCreateStripeCustomer,
  createCheckoutSession,
} from '@/lib/stripe';
import { BillingInterval } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { interval } = body as { interval?: BillingInterval };

    if (!interval || !['monthly', 'annual'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid billing interval. Must be "monthly" or "annual".' },
        { status: 400 }
      );
    }

    // Get the appropriate price ID
    const priceId = interval === 'monthly'
      ? PLANS.premium.monthly.priceId
      : PLANS.premium.annual.priceId;

    if (!priceId) {
      console.error('[Checkout] Missing price ID for interval:', interval);
      return NextResponse.json(
        { error: 'Pricing configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email!);

    // Create checkout session
    const session = await createCheckoutSession(customerId, priceId, user.id);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('[Checkout] Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
```

### 6. `src/app/api/stripe/portal/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createPortalSession } from '@/lib/stripe';

export async function POST() {
  try {
    // Create server-side Supabase client
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID from subscriptions table
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 404 }
      );
    }

    // Create Stripe portal session
    const session = await createPortalSession(subscription.stripe_customer_id);

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('[Portal] Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to access subscription management. Please try again.' },
      { status: 500 }
    );
  }
}
```

### 7. `src/app/api/webhooks/stripe/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

// Use service role to bypass RLS for webhook operations
// Lazy initialization to avoid errors during build when env vars aren't set
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration for webhook handler');
  }

  return createClient(url, key);
}

// Stripe webhook events we care about
const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  // Validate webhook secret is configured
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    // Log the error for debugging but don't expose details to client
    console.error('[Webhook] Signature verification failed:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Skip irrelevant events early
  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, skipped: true });
  }

  // Get Supabase admin client
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    console.error('[Webhook] Database configuration error');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Check for idempotency - has this event been processed?
  const { data: existingEvent } = await supabaseAdmin
    .from('stripe_events')
    .select('id, processed')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent?.processed) {
    console.log('[Webhook] Event already processed:', event.id);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Log the event for idempotency tracking
  if (!existingEvent) {
    await supabaseAdmin.from('stripe_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event.data.object,
      processed: false,
    });
  }

  try {
    // Handle different event types and update the subscriptions table
    await handleStripeEvent(event, supabaseAdmin);

    // Mark event as processed
    await supabaseAdmin
      .from('stripe_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    // Log the full error server-side but don't expose details to client
    console.error('[Webhook] Error processing event:', error);

    // Log the error to database for debugging
    await supabaseAdmin
      .from('stripe_events')
      .update({ error: error instanceof Error ? error.message : 'Unknown error' })
      .eq('stripe_event_id', event.id);

    // Return 500 to trigger Stripe retry for transient errors
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe webhook events and update the subscriptions table
 */
async function handleStripeEvent(
  event: Stripe.Event,
  supabaseAdmin: SupabaseClient
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) {
        console.error('[Webhook] checkout.session.completed missing userId in metadata');
        return;
      }

      // Validate userId is a valid UUID format to prevent injection
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.error('[Webhook] Invalid userId format in metadata');
        return;
      }

      // Fetch the full subscription to get billing interval
      const subscriptionId = session.subscription as string;
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
      const subscriptionItem = stripeSubscription.items.data[0];
      const interval = subscriptionItem?.price?.recurring?.interval;

      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          tier: 'premium',
          status: 'active',
          billing_interval: interval === 'year' ? 'annual' : 'monthly',
          current_period_start: subscriptionItem ? new Date(subscriptionItem.current_period_start * 1000).toISOString() : null,
          current_period_end: subscriptionItem ? new Date(subscriptionItem.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: false,
          canceled_at: null,
          grandfathered_until: null, // Clear grandfathered status on upgrade
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[Webhook] Error updating subscription after checkout:', error);
        throw error;
      }

      console.log('[Webhook] Subscription activated for user:', userId);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error('[Webhook] subscription event missing userId in metadata');
        return;
      }

      // Validate userId is a valid UUID format to prevent injection
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.error('[Webhook] Invalid userId format in metadata');
        return;
      }

      const subItem = subscription.items.data[0];
      const interval = subItem?.price?.recurring?.interval;
      const isPremium = subscription.status === 'active' || subscription.status === 'trialing';

      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          stripe_subscription_id: subscription.id,
          tier: isPremium ? 'premium' : 'free',
          status: subscription.status as string,
          billing_interval: interval === 'year' ? 'annual' : 'monthly',
          current_period_start: subItem ? new Date(subItem.current_period_start * 1000).toISOString() : null,
          current_period_end: subItem ? new Date(subItem.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[Webhook] Error updating subscription:', error);
        throw error;
      }

      console.log('[Webhook] Subscription updated for user:', userId, 'status:', subscription.status);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error('[Webhook] subscription.deleted missing userId in metadata');
        return;
      }

      // Validate userId is a valid UUID format to prevent injection
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        console.error('[Webhook] Invalid userId format in metadata');
        return;
      }

      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          tier: 'free',
          status: 'canceled',
          cancel_at_period_end: false,
          canceled_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[Webhook] Error handling subscription deletion:', error);
        throw error;
      }

      console.log('[Webhook] Subscription canceled for user:', userId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;

      // In newer Stripe API, subscription is under parent.subscription_details
      const subscriptionDetails = invoice.parent?.subscription_details;
      const subscriptionId = typeof subscriptionDetails?.subscription === 'string'
        ? subscriptionDetails.subscription
        : subscriptionDetails?.subscription?.id;

      if (!subscriptionId) {
        console.log('[Webhook] invoice.payment_failed not related to subscription');
        return;
      }

      // Update status to past_due
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'past_due',
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) {
        console.error('[Webhook] Error updating subscription to past_due:', error);
        throw error;
      }

      console.log('[Webhook] Subscription marked past_due for subscription:', subscriptionId);
      break;
    }

    default:
      console.log('[Webhook] Unhandled event type:', event.type);
  }
}
```

### 8. `src/app/pricing/page.tsx`
```typescript
'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { FEATURE_DESCRIPTIONS, TierFeatures } from '@/types';
import {
  Check,
  X,
  Sparkles,
  CreditCard,
  ArrowLeft,
  Loader2,
  Crown,
} from 'lucide-react';

const PRICING = {
  monthly: {
    amount: 9.99,
    label: 'month',
  },
  annual: {
    amount: 79.99,
    monthlyEquivalent: 6.67,
    label: 'year',
    savings: '33%',
  },
};

// Wrap the page content in a Suspense boundary for useSearchParams
export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageSkeleton />}>
      <PricingPageContent />
    </Suspense>
  );
}

function PricingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="h-12 w-64 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-6 w-96 mx-auto mt-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { isPremium, isGrandfathered, subscription } = useSubscriptionStore();

  const [isAnnual, setIsAnnual] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Check for upgrade canceled message
  const upgradeCanceled = searchParams.get('upgrade') === 'canceled';

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      // Redirect to login, then back to pricing
      router.push('/login?redirect=/pricing');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interval: isAnnual ? 'annual' : 'monthly',
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[Pricing] No checkout URL returned');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[Pricing] Error creating checkout session:', error);
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[Pricing] No portal URL returned');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[Pricing] Error creating portal session:', error);
      setIsLoading(false);
    }
  };

  // Feature list for comparison
  const features: Array<{
    key: keyof TierFeatures;
    free: string | boolean;
    premium: string | boolean;
  }> = [
    { key: 'maxCards', free: '2 cards', premium: 'Unlimited' },
    { key: 'hasWhatIfScenarios', free: false, premium: true },
    { key: 'hasPdfExport', free: false, premium: true },
    { key: 'hasCalendarExport', free: false, premium: true },
    { key: 'hasRecommendations', free: false, premium: true },
    { key: 'hasEmailReminders', free: false, premium: true },
    { key: 'hasPriorityAllocation', free: false, premium: true },
    { key: 'hasAdvancedAnalytics', free: false, premium: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold">CardTempo</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Title */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Unlock the full power of credit optimization with CardTempo Premium
          </p>

          {/* Canceled message */}
          {upgradeCanceled && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              No worries! Take your time to decide. Your data is safe.
            </div>
          )}

          {/* Already premium message */}
          {isPremium && !isGrandfathered && (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              <Crown className="mb-2 inline-block h-5 w-5" />
              <p className="font-medium">You&apos;re a Premium member!</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Manage Subscription
              </Button>
            </div>
          )}

          {/* Grandfathered message */}
          {isGrandfathered && (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              <Sparkles className="mb-2 inline-block h-5 w-5" />
              <p className="font-medium">You have complimentary Premium access!</p>
              <p className="text-sm">
                As an early user, you have Premium features until{' '}
                {subscription?.grandfatheredUntil?.toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Billing toggle */}
          {!isPremium && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={!isAnnual ? 'font-medium' : 'text-muted-foreground'}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                aria-label="Toggle annual billing"
              />
              <span className={isAnnual ? 'font-medium' : 'text-muted-foreground'}>
                Annual
              </span>
              {isAnnual && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Save {PRICING.annual.savings}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2">
          {/* Free tier */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map(({ key, free }) => (
                  <li key={key} className="flex items-center gap-3">
                    {free ? (
                      <Check className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <X className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                    <span className={!free ? 'text-muted-foreground' : ''}>
                      {FEATURE_DESCRIPTIONS[key].title}
                      {typeof free === 'string' && (
                        <span className="ml-1 text-sm text-muted-foreground">
                          ({free})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {!isAuthenticated ? (
                <Button
                  className="mt-8 w-full"
                  variant="outline"
                  onClick={() => router.push('/signup')}
                >
                  Get Started Free
                </Button>
              ) : (
                <Button className="mt-8 w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium tier */}
          <Card className="relative border-emerald-200 dark:border-emerald-800">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-emerald-600 px-3 py-1">
                <Sparkles className="mr-1 h-3 w-3" />
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>For serious credit optimizers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${isAnnual ? PRICING.annual.monthlyEquivalent : PRICING.monthly.amount}
                </span>
                <span className="text-muted-foreground">/month</span>
                {isAnnual && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Billed ${PRICING.annual.amount}/year
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map(({ key, premium }) => (
                  <li key={key} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-500" />
                    <span>
                      {FEATURE_DESCRIPTIONS[key].title}
                      {typeof premium === 'string' && (
                        <span className="ml-1 text-sm text-muted-foreground">
                          ({premium})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {isPremium && !isGrandfathered ? (
                <Button
                  className="mt-8 w-full"
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Manage Subscription
                </Button>
              ) : (
                <Button
                  className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleUpgrade}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isGrandfathered ? 'Subscribe Now' : 'Upgrade to Premium'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ or trust signals */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-6 text-left">
            <div>
              <h3 className="font-semibold">Can I cancel anytime?</h3>
              <p className="mt-1 text-muted-foreground">
                Yes! You can cancel your subscription at any time. You&apos;ll keep
                Premium access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">What happens to my data if I downgrade?</h3>
              <p className="mt-1 text-muted-foreground">
                Your data is always safe. If you downgrade, you&apos;ll keep access to
                your first 2 cards. Premium features will be locked until you upgrade again.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Is my payment information secure?</h3>
              <p className="mt-1 text-muted-foreground">
                Absolutely. We use Stripe for payment processing. Your card details
                never touch our servers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

### 9. `supabase/migrations/20260112_subscriptions.sql`
```sql
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
```

---

## Types to ADD to `src/types/index.ts`

Add these at the end of the file:

```typescript
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

## Modifications to `src/store/auth-store.ts`

Add subscription loading/clearing at these points:

### 1. After login (in the `login` function, after `set({ user, isAuthenticated: true, isLoading: false })`):

```typescript
// Update calculator store with user ID and load subscription
if (typeof window !== 'undefined') {
  const { useCalculatorStore } = await import('./calculator-store');
  const { useSubscriptionStore } = await import('./subscription-store');
  useCalculatorStore.getState().setUserId(user.id);
  await useSubscriptionStore.getState().loadSubscription(user.id);
}
```

### 2. After signup (same location in `signup` function):

```typescript
// Update calculator store with user ID and load subscription
if (typeof window !== 'undefined') {
  const { useCalculatorStore } = await import('./calculator-store');
  const { useSubscriptionStore } = await import('./subscription-store');
  useCalculatorStore.getState().setUserId(user.id);
  await useSubscriptionStore.getState().loadSubscription(user.id);
}
```

### 3. In logout function (after `set({ user: null, isAuthenticated: false })`):

```typescript
// Clear calculator store and subscription data
if (typeof window !== 'undefined') {
  import('./calculator-store').then(({ useCalculatorStore }) => {
    useCalculatorStore.getState().setUserId(null);
  });
  import('./subscription-store').then(({ useSubscriptionStore }) => {
    useSubscriptionStore.getState().clearSubscription();
  });
}
```

### 4. In checkSession function (after setting user):

```typescript
// Update calculator store and load subscription
if (typeof window !== 'undefined') {
  const { useCalculatorStore } = await import('./calculator-store');
  const { useSubscriptionStore } = await import('./subscription-store');
  useCalculatorStore.getState().setUserId(user.id);
  await useSubscriptionStore.getState().loadSubscription(user.id);
}

// And in the else branch (no session):
// Clear subscription when no session
if (typeof window !== 'undefined') {
  import('./subscription-store').then(({ useSubscriptionStore }) => {
    useSubscriptionStore.getState().clearSubscription();
  });
}
```

---

## Feature Gating Patterns (apply to pages)

### Calculator - Card Limit

```typescript
// Imports
import { PremiumGateForCards } from '@/components/PremiumGate';
import { CardLimitBanner } from '@/components/UpgradePrompt';
import { useSubscriptionStore } from '@/store/subscription-store';

// In component
const { canAddCard, getRemainingCards } = useSubscriptionStore();
const canAddMoreCards = canAddCard(cards.length);
const remainingCards = getRemainingCards(cards.length);

// Show banner
<CardLimitBanner currentCount={cards.length} />

// Disable button when at limit
<Button disabled={!canAddMoreCards}>Add Card</Button>

// Wrap form with gate
<PremiumGateForCards currentCardCount={cards.length}>
  <CreditCardForm ... />
</PremiumGateForCards>
```

### Results - Export Gating

```typescript
// Imports
import { useSubscriptionStore } from '@/store/subscription-store';
import { PremiumBadge } from '@/components/UpgradePrompt';
import { Lock } from 'lucide-react';

// In component
const { canAccessFeature, isPremium } = useSubscriptionStore();
const canExportPdf = canAccessFeature('hasPdfExport');
const canExportCalendar = canAccessFeature('hasCalendarExport');

// Conditional render
{canExportPdf ? (
  <Button onClick={handleDownloadPDF}>Download PDF</Button>
) : (
  <Button disabled onClick={() => router.push('/pricing')}>
    <Lock className="h-4 w-4" /> PDF <PremiumBadge />
  </Button>
)}
```

### Dashboard - Feature Cards

```typescript
// Import
import { PremiumGate } from '@/components/PremiumGate';

// Wrap premium feature cards
<PremiumGate 
  feature="hasWhatIfScenarios"
  fallback={<LockedFeatureCard title="What-If Scenarios" />}
>
  <Link href="/dashboard/scenarios">
    <FeatureCard title="What-If Scenarios" />
  </Link>
</PremiumGate>
```

### Full Page Gates (Scenarios, Recommendations)

```typescript
// Import
import { PremiumGate } from '@/components/PremiumGate';

// Wrap page content
<PremiumGate 
  feature="hasWhatIfScenarios"
  fallback={<UpgradePrompt feature="What-If Scenarios" />}
>
  {/* Entire page content */}
</PremiumGate>
```

### Settings - Subscription Section

```typescript
// Import
import { useSubscriptionStore } from '@/store/subscription-store';
import { format } from 'date-fns';

// In component
const { subscription, isPremium, isGrandfathered } = useSubscriptionStore();

// Manage subscription button
const handleManageSubscription = async () => {
  const response = await fetch('/api/stripe/portal', { method: 'POST' });
  const { url } = await response.json();
  window.location.href = url;
};
```

---

## Environment Variables (add to .env.local)

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## Dependencies

```bash
npm install stripe
```

