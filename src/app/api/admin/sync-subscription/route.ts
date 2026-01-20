import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

/**
 * ADMIN ONLY: Manual subscription sync endpoint
 *
 * Use this to manually sync a user's subscription from Stripe when webhooks fail
 *
 * Usage:
 * POST /api/admin/sync-subscription
 * Headers: Authorization: Bearer <ADMIN_API_KEY>
 * Body: { userId: "..." }
 *
 * This will:
 * 1. Fetch the user's subscription from Stripe
 * 2. Update the local database to match
 * 3. Grant premium access if they have an active subscription
 */

// Service role Supabase client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify admin API key
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey) {
      console.error('[Sync] ADMIN_API_KEY not configured');
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
      console.error('[Sync] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 }
      );
    }

    console.log('[Sync] Starting manual sync for user:', userId);

    const supabase = getSupabaseAdmin();

    // Get user's subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      console.error('[Sync] User subscription not found:', userId);
      return NextResponse.json(
        { error: 'Subscription record not found' },
        { status: 404 }
      );
    }

    // If no Stripe customer ID, user hasn't subscribed yet
    if (!subscription.stripe_customer_id) {
      console.log('[Sync] User has no Stripe customer ID - likely free tier');
      return NextResponse.json({
        success: true,
        message: 'User has not subscribed to a paid plan yet',
        tier: 'free',
      });
    }

    // Fetch active subscriptions from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: subscription.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (stripeSubscriptions.data.length === 0) {
      console.log('[Sync] No active subscriptions in Stripe');

      // Update to free tier
      await supabase
        .from('subscriptions')
        .update({
          tier: 'free',
          status: 'canceled',
        })
        .eq('user_id', userId);

      return NextResponse.json({
        success: true,
        message: 'No active subscription in Stripe - updated to free tier',
        tier: 'free',
      });
    }

    // User has an active subscription - sync it
    const stripeSub = stripeSubscriptions.data[0];
    const subItem = stripeSub.items.data[0];
    const interval = subItem?.price?.recurring?.interval;

    console.log('[Sync] Found active Stripe subscription:', stripeSub.id);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        stripe_subscription_id: stripeSub.id,
        tier: 'premium',
        status: stripeSub.status as string,
        billing_interval: interval === 'year' ? 'annual' : 'monthly',
        current_period_start: subItem
          ? new Date(subItem.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subItem
          ? new Date(subItem.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        canceled_at: stripeSub.canceled_at
          ? new Date(stripeSub.canceled_at * 1000).toISOString()
          : null,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Sync] Error updating subscription:', updateError);
      throw updateError;
    }

    console.log('[Sync] ✅ Successfully synced subscription for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription synced successfully',
      tier: 'premium',
      subscriptionId: stripeSub.id,
      status: stripeSub.status,
      interval: interval === 'year' ? 'annual' : 'monthly',
    });
  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
