'use client';

import { Suspense, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  Zap,
  ChevronRight,
} from 'lucide-react';

const PRICING = {
  monthly: {
    amount: 3.99,
    label: 'month',
  },
  annual: {
    amount: 29.99,
    monthlyEquivalent: 2.50,
    label: 'year',
    savings: '37%',
  },
};

// Reveal animation component
function RevealOnScroll({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageSkeleton />}>
      <PricingPageContent />
    </Suspense>
  );
}

function PricingPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="h-12 w-64 mx-auto bg-stone-200 rounded-lg animate-pulse" />
          <div className="h-6 w-96 mx-auto mt-4 bg-stone-200 rounded-lg animate-pulse" />
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

  const upgradeCanceled = searchParams.get('upgrade') === 'canceled';

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
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
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      {/* Header */}
      <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-stone-900">CardTempo</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 mb-6"
            >
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Simple, transparent pricing</span>
            </motion.div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-4">
              Unlock your full{' '}
              <span className="text-emerald-600">credit potential</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto">
              Get personalized insights, unlimited cards, and powerful tools to maximize your credit score improvement.
            </p>

            {/* Status Messages */}
            {upgradeCanceled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 max-w-md mx-auto"
              >
                No worries! Take your time to decide. Your data is safe.
              </motion.div>
            )}

            {isPremium && !isGrandfathered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 max-w-md mx-auto"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="font-display text-lg text-emerald-900 mb-1">You&apos;re a Premium member!</p>
                <p className="text-sm text-emerald-700 mb-4">Thank you for your support.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage Subscription
                </Button>
              </motion.div>
            )}

            {isGrandfathered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 max-w-md mx-auto"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="font-display text-lg text-blue-900 mb-1">Early Adopter Status</p>
                <p className="text-sm text-blue-700">
                  You have complimentary Premium access until{' '}
                  {subscription?.grandfatheredUntil?.toLocaleDateString()}
                </p>
              </motion.div>
            )}
          </div>
        </RevealOnScroll>

        {/* Billing Toggle */}
        {!isPremium && (
          <RevealOnScroll delay={0.1}>
            <div className="flex items-center justify-center gap-4 mb-12">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isAnnual
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isAnnual
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Annual
                {isAnnual && (
                  <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 font-semibold">
                    SAVE {PRICING.annual.savings}
                  </Badge>
                )}
              </button>
            </div>
          </RevealOnScroll>
        )}

        {/* Pricing Cards */}
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Free Tier */}
            <RevealOnScroll delay={0.2}>
              <Card className="relative border-stone-200 bg-white h-full">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="font-display text-2xl text-stone-900 mb-2">Free</h3>
                    <p className="text-stone-500">Perfect for getting started</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl text-stone-900">$0</span>
                      <span className="text-stone-500">/forever</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {features.map(({ key, free }) => (
                      <li key={key} className="flex items-start gap-3">
                        {free ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="h-3 w-3 text-stone-400" />
                          </div>
                        )}
                        <span className={`text-sm ${!free ? 'text-stone-400' : 'text-stone-700'}`}>
                          {FEATURE_DESCRIPTIONS[key].title}
                          {typeof free === 'string' && (
                            <span className="ml-1 text-stone-500">({free})</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {!isAuthenticated ? (
                    <Button
                      className="w-full h-12 rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
                      variant="outline"
                      onClick={() => router.push('/signup')}
                    >
                      Get Started Free
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-12 rounded-xl border-stone-300 text-stone-500"
                      variant="outline"
                      disabled
                    >
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            </RevealOnScroll>

            {/* Premium Tier */}
            <RevealOnScroll delay={0.3}>
              <div className="relative">
                {/* Badge - changes based on billing period */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-1.5 text-sm font-semibold shadow-lg shadow-emerald-500/25 border-0">
                    {isAnnual ? (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Best Value
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Full Access
                      </>
                    )}
                  </Badge>
                </div>

                <Card className="relative border-2 border-emerald-500 bg-white h-full overflow-hidden">
                  {/* Gradient accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02]">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)`,
                      backgroundSize: '24px 24px',
                    }}
                  />
                </div>

                <CardContent className="p-8 pt-10 relative">
                  <div className="mb-6">
                    <h3 className="font-display text-2xl text-stone-900 mb-2">Premium</h3>
                    <p className="text-stone-500">For serious credit optimizers</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl text-stone-900">
                        ${isAnnual ? PRICING.annual.monthlyEquivalent.toFixed(2) : PRICING.monthly.amount.toFixed(2)}
                      </span>
                      <span className="text-stone-500">/month</span>
                    </div>
                    {isAnnual && (
                      <p className="mt-2 text-sm text-stone-500">
                        Billed ${PRICING.annual.amount}/year
                        <span className="ml-2 text-emerald-600 font-medium">
                          Save ${((PRICING.monthly.amount * 12) - PRICING.annual.amount).toFixed(2)}/year
                        </span>
                      </p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {features.map(({ key, premium }) => (
                      <li key={key} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-sm text-stone-700">
                          {FEATURE_DESCRIPTIONS[key].title}
                          {typeof premium === 'string' && (
                            <span className="ml-1 text-emerald-600 font-medium">({premium})</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isPremium && !isGrandfathered ? (
                    <Button
                      className="w-full h-12 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
                      onClick={handleUpgrade}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Crown className="mr-2 h-4 w-4" />
                      )}
                      {isGrandfathered ? 'Subscribe Now' : 'Upgrade to Premium'}
                    </Button>
                  )}
                </CardContent>
                </Card>
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {/* Trust Signals */}
        <RevealOnScroll delay={0.4}>
          <div className="mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Secure payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </RevealOnScroll>

        {/* FAQ Section */}
        <RevealOnScroll delay={0.5}>
          <div className="mx-auto mt-24 max-w-2xl">
            <h2 className="font-display text-3xl text-stone-900 text-center mb-10">
              Common questions
            </h2>
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-xl border border-stone-200">
                <h3 className="font-display text-lg text-stone-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-stone-600 leading-relaxed">
                  Yes! You can cancel your subscription at any time from your settings. You&apos;ll keep
                  Premium access until the end of your billing period with no additional charges.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-stone-200">
                <h3 className="font-display text-lg text-stone-900 mb-2">What happens to my data if I downgrade?</h3>
                <p className="text-stone-600 leading-relaxed">
                  Your data is always safe. If you downgrade, you&apos;ll keep access to
                  your first 2 cards. Premium features will be locked until you upgrade again,
                  but nothing is deleted.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl border border-stone-200">
                <h3 className="font-display text-lg text-stone-900 mb-2">Is my payment information secure?</h3>
                <p className="text-stone-600 leading-relaxed">
                  Absolutely. We use Stripe, one of the world&apos;s most trusted payment processors.
                  Your card details never touch our servers and are protected by bank-level encryption.
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* Final CTA */}
        {!isPremium && (
          <RevealOnScroll delay={0.6}>
            <div className="mt-24 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 text-stone-600 text-sm mb-6">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Join thousands of credit optimizers
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-stone-900 mb-4">
                Ready to take control?
              </h2>
              <p className="text-stone-600 mb-8 max-w-md mx-auto">
                Start with our free plan or unlock all features with Premium.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Crown className="mr-2 h-4 w-4" />
                  )}
                  Get Premium
                </Button>
                <Link href="/calculator">
                  <Button
                    variant="outline"
                    className="h-12 px-8 rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
                  >
                    Try Free First
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-stone-200 flex items-center justify-center">
                <CreditCard className="h-3 w-3 text-stone-500" />
              </div>
              <span>CardTempo</span>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-stone-700 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-stone-700 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
