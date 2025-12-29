'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PriorityCardDisplay } from '@/components/PriorityCardDisplay';
import {
  CardForRanking,
  rankCardsByPriority,
  allocateForMaxScoreImpact,
  allocateForMinInterest,
  allocateForUtilization,
  allocateEqually,
  AllocationStrategy,
} from '@/lib/priorityRanking';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  Calculator,
  Zap,
  Percent,
  Equal,
  Home,
  LayoutDashboard,
  CreditCard as CreditCardIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCalculatorStore } from '@/store/calculator-store';

export default function PriorityRankingPage() {
  const { cards: userCards } = useCalculatorStore();

  // Convert user's cards to CardForRanking format
  const cards = useMemo<CardForRanking[]>(() => {
    return userCards.map(card => ({
      id: card.id,
      name: card.nickname,
      currentBalance: card.currentBalance,
      creditLimit: card.creditLimit,
      apr: card.apr || 18.0, // Default APR if not set
      minimumPayment: Math.max(25, card.currentBalance * 0.02), // 2% or $25 minimum
      statementDate: card.statementDate,
      dueDate: card.dueDate,
    }));
  }, [userCards]);
  const [budget, setBudget] = useState<number>(1000);
  const [selectedStrategy, setSelectedStrategy] = useState<
    'max_score' | 'min_interest' | 'utilization_focus' | 'equal_distribution'
  >('max_score');

  // Calculate minimums and optimal
  const totalMinimums = useMemo(() => {
    return cards.reduce((sum, card) => sum + card.minimumPayment, 0);
  }, [cards]);

  const totalBalance = useMemo(() => {
    return cards.reduce((sum, card) => sum + card.currentBalance, 0);
  }, [cards]);

  const optimalPayment = useMemo(() => {
    const totalLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
    const optimalBalance = totalLimit * 0.05; // 5% utilization
    return totalBalance - optimalBalance;
  }, [cards, totalBalance]);

  // Get current allocation strategy
  const currentAllocation = useMemo<AllocationStrategy | null>(() => {
    if (budget < totalMinimums) return null;

    try {
      switch (selectedStrategy) {
        case 'max_score':
          return allocateForMaxScoreImpact(cards, budget);
        case 'min_interest':
          return allocateForMinInterest(cards, budget);
        case 'utilization_focus':
          return allocateForUtilization(cards, budget);
        case 'equal_distribution':
          return allocateEqually(cards, budget);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }, [cards, budget, selectedStrategy, totalMinimums]);

  // Get priority scores
  const priorityScores = useMemo(() => {
    return rankCardsByPriority(cards);
  }, [cards]);

  const isBelowMinimums = budget < totalMinimums;
  const availableForOptimization = Math.max(0, budget - totalMinimums);
  const percentOfOptimal = Math.min((budget / optimalPayment) * 100, 100);

  // Show message if no cards
  if (cards.length === 0) {
    return (
      <div className="min-h-screen">
        {/* Navigation Header */}
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <CreditCardIcon className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Credit Optimizer</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card>
            <CardContent className="p-12 text-center">
              <CreditCardIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Credit Cards Added</h2>
              <p className="text-muted-foreground mb-6">
                Add your credit cards in the calculator to see smart payment allocation recommendations.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/calculator">
                  <Button className="gap-2">
                    <Calculator className="h-4 w-4" />
                    Go to Calculator
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <CreditCardIcon className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Credit Optimizer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Smart Payment Allocation</h1>
          <p className="text-muted-foreground">
            Maximize your credit score impact with a limited budget
          </p>
        </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Card Debt</p>
            <p className="text-2xl font-bold">${totalBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Optimal Payment</p>
            <p className="text-2xl font-bold">${optimalPayment.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Your Budget</p>
            <p className="text-2xl font-bold text-primary">${budget.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Efficiency</p>
            <p className="text-2xl font-bold text-green-600">{percentOfOptimal.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Budget Input */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Configuration
              </CardTitle>
              <CardDescription>How much can you pay this month?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Number Input */}
              <div className="space-y-2">
                <Label htmlFor="budget">Payment Budget</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    className="pl-9 text-lg font-semibold"
                    min={0}
                    max={totalBalance}
                  />
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <Label>Adjust Amount</Label>
                <Slider
                  value={[budget]}
                  onValueChange={([value]) => setBudget(value)}
                  min={0}
                  max={Math.ceil(optimalPayment * 1.2)}
                  step={50}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>${(optimalPayment * 1.2).toLocaleString()}</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBudget(500)}
                    className={budget === 500 ? 'border-primary' : ''}
                  >
                    $500
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBudget(1000)}
                    className={budget === 1000 ? 'border-primary' : ''}
                  >
                    $1,000
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBudget(1500)}
                    className={budget === 1500 ? 'border-primary' : ''}
                  >
                    $1,500
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBudget(2000)}
                    className={budget === 2000 ? 'border-primary' : ''}
                  >
                    $2,000
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBudget(Math.round(totalMinimums))}
                    className="col-span-2"
                  >
                    Minimums Only (${totalMinimums.toLocaleString()})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBudget(Math.round(optimalPayment))}
                    className="col-span-2"
                  >
                    Full Optimal (${optimalPayment.toLocaleString()})
                  </Button>
                </div>
              </div>

              {/* Budget Breakdown */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total minimums required:</span>
                  <span className="font-semibold">${totalMinimums.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available for optimization:</span>
                  <span className="font-semibold text-primary">
                    ${availableForOptimization.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Percentage of optimal:</span>
                  <span className="font-semibold text-green-600">
                    {percentOfOptimal.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Validation */}
              {isBelowMinimums && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Budget is below required minimums. You need at least $
                    {totalMinimums.toLocaleString()} to avoid late fees.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Impact Summary Card */}
          {currentAllocation && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Expected Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Utilization Change</span>
                  <span className="font-bold text-lg">
                    {currentAllocation.expectedImpact.overallUtilizationBefore.toFixed(1)}% →{' '}
                    {currentAllocation.expectedImpact.overallUtilizationAfter.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Est. Score Impact</span>
                  <span className="font-bold text-lg text-green-600">
                    +{currentAllocation.expectedImpact.estimatedScoreImpact} points
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Interest Saved</span>
                  <span className="font-bold text-lg">
                    ${currentAllocation.expectedImpact.interestSaved.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cards Under 30%</span>
                  <span className="font-bold text-lg">
                    {currentAllocation.expectedImpact.cardsUnder30Percent}/{cards.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Strategy Selection and Results */}
        <div className="lg:col-span-2 space-y-6">
          {!isBelowMinimums && currentAllocation ? (
            <>
              {/* Strategy Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Allocation Strategy</CardTitle>
                  <CardDescription>Choose how to distribute your payment budget</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedStrategy} onValueChange={(v) => setSelectedStrategy(v as 'max_score' | 'min_interest' | 'utilization_focus' | 'equal_distribution')}>
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="max_score" className="gap-2">
                        <Zap className="h-3 w-3" />
                        <span className="hidden sm:inline">Max Score</span>
                      </TabsTrigger>
                      <TabsTrigger value="min_interest" className="gap-2">
                        <DollarSign className="h-3 w-3" />
                        <span className="hidden sm:inline">Min Interest</span>
                      </TabsTrigger>
                      <TabsTrigger value="utilization_focus" className="gap-2">
                        <Percent className="h-3 w-3" />
                        <span className="hidden sm:inline">Utilization</span>
                      </TabsTrigger>
                      <TabsTrigger value="equal_distribution" className="gap-2">
                        <Equal className="h-3 w-3" />
                        <span className="hidden sm:inline">Equal</span>
                      </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-1">{currentAllocation.name}</h4>
                      <p className="text-sm text-muted-foreground">{currentAllocation.description}</p>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Allocation Results */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Your Payment Plan</h2>
                {currentAllocation.allocations
                  .sort((a, b) => a.priorityRank - b.priorityRank)
                  .map((allocation) => {
                    const card = cards.find((c) => c.id === allocation.cardId)!;
                    const priorityScore = priorityScores.find((p) => p.cardId === allocation.cardId)!;

                    return (
                      <PriorityCardDisplay
                        key={allocation.cardId}
                        allocation={allocation}
                        priorityScore={priorityScore}
                        currentBalance={card.currentBalance}
                        creditLimit={card.creditLimit}
                        apr={card.apr}
                        statementDate={card.statementDate}
                      />
                    );
                  })}
              </div>

              {/* What You're Getting/Missing */}
              <Card>
                <CardHeader>
                  <CardTitle>Trade-Off Analysis</CardTitle>
                  <CardDescription>What you achieve vs what you need for optimal results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        What You Achieve
                      </h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>All cards paid at least minimum (avoid late fees)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>
                            {currentAllocation.expectedImpact.cardsUnder30Percent} card(s) under 30%
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>
                            Overall utilization: {currentAllocation.expectedImpact.overallUtilizationAfter.toFixed(1)}%
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>
                            ${currentAllocation.expectedImpact.interestSaved.toFixed(2)} saved in interest
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>
                            Estimated +{currentAllocation.expectedImpact.estimatedScoreImpact} point score improvement
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      {budget >= optimalPayment ? (
                        // Show success message when budget is optimal or more
                        <>
                          <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Optimal Allocation Achieved!
                          </h3>
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 mb-2 font-medium">
                              🎉 You have enough budget to achieve optimal results!
                            </p>
                            <ul className="space-y-1 text-sm text-green-700">
                              <li>✓ All cards in optimal range (under 10% utilization)</li>
                              <li>✓ Maximum credit score impact achieved</li>
                              <li>✓ Maximum interest savings</li>
                            </ul>
                          </div>
                        </>
                      ) : (
                        // Show what's missing when budget is below optimal
                        <>
                          <h3 className="font-semibold mb-3 text-amber-700 flex items-center gap-2">
                            <X className="h-4 w-4" />
                            What You&apos;re Missing
                          </h3>
                          <ul className="space-y-2 text-sm">
                            {cards.length - currentAllocation.expectedImpact.cardsOptimal > 0 && (
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 mt-0.5">✗</span>
                                <span>
                                  {cards.length - currentAllocation.expectedImpact.cardsOptimal} card(s) not in optimal range (under 10%)
                                </span>
                              </li>
                            )}
                            {optimalPayment > budget && (
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 mt-0.5">✗</span>
                                <span>
                                  Need ${(optimalPayment - budget).toLocaleString()} more for optimal results
                                </span>
                              </li>
                            )}
                            {currentAllocation.expectedImpact.percentOfOptimalAchieved < 100 && (
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 mt-0.5">✗</span>
                                <span>
                                  Achieving {currentAllocation.expectedImpact.percentOfOptimalAchieved}% of optimal impact
                                </span>
                              </li>
                            )}
                            {cards.length - currentAllocation.expectedImpact.cardsOptimal === 0 &&
                             optimalPayment <= budget && (
                              <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span className="text-green-700">
                                  All optimization goals met!
                                </span>
                              </li>
                            )}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Apply This Allocation
                </Button>
                <Button variant="outline" className="gap-2">
                  Set Payment Reminders
                </Button>
                <Button variant="outline" className="gap-2">
                  Download Schedule
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isBelowMinimums ? 'Budget Too Low' : 'Set Your Budget'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isBelowMinimums
                    ? `You need at least $${totalMinimums.toLocaleString()} to cover minimum payments.`
                    : 'Enter your available budget to see the optimal payment allocation.'}
                </p>
                <Link href="/calculator">
                  <Button variant="outline">
                    Go to Full Calculator
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
