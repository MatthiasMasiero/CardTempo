'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  XCircle,
  RefreshCw,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/calculator-store';
import { PremiumGate } from '@/components/PremiumGate';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { ScenarioComparison } from '@/components/scenarios/ScenarioComparison';
import { PaymentScenario } from '@/components/scenarios/PaymentScenario';
import { PurchaseScenario } from '@/components/scenarios/PurchaseScenario';
import { LimitIncreaseScenario } from '@/components/scenarios/LimitIncreaseScenario';
import { NewCardScenario } from '@/components/scenarios/NewCardScenario';
import { CloseCardScenario } from '@/components/scenarios/CloseCardScenario';
import { BalanceTransferScenario } from '@/components/scenarios/BalanceTransferScenario';
import { ScenarioResult, calculateBaseline } from '@/lib/scenarioCalculations';

type ScenarioType =
  | 'payment'
  | 'purchase'
  | 'limit'
  | 'newcard'
  | 'close'
  | 'transfer'
  | null;

export default function ScenariosPage() {
  const { cards } = useCalculatorStore();
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(null);
  const [baselineScenario, setBaselineScenario] = useState<ScenarioResult | null>(null);
  const [currentScenario, setCurrentScenario] = useState<ScenarioResult | null>(null);

  // Initialize baseline on mount
  useEffect(() => {
    if (cards.length > 0 && !baselineScenario) {
      const baseline = calculateBaseline(cards);
      setBaselineScenario(baseline);
      setCurrentScenario(baseline);
    }
  }, [cards, baselineScenario]);

  const scenarios = [
    {
      id: 'payment' as ScenarioType,
      title: 'Adjust Payment Amount',
      description: 'See how different payment amounts affect your utilization and score',
      icon: DollarSign,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-l-blue-500',
      badge: 'Popular',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    {
      id: 'purchase' as ScenarioType,
      title: 'Test Large Purchase',
      description: 'Simulate a big expense and find the best timing to minimize impact',
      icon: ShoppingCart,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-l-purple-500',
      badge: 'Popular',
      badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
    },
    {
      id: 'limit' as ScenarioType,
      title: 'Credit Limit Increase',
      description: 'See how a higher credit limit instantly improves your utilization',
      icon: TrendingUp,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      borderColor: 'border-l-emerald-500',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'newcard' as ScenarioType,
      title: 'Open New Card',
      description: 'Understand the short-term and long-term credit score impacts',
      icon: CreditCard,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      borderColor: 'border-l-amber-500',
      badge: 'Advanced',
      badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    {
      id: 'close' as ScenarioType,
      title: 'Close a Card',
      description: 'Discover why closing cards usually hurts your score',
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-l-red-500',
      badge: 'Caution',
      badgeColor: 'bg-red-50 text-red-700 border border-red-200',
    },
    {
      id: 'transfer' as ScenarioType,
      title: 'Balance Transfer',
      description: 'Calculate fees vs savings and optimal utilization balance',
      icon: RefreshCw,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      borderColor: 'border-l-indigo-500',
      badge: 'Advanced',
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    },
  ];

  const handleScenarioUpdate = (scenario: ScenarioResult) => {
    setCurrentScenario(scenario);
  };

  const handleApplyScenario = () => {
    if (currentScenario) {
      setBaselineScenario(currentScenario);
      setActiveScenario(null);
      alert('Scenario applied! This is now your new baseline.');
    }
  };

  const handleResetScenario = () => {
    if (cards.length > 0) {
      const baseline = calculateBaseline(cards);
      setBaselineScenario(baseline);
      setCurrentScenario(baseline);
      setActiveScenario(null);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-body py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="font-display text-3xl text-stone-900 mb-4">No Credit Cards Found</h1>
            <p className="text-stone-600 mb-8">
              You need to add credit cards in the calculator first before you can test scenarios.
            </p>
            <Link href="/calculator">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Calculator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      {/* Navigation Header */}
      <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-stone-900">CardTempo</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2 border-stone-300">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="font-display text-3xl text-stone-900">What-If Scenarios</h1>
          </div>
          <p className="text-stone-600 ml-13">
            Test different financial decisions risk-free and see real-time credit score impact
          </p>
        </div>
      </div>

      <PremiumGate
        feature="hasWhatIfScenarios"
        fallback={
          <div className="container mx-auto px-4 py-12 max-w-2xl">
            <UpgradePrompt
              variant="card"
              feature="What-If Scenarios"
              description="Test different financial decisions risk-free and see how they would affect your credit score. Upgrade to Premium to unlock this powerful planning tool."
            />
          </div>
        }
      >
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Scenario Cards */}
            <div className="lg:col-span-2">
              {!activeScenario ? (
                <>
                  <div className="mb-8">
                    <h2 className="font-display text-2xl text-stone-900 mb-2">Choose a Scenario</h2>
                    <p className="text-stone-600">
                    Select a what-if scenario to see how it would affect your credit score
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {scenarios.map((scenario) => (
                    <Card
                      key={scenario.id}
                      className={`border-l-4 ${scenario.borderColor} border-stone-200 hover:border-stone-300 hover:shadow-md transition-all cursor-pointer group bg-white`}
                      onClick={() => setActiveScenario(scenario.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-12 h-12 rounded-xl ${scenario.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}
                          >
                            <scenario.icon className={`w-6 h-6 ${scenario.iconColor}`} />
                          </div>
                          {scenario.badge && (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium ${scenario.badgeColor}`}
                            >
                              {scenario.badge}
                            </span>
                          )}
                        </div>
                        <CardTitle className="font-display text-lg text-stone-900 group-hover:text-stone-700 transition-colors">
                          {scenario.title}
                        </CardTitle>
                        <CardDescription className="text-stone-500">{scenario.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:gap-2 transition-all">
                          <span>Explore Scenario</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div>
                {/* Scenario Tabs */}
                <div className="mb-6">
                  <div className="border-b border-stone-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                      {/* Back to Overview Tab */}
                      <button
                        onClick={() => setActiveScenario(null)}
                        className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowLeft className="w-4 h-4" />
                          All Scenarios
                        </div>
                      </button>

                      {/* Scenario Tabs */}
                      {scenarios.map((scenario) => {
                        const isActive = activeScenario === scenario.id;
                        return (
                          <button
                            key={scenario.id}
                            onClick={() => setActiveScenario(scenario.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                              isActive
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <scenario.icon className={`w-4 h-4 ${isActive ? scenario.iconColor : ''}`} />
                              <span className="hidden sm:inline">{scenario.title}</span>
                            </div>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* Render Active Scenario - key prop forces reset when switching tabs or applying */}
                {activeScenario === 'payment' && baselineScenario && (
                  <PaymentScenario
                    key={`payment-${activeScenario}-${JSON.stringify(baselineScenario.cards.map(c => c.currentBalance))}`}
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'purchase' && baselineScenario && (
                  <PurchaseScenario
                    key={`purchase-${activeScenario}-${JSON.stringify(baselineScenario.cards.map(c => c.currentBalance))}`}
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'limit' && baselineScenario && (
                  <LimitIncreaseScenario
                    key={`limit-${activeScenario}-${JSON.stringify(baselineScenario.cards.map(c => c.creditLimit))}`}
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'newcard' && baselineScenario && (
                  <NewCardScenario
                    key={`newcard-${activeScenario}-${baselineScenario.metrics.totalCreditLimit}`}
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'close' && baselineScenario && (
                  <CloseCardScenario
                    key={`close-${activeScenario}-${baselineScenario.cards.length}`}
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'transfer' && baselineScenario && (
                  <BalanceTransferScenario
                    key={`transfer-${activeScenario}-${JSON.stringify(baselineScenario.cards.map(c => c.currentBalance))}`}
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
              </div>
            )}
          </div>

            {/* Right Column: Comparison Panel (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {baselineScenario && currentScenario && (
                  <ScenarioComparison
                    baseline={baselineScenario}
                    scenario={currentScenario}
                    onApply={handleApplyScenario}
                    onReset={handleResetScenario}
                    showActions={activeScenario !== null}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </PremiumGate>
    </div>
  );
}
