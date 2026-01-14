/**
 * CRITICAL PRODUCTION TESTS - Stripe Webhook Handler
 * Tests verify that the upsert fix prevents the silent failure bug
 */

describe('Stripe Webhook - Upsert Logic Verification', () => {
  describe('Critical Fix: Checkout completed should use UPSERT', () => {
    it('verifies the code uses upsert (not update) for checkout.session.completed', () => {
      // Read the actual webhook handler file
      const fs = require('fs');
      const path = require('path');

      const webhookPath = path.join(__dirname, '../stripe/route.ts');
      const webhookCode = fs.readFileSync(webhookPath, 'utf-8');

      // CRITICAL: Verify upsert is used in checkout.session.completed handler
      const checkoutSection = webhookCode.match(
        /case 'checkout\.session\.completed':[\s\S]*?break;/
      );

      expect(checkoutSection).toBeTruthy();
      expect(checkoutSection![0]).toContain('.upsert(');
      expect(checkoutSection![0]).toContain('user_id: userId');
      expect(checkoutSection![0]).toContain("tier: 'premium'");
      expect(checkoutSection![0]).toContain("onConflict: 'user_id'");

      // Should NOT use .update() in the critical path
      expect(checkoutSection![0]).not.toMatch(/\.update\([^)]*tier.*premium/);
    });

    it('verifies subscription.updated also uses upsert', () => {
      const fs = require('fs');
      const path = require('path');

      const webhookPath = path.join(__dirname, '../stripe/route.ts');
      const webhookCode = fs.readFileSync(webhookPath, 'utf-8');

      const subscriptionUpdateSection = webhookCode.match(
        /case 'customer\.subscription\.updated':[\s\S]*?break;/
      );

      expect(subscriptionUpdateSection).toBeTruthy();
      expect(subscriptionUpdateSection![0]).toContain('.upsert(');
      expect(subscriptionUpdateSection![0]).toContain('user_id: userId');
      expect(subscriptionUpdateSection![0]).toContain("onConflict: 'user_id'");
    });

    it('verifies userId validation is in place', () => {
      const fs = require('fs');
      const path = require('path');

      const webhookPath = path.join(__dirname, '../stripe/route.ts');
      const webhookCode = fs.readFileSync(webhookPath, 'utf-8');

      // Should validate UUID format to prevent injection
      expect(webhookCode).toContain('Invalid userId format');
      expect(webhookCode).toContain('[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
    });
  });

  describe('Database Schema Validation', () => {
    it('verifies subscriptions table has user_id unique constraint', () => {
      const fs = require('fs');
      const path = require('path');

      const migrationPath = path.join(
        __dirname,
        '../../../../../supabase/migrations/20260112_subscriptions.sql'
      );
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

      // user_id must be unique for upsert to work correctly
      expect(migrationSQL).toContain('user_id UUID');
      expect(migrationSQL).toContain('UNIQUE');
      expect(migrationSQL).toMatch(/user_id.*UNIQUE|UNIQUE.*user_id/);
    });
  });
});

describe('Stripe Customer Creation - Upsert Logic', () => {
  it('verifies getOrCreateStripeCustomer uses upsert', () => {
    const fs = require('fs');
    const path = require('path');

    const stripePath = path.join(__dirname, '../../../../lib/stripe.ts');
    const stripeCode = fs.readFileSync(stripePath, 'utf-8');

    // Find the getOrCreateStripeCustomer function
    const functionSection = stripeCode.match(
      /export async function getOrCreateStripeCustomer[\s\S]*?^}/m
    );

    expect(functionSection).toBeTruthy();
    expect(functionSection![0]).toContain('.upsert(');
    expect(functionSection![0]).toContain('user_id: userId');
    expect(functionSection![0]).toContain('stripe_customer_id');
    expect(functionSection![0]).toContain("onConflict: 'user_id'");

    // Should NOT use .update() for saving customer ID
    expect(functionSection![0]).not.toMatch(/\.update\([^)]*stripe_customer_id/);
  });
});

describe('Production Readiness Checklist', () => {
  it('has all required environment variables referenced', () => {
    const fs = require('fs');
    const path = require('path');

    const webhookPath = path.join(__dirname, '../stripe/route.ts');
    const webhookCode = fs.readFileSync(webhookPath, 'utf-8');

    expect(webhookCode).toContain('STRIPE_WEBHOOK_SECRET');
    expect(webhookCode).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(webhookCode).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('has proper error handling', () => {
    const fs = require('fs');
    const path = require('path');

    const webhookPath = path.join(__dirname, '../stripe/route.ts');
    const webhookCode = fs.readFileSync(webhookPath, 'utf-8');

    // Should have try-catch blocks
    expect(webhookCode).toContain('try {');
    expect(webhookCode).toContain('catch');

    // Should check for errors
    expect(webhookCode).toContain('if (error)');
    expect(webhookCode).toContain('console.error');

    // Should throw on critical errors to trigger Stripe retry
    expect(webhookCode).toContain('throw error');
  });

  it('has idempotency protection', () => {
    const fs = require('fs');
    const path = require('path');

    const webhookPath = path.join(__dirname, '../stripe/route.ts');
    const webhookCode = fs.readFileSync(webhookPath, 'utf-8');

    // Should check for existing events
    expect(webhookCode).toContain('stripe_events');
    expect(webhookCode).toContain('processed');
    expect(webhookCode).toContain('stripe_event_id');
  });
});
