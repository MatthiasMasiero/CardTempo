'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lock, Crown, ArrowRight, Zap, CreditCard } from 'lucide-react';
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'inline-flex items-center gap-2 text-sm text-stone-500',
          className
        )}
      >
        <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center">
          <Lock className="h-2.5 w-2.5 text-stone-400" />
        </div>
        <span>{feature ? `${feature} requires Premium` : 'Premium feature'}</span>
        <button
          onClick={handleUpgradeClick}
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          Upgrade
          <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </motion.div>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-r from-stone-50 via-white to-stone-50 p-5',
          className
        )}
      >
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Crown className="h-6 w-6 text-emerald-600" />
              </div>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-xl bg-emerald-400/20 blur-md -z-10" />
            </div>
            <div>
              <p className="font-display text-stone-900">
                {feature || 'Premium Feature'}
              </p>
              {description && (
                <p className="text-sm text-stone-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <Button
            onClick={handleUpgradeClick}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all rounded-lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </motion.div>
    );
  }

  // Default: card variant - premium feeling upgrade card
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        'relative overflow-hidden border-stone-200 bg-gradient-to-br from-white via-stone-50/50 to-white',
        className
      )}>
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        <CardHeader className="text-center pb-4 relative">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative mx-auto mb-4"
          >
            {/* Icon container with glow */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-100 to-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Crown className="h-8 w-8 text-emerald-600" />
            </div>
            {/* Animated glow ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-teal-400/20 blur-lg animate-pulse" />
          </motion.div>
          <CardTitle className="font-display text-xl text-stone-900">
            {feature || 'Premium Feature'}
          </CardTitle>
          {description && (
            <CardDescription className="text-stone-500 mt-2">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="text-center pb-8 relative">
          <Button
            onClick={handleUpgradeClick}
            className="w-full sm:w-auto px-8 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
          <p className="mt-4 text-xs text-stone-400">
            Starting at $2.50/month with annual billing
          </p>
        </CardContent>
      </Card>
    </motion.div>
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
      className={cn(
        'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/50 hover:from-emerald-100 hover:to-teal-100 transition-colors',
        className
      )}
    >
      <Sparkles className="mr-1 h-3 w-3 text-emerald-500" />
      Premium
    </Badge>
  );
}

/**
 * More prominent premium badge with glow effect for important features.
 */
export function PremiumBadgeGlow({ className }: { className?: string }) {
  const { isPremium } = useSubscriptionStore();

  if (isPremium) return null;

  return (
    <div className={cn('relative inline-block', className)}>
      <Badge className="relative bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-md shadow-emerald-500/25 px-3 py-1">
        <Crown className="mr-1.5 h-3 w-3" />
        Premium
      </Badge>
      {/* Subtle animated glow */}
      <div className="absolute inset-0 rounded-md bg-emerald-400/30 blur-sm animate-pulse" />
    </div>
  );
}

/**
 * Banner shown when user is approaching or at card limit.
 * Redesigned to be helpful and encouraging rather than restrictive.
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl p-5',
        isAtLimit
          ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200'
          : 'bg-gradient-to-r from-stone-50 via-white to-stone-50 border border-stone-200',
        className
      )}
    >
      {/* Top accent line */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-0.5',
          isAtLimit
            ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400'
            : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400'
        )}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                isAtLimit
                  ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                  : 'bg-gradient-to-br from-emerald-100 to-teal-100'
              )}
            >
              {isAtLimit ? (
                <CreditCard className="h-6 w-6 text-amber-600" />
              ) : (
                <Zap className="h-6 w-6 text-emerald-600" />
              )}
            </div>
          </div>
          <div>
            <p
              className={cn(
                'font-display',
                isAtLimit ? 'text-amber-900' : 'text-stone-900'
              )}
            >
              {isAtLimit
                ? `You've added ${currentCount} of ${features.maxCards} cards`
                : `${features.maxCards - currentCount} card slot${features.maxCards - currentCount === 1 ? '' : 's'} remaining`}
            </p>
            <p
              className={cn(
                'text-sm mt-0.5',
                isAtLimit ? 'text-amber-700' : 'text-stone-500'
              )}
            >
              {isAtLimit
                ? 'Upgrade to add unlimited cards and unlock all features'
                : 'Upgrade anytime to track all your credit cards'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/pricing')}
          className={cn(
            'shadow-md transition-all rounded-lg',
            isAtLimit
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/20 hover:shadow-amber-500/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30'
          )}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isAtLimit ? 'Unlock Unlimited' : 'Upgrade'}
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Compact upgrade nudge for inline use in feature lists or menus.
 */
export function UpgradeNudge({
  feature,
  className,
}: {
  feature?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push('/pricing')}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-700 text-sm font-medium hover:from-emerald-100 hover:to-teal-100 transition-colors',
        className
      )}
    >
      <Crown className="h-4 w-4 text-emerald-600" />
      <span>{feature ? `Unlock ${feature}` : 'Upgrade to Premium'}</span>
      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
    </motion.button>
  );
}
