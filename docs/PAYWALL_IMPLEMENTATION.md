# CardTempo Premium Paywall - Implementation Guide

> **Status**: Core implementation complete. Last updated: 2026-01-12

---

## Progress Tracker

### ✅ Completed
- [x] Environment variables configured (`.env.local`)
- [x] Database migration created (`supabase/migrations/20260112_subscriptions.sql`)
- [x] TypeScript types added to `src/types/index.ts`
- [x] Stripe library created (`src/lib/stripe.ts`)
- [x] Stripe account setup (product created, webhook configured)
- [x] Subscription store (Zustand) - `src/store/subscription-store.ts`
- [x] Auth store integration (loads/clears subscription on login/logout)
- [x] API routes (checkout, portal, webhooks)
- [x] UI components (PremiumGate, UpgradePrompt, PremiumBadge, CardLimitBanner)
- [x] Pricing page (`/pricing`)

### 📝 Remaining
- [ ] Feature gating throughout app (wrap premium features with PremiumGate)
- [ ] Settings page subscription section
- [ ] Run database migration (`supabase db push`)
- [ ] Add Stripe price IDs to environment variables
- [ ] Testing

---

## Quick Start (for new chat)

Tell Claude: "Continue implementing the Stripe paywall. Check docs/PAYWALL_IMPLEMENTATION.md for progress."

---

## Environment Variables

Already configured in `.env.local` (git-ignored). Template in `.env.example`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_ID_ANNUAL=price_your_annual_price_id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
```

**Note**: Price IDs still need to be added after creating the product in Stripe Dashboard.

---

## Database Schema

Migration file: `supabase/migrations/20260112_subscriptions.sql`

**Tables created:**
- `subscriptions` - User subscription data synced with Stripe
- `stripe_events` - Webhook event log for idempotency

**Key columns in `subscriptions`:**
- `user_id` (FK to auth.users)
- `stripe_customer_id`
- `stripe_subscription_id`
- `tier` ('free' | 'premium')
- `status` ('active' | 'canceled' | 'past_due' | etc.)
- `billing_interval` ('monthly' | 'annual')
- `current_period_end`
- `cancel_at_period_end`
- `grandfathered_until` (90-day grace for existing users)

**Note**: Migration has NOT been run yet. Run with `supabase db push` when ready.

---

## TypeScript Types

Added to `src/types/index.ts`:

```typescript
// Key types
export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | ...;
export type BillingInterval = 'monthly' | 'annual';

export interface Subscription { ... }
export interface TierFeatures { ... }

// Feature configuration
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures>
export const FEATURE_DESCRIPTIONS: Record<keyof TierFeatures, {...}>
```

**Free tier limits:**
- 2 cards max
- No what-if scenarios
- No PDF/calendar export
- No recommendations
- No email reminders
- No priority allocation
- No advanced analytics

---

## Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `supabase/migrations/20260112_subscriptions.sql` | ✅ Created | Database schema |
| `src/types/index.ts` | ✅ Modified | Added subscription types |
| `src/lib/stripe.ts` | ✅ Created | Stripe client & helpers |
| `.env.example` | ✅ Modified | Added Stripe env vars |
| `src/store/subscription-store.ts` | ✅ Created | Subscription state |
| `src/store/auth-store.ts` | ✅ Modified | Load subscription on login/logout |
| `src/app/api/stripe/checkout/route.ts` | ✅ Created | Create checkout session |
| `src/app/api/stripe/portal/route.ts` | ✅ Created | Customer portal |
| `src/app/api/webhooks/stripe/route.ts` | ✅ Created | Handle Stripe events |
| `src/components/PremiumGate.tsx` | ✅ Created | Feature gating wrapper |
| `src/components/UpgradePrompt.tsx` | ✅ Created | Upgrade CTA, PremiumBadge, CardLimitBanner |
| `src/app/pricing/page.tsx` | ✅ Created | Pricing page |

---

## Implementation Order (Remaining)

### ✅ Phase 3: Subscription Store - COMPLETE
Created `src/store/subscription-store.ts` with state, actions, and helpers.

### ✅ Phase 4: Auth Store Integration - COMPLETE
Modified auth-store to load/clear subscriptions on auth events.

### ✅ Phase 5: API Routes - COMPLETE
Created checkout, portal, and webhook routes.

### ✅ Phase 6: UI Components - COMPLETE
Created PremiumGate, UpgradePrompt, PremiumBadge, CardLimitBanner.

### ✅ Phase 7: Pricing Page - COMPLETE
Created `/pricing` with billing toggle and Stripe checkout.

### 📝 Phase 8: Feature Gating - TODO
Apply gates throughout the app:
- Calculator (card limit with `PremiumGateForCards`)
- Results page (PDF/calendar export with `PremiumGate`)
- Dashboard (scenarios, priority allocation)
- Recommendations page
- Settings (subscription management section)

Example usage:
```tsx
// Wrap premium features
<PremiumGate feature="hasWhatIfScenarios">
  <ScenariosContent />
</PremiumGate>

// Card limit banner
<CardLimitBanner currentCount={cards.length} />

// Inline premium badge
<Button>Export PDF <PremiumBadge /></Button>
```

---

## Stripe Dashboard Setup

**Product**: CardTempo Premium
- Monthly: $9.99/month
- Annual: $79.99/year (~33% savings)

**Webhook endpoint**: `https://cardtempo.com/api/webhooks/stripe`

**Events listening**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Testing Checklist

- [ ] Free user can only add 2 cards
- [ ] Premium features show upgrade prompts for free users
- [ ] Checkout flow creates subscription
- [ ] Webhook updates database correctly
- [ ] Customer portal allows subscription management
- [ ] Cancellation keeps access until period end
- [ ] Grandfathered users get premium until grace period ends

---

## Code Snippets for Remaining Tasks

### Subscription Store (Phase 3)

```typescript
// src/store/subscription-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subscription, SubscriptionTier, TierFeatures, TIER_FEATURES } from '@/types';
import { supabase } from '@/lib/supabase';

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  tier: SubscriptionTier;
  features: TierFeatures;
  isPremium: boolean;
  isGrandfathered: boolean;

  loadSubscription: (userId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  clearSubscription: () => void;
  canAddCard: (currentCardCount: number) => boolean;
  canAccessFeature: (feature: keyof TierFeatures) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      subscription: null,
      isLoading: false,
      tier: 'free',
      features: TIER_FEATURES.free,
      isPremium: false,
      isGrandfathered: false,

      loadSubscription: async (userId: string) => {
        // Fetch from supabase, check grandfathered status
        // Set tier, features, isPremium based on subscription data
      },

      clearSubscription: () => {
        set({
          subscription: null,
          tier: 'free',
          features: TIER_FEATURES.free,
          isPremium: false,
          isGrandfathered: false,
        });
      },

      canAddCard: (currentCardCount: number) => {
        return currentCardCount < get().features.maxCards;
      },

      canAccessFeature: (feature: keyof TierFeatures) => {
        const value = get().features[feature];
        return typeof value === 'boolean' ? value : value > 0;
      },
    }),
    { name: 'subscription-storage' }
  )
);
```

### Webhook Handler Key Events (Phase 5)

```typescript
// Handle checkout.session.completed
// - Get userId from metadata
// - Update subscriptions table with stripe IDs and tier='premium'

// Handle customer.subscription.updated
// - Update status, current_period_end, cancel_at_period_end

// Handle customer.subscription.deleted
// - Set tier='free', status='canceled'

// Handle invoice.payment_failed
// - Set status='past_due'
```

### PremiumGate Usage (Phase 6)

```tsx
// Wrap premium features
<PremiumGate feature="hasWhatIfScenarios">
  <ScenariosContent />
</PremiumGate>

// With custom fallback
<PremiumGate
  feature="hasPdfExport"
  fallback={<DisabledExportButton />}
>
  <ExportButton />
</PremiumGate>
```

---

## Notes

- All Stripe operations are server-side only (API routes)
- Webhook uses service role key to bypass RLS
- Existing users get 90-day grandfathered period
- Price IDs needed before testing checkout
- Update webhook URL after Vercel deployment
