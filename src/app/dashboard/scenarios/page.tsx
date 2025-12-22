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
  const { cards, result } = useCalculatorStore();
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
      color: 'bg-blue-500',
      badge: 'Popular',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'purchase' as ScenarioType,
      title: 'Test Large Purchase',
      description: 'Simulate a big expense and find the best timing to minimize impact',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      badge: 'Popular',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'limit' as ScenarioType,
      title: 'Credit Limit Increase',
      description: 'See how a higher credit limit instantly improves your utilization',
      icon: TrendingUp,
      color: 'bg-green-500',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'newcard' as ScenarioType,
      title: 'Open New Card',
      description: 'Understand the short-term and long-term credit score impacts',
      icon: CreditCard,
      color: 'bg-yellow-500',
      badge: 'Advanced',
      badgeColor: 'bg-yellow-100 text-yellow-700',
    },
    {
      id: 'close' as ScenarioType,
      title: 'Close a Card',
      description: 'Discover why closing cards usually hurts your score',
      icon: XCircle,
      color: 'bg-red-500',
      badge: 'Caution',
      badgeColor: 'bg-red-100 text-red-700',
    },
    {
      id: 'transfer' as ScenarioType,
      title: 'Balance Transfer',
      description: 'Calculate fees vs savings and optimal utilization balance',
      icon: RefreshCw,
      color: 'bg-indigo-500',
      badge: 'Advanced',
      badgeColor: 'bg-indigo-100 text-indigo-700',
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-2xl mx-auto text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-blue-500" />
            <h1 className="text-3xl font-bold mb-4">No Credit Cards Found</h1>
            <p className="text-gray-600 mb-8">
              You need to add credit cards in the calculator first before you can test scenarios.
            </p>
            <Link href="/calculator">
              <Button size="lg">
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">What-If Scenarios</h1>
          </div>
          <p className="text-xl text-gray-600">
            Test different financial decisions risk-free and see real-time credit score impact
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Scenario Cards */}
          <div className="lg:col-span-2">
            {!activeScenario ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">Choose a Scenario</h2>
                  <p className="text-gray-600">
                    Select a what-if scenario to see how it would affect your credit score
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {scenarios.map((scenario) => (
                    <Card
                      key={scenario.id}
                      className="hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => setActiveScenario(scenario.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-12 h-12 rounded-lg ${scenario.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}
                          >
                            <scenario.icon className="w-6 h-6" />
                          </div>
                          {scenario.badge && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${scenario.badgeColor}`}
                            >
                              {scenario.badge}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                          {scenario.title}
                        </CardTitle>
                        <CardDescription>{scenario.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
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
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto">
                      {/* Back to Overview Tab */}
                      <button
                        onClick={() => setActiveScenario(null)}
                        className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <scenario.icon className="w-4 h-4" />
                              <span className="hidden sm:inline">{scenario.title}</span>
                            </div>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* Render Active Scenario */}
                {activeScenario === 'payment' && baselineScenario && (
                  <PaymentScenario
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'purchase' && baselineScenario && (
                  <PurchaseScenario
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'limit' && baselineScenario && (
                  <LimitIncreaseScenario
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'newcard' && baselineScenario && (
                  <NewCardScenario
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'close' && baselineScenario && (
                  <CloseCardScenario
                    cards={cards}
                    onUpdate={handleScenarioUpdate}
                    baseline={baselineScenario}
                  />
                )}
                {activeScenario === 'transfer' && baselineScenario && (
                  <BalanceTransferScenario
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
    </div>
  );
}
