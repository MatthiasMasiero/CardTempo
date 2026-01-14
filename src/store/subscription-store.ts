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
