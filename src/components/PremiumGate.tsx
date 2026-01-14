'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSubscriptionStore } from '@/store/subscription-store';
import { TierFeatures, FEATURE_DESCRIPTIONS } from '@/types';
import { UpgradePrompt } from './UpgradePrompt';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock, Crown, Sparkles, ArrowRight } from 'lucide-react';

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

interface PremiumGateOverlayProps {
  /** The feature to check access for */
  feature: keyof TierFeatures;
  /** Content to show (blurred when locked) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Premium gate with an elegant blur overlay effect.
 * Shows the content blurred with a tasteful upgrade prompt overlay.
 *
 * Great for previewing features while making it clear they're locked.
 */
export function PremiumGateOverlay({
  feature,
  children,
  className,
}: PremiumGateOverlayProps) {
  const { canAccessFeature } = useSubscriptionStore();
  const router = useRouter();

  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  const featureInfo = FEATURE_DESCRIPTIONS[feature];

  return (
    <div className={cn('relative', className)}>
      {/* Blurred content */}
      <div className="select-none pointer-events-none" aria-hidden="true">
        <div className="blur-[6px] opacity-60">
          {children}
        </div>
      </div>

      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80 backdrop-blur-[2px]" />

        {/* Centered upgrade prompt */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative z-10 text-center px-6 py-8 max-w-sm"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="relative mx-auto mb-4"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Lock className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-emerald-400/20 blur-lg animate-pulse" />
          </motion.div>

          <h3 className="font-display text-xl text-stone-900 mb-2">
            {featureInfo.title}
          </h3>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            {featureInfo.description}
          </p>

          <Button
            onClick={() => router.push('/pricing')}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

interface PremiumGateInlineProps {
  /** The feature to check access for */
  feature: keyof TierFeatures;
  /** Content to show when user has access (typically a button or link) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Inline premium gate for buttons and interactive elements.
 * Replaces the element with a locked state that shows the feature is premium.
 */
export function PremiumGateInline({
  feature,
  children,
  className,
}: PremiumGateInlineProps) {
  const { canAccessFeature } = useSubscriptionStore();
  const router = useRouter();

  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  const featureInfo = FEATURE_DESCRIPTIONS[feature];

  return (
    <motion.button
      onClick={() => router.push('/pricing')}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-3 w-full p-4 rounded-xl border border-stone-200 bg-gradient-to-r from-stone-50 via-white to-stone-50 text-left hover:border-emerald-200 hover:from-emerald-50/50 hover:to-teal-50/50 transition-all group',
        className
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center group-hover:from-emerald-100 group-hover:to-teal-100 transition-colors">
        <Lock className="h-5 w-5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 group-hover:text-emerald-900 transition-colors flex items-center gap-2">
          {featureInfo.title}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
            PREMIUM
          </span>
        </p>
        <p className="text-sm text-stone-500 truncate">
          {featureInfo.description}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
    </motion.button>
  );
}

interface LockedFeatureCardProps {
  /** Title of the locked feature */
  title: string;
  /** Description of what the feature does */
  description: string;
  /** Icon component to display */
  icon: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A card that represents a locked premium feature.
 * Use for feature lists or comparison displays.
 */
export function LockedFeatureCard({
  title,
  description,
  icon,
  className,
}: LockedFeatureCardProps) {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-stone-200 bg-white p-6 cursor-pointer group',
        className
      )}
      onClick={() => router.push('/pricing')}
    >
      {/* Gradient accent on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center group-hover:from-emerald-100 group-hover:to-teal-100 transition-colors flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-stone-900 group-hover:text-emerald-900 transition-colors">
              {title}
            </h3>
            <Lock className="h-3.5 w-3.5 text-stone-400 group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-sm text-stone-500 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Upgrade hint on hover */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-gradient-to-t from-emerald-50 to-transparent"
      >
        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Click to unlock with Premium
        </p>
      </motion.div>
    </motion.div>
  );
}
