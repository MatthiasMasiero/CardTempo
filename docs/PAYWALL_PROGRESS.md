# CardTempo Paywall - Implementation Progress

> **Last Updated**: 2026-01-12
> **Reference**: See `PAYWALL_IMPLEMENTATION.md` for complete code snippets

---

## Quick Status

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Environment Variables | ✅ Done | `.env.local` configured |
| 2. Database Migration | ✅ Created | Needs `supabase db push` |
| 3. TypeScript Types | ✅ Done | Added to `src/types/index.ts` |
| 4. Stripe Library | ✅ Done | `src/lib/stripe.ts` |
| 5. API Routes | ❌ TODO | checkout, portal, webhooks |
| 6. Subscription Store | ❌ TODO | `src/store/subscription-store.ts` |
| 7. Auth Store Integration | ❌ TODO | Load subscription on login |
| 8. UI Components | ❌ TODO | PremiumGate, UpgradePrompt, etc. |
| 9. Pricing Page | ❌ TODO | `/pricing` |
| 10. Feature Gating | ❌ TODO | Apply gates throughout app |
| 11. Settings Section | ❌ TODO | Subscription management |
| 12. Testing | ❌ TODO | Unit + E2E tests |

---

## Detailed Checklist

### Phase 1: Environment Variables ✅
- [x] Add `STRIPE_SECRET_KEY` to `.env.local`
- [x] Add `STRIPE_PUBLISHABLE_KEY` to `.env.local`
- [x] Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
- [x] Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local`
- [x] Add `NEXT_PUBLIC_APP_URL` to `.env.local`
- [ ] Add `STRIPE_PRICE_ID_MONTHLY` (after creating in Stripe Dashboard)
- [ ] Add `STRIPE_PRICE_ID_ANNUAL` (after creating in Stripe Dashboard)

### Phase 2: Database Migration ✅
- [x] Create `supabase/migrations/20260112_subscriptions.sql`
- [ ] Run `supabase db push` to apply migration
- [ ] Verify `subscriptions` table created
- [ ] Verify `stripe_events` table created
- [ ] Verify auto-signup trigger working

### Phase 3: TypeScript Types ✅
- [x] Add `SubscriptionTier` type
- [x] Add `SubscriptionStatus` type
- [x] Add `BillingInterval` type
- [x] Add `Subscription` interface
- [x] Add `TierFeatures` interface
- [x] Add `TIER_FEATURES` constant
- [x] Add `FEATURE_DESCRIPTIONS` constant

### Phase 4: Stripe Library ✅
- [x] Create `src/lib/stripe.ts`
- [x] Initialize Stripe client
- [x] Add `PLANS` configuration
- [x] Add `getOrCreateStripeCustomer()` function
- [x] Add `createCheckoutSession()` function
- [x] Add `createPortalSession()` function

### Phase 5: API Routes ❌
- [ ] Create `src/app/api/stripe/checkout/route.ts`
- [ ] Create `src/app/api/stripe/portal/route.ts`
- [ ] Create `src/app/api/webhooks/stripe/route.ts`
  - [ ] Handle `checkout.session.completed`
  - [ ] Handle `customer.subscription.created`
  - [ ] Handle `customer.subscription.updated`
  - [ ] Handle `customer.subscription.deleted`
  - [ ] Handle `invoice.payment_failed`

### Phase 6: Subscription Store ❌
- [ ] Create `src/store/subscription-store.ts`
- [ ] Add `loadSubscription()` action
- [ ] Add `refreshSubscription()` action
- [ ] Add `clearSubscription()` action
- [ ] Add `canAddCard()` helper
- [ ] Add `canAccessFeature()` helper
- [ ] Add `getRemainingCards()` helper

### Phase 7: Auth Store Integration ❌
- [ ] Import `useSubscriptionStore` in auth-store
- [ ] Call `loadSubscription()` after login
- [ ] Call `loadSubscription()` after signup
- [ ] Call `clearSubscription()` on logout
- [ ] Call `loadSubscription()` in `checkSession()`

### Phase 8: UI Components ❌
- [ ] Create `src/components/PremiumGate.tsx`
- [ ] Create `src/components/UpgradePrompt.tsx`
- [ ] Create `src/components/PremiumBadge.tsx`
- [ ] Create `src/components/CardLimitBanner.tsx`

### Phase 9: Pricing Page ❌
- [ ] Create `src/app/pricing/page.tsx`
- [ ] Add billing toggle (monthly/annual)
- [ ] Add free vs premium comparison
- [ ] Add checkout button integration
- [ ] Add Suspense boundary for useSearchParams

### Phase 10: Feature Gating ❌
- [ ] Gate calculator card limit
- [ ] Gate PDF export on results page
- [ ] Gate calendar export on results page
- [ ] Gate What-If Scenarios page
- [ ] Gate Recommendations page
- [ ] Gate Priority Allocation
- [ ] Add premium badges to locked features

### Phase 11: Settings Subscription Section ❌
- [ ] Add subscription info display
- [ ] Add "Manage Subscription" button (Stripe Portal)
- [ ] Show billing period and status
- [ ] Show cancel status if applicable

### Phase 12: Testing ❌
- [ ] Install Stripe CLI
- [ ] Test webhook with `stripe listen`
- [ ] Add subscription store unit tests
- [ ] Add E2E tests for subscription flow

---

## Stripe Dashboard Tasks

- [ ] Create Product: "CardTempo Premium"
- [ ] Create Monthly Price: $9.99/month → copy ID to `STRIPE_PRICE_ID_MONTHLY`
- [ ] Create Annual Price: $79.99/year → copy ID to `STRIPE_PRICE_ID_ANNUAL`
- [ ] Configure Customer Portal settings
- [ ] Create Webhook Endpoint pointing to `/api/webhooks/stripe`
- [ ] Select events to listen for (see Phase 5)

---

## Commands

```bash
# Apply database migration
supabase db push

# Start local webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test webhook events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed

# Build and check types
npm run build
```

---

## Next Steps

1. **Run database migration**: `supabase db push`
2. **Create Stripe products/prices** in Dashboard
3. **Continue from Phase 5**: Create API routes
4. **Copy code from** `PAYWALL_IMPLEMENTATION.md` for each phase
