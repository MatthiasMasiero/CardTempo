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
