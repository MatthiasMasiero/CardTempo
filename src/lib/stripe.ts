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
      amount: 399, // $3.99 in cents
    },
    annual: {
      priceId: process.env.STRIPE_PRICE_ID_ANNUAL!,
      amount: 2999, // $29.99 in cents
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
