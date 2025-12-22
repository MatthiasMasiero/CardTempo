'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCardForm } from '@/components/CreditCardForm';
import { CardDisplay } from '@/components/CardDisplay';
import { useCalculatorStore } from '@/store/calculator-store';
import { useAuthStore } from '@/store/auth-store';
import { CreditCard, CreditCardFormData } from '@/types';
import {
  CreditCard as CreditCardIcon,
  Plus,
  Calculator,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';

export default function CalculatorPage() {
  const { cards, addCard, removeCard, calculateResults, result, clearResults } =
    useCalculatorStore();
  const { isAuthenticated } = useAuthStore();

  const [showForm, setShowForm] = useState(cards.length === 0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddCard = (formData: CreditCardFormData) => {
    const card: Omit<CreditCard, 'id'> = {
      nickname: formData.nickname,
      creditLimit: parseFloat(formData.creditLimit),
      currentBalance: parseFloat(formData.currentBalance),
      statementDate: parseInt(formData.statementDate),
      dueDate: parseInt(formData.dueDate),
      apr: formData.apr ? parseFloat(formData.apr) : undefined,
    };
    addCard(card);
    setShowForm(false);
    clearResults();
  };

  const handleRemoveCard = (id: string) => {
    removeCard(id);
    clearResults();
    if (cards.length === 1) {
      setShowForm(true);
    }
  };

  const handleCalculate = () => {
    calculateResults();
  };

  // Hydration fix
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <CreditCardIcon className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Credit Optimizer</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CreditCardIcon className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Credit Optimizer</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Credit Card Calculator</h1>
            <p className="text-muted-foreground">
              Enter your credit card details to get an optimized payment strategy
            </p>
          </div>

          {/* Cards Grid */}
          {cards.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Cards</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Card
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <CardDisplay
                    key={card.id}
                    card={card}
                    onRemove={() => handleRemoveCard(card.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add Card Form */}
          {showForm && (
            <div className="mb-6">
              <CreditCardForm
                index={cards.length}
                onSubmit={handleAddCard}
                onRemove={cards.length > 0 ? () => setShowForm(false) : undefined}
                showRemove={cards.length > 0}
              />
            </div>
          )}

          {/* Empty State */}
          {cards.length === 0 && !showForm && (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">No cards added yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first credit card to get started
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Card
              </Button>
            </Card>
          )}

          {/* Calculate Button */}
          {cards.length > 0 && !showForm && (
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">
                      Ready to optimize {cards.length} card{cards.length > 1 ? 's' : ''}?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Get your personalized payment plan to improve your credit score
                    </p>
                  </div>
                  {result ? (
                    <Link href="/results">
                      <Button size="lg" className="gap-2">
                        View Results
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button size="lg" onClick={handleCalculate} className="gap-2">
                      <Calculator className="h-4 w-4" />
                      Calculate Optimal Strategy
                    </Button>
                  )}
                </div>

                {result && (
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {result.currentOverallUtilization.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Current</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {result.optimizedOverallUtilization.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Optimized</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          -{result.utilizationImprovement.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Improvement</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {result.estimatedScoreImpact.min === result.estimatedScoreImpact.max
                            ? `+${result.estimatedScoreImpact.min} pts`
                            : `+${result.estimatedScoreImpact.min} to +${result.estimatedScoreImpact.max} pts`}
                        </p>
                        <p className="text-xs text-muted-foreground">Score Impact</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tips Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Enter your current balance as of today, not your statement balance
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Statement date is when your billing cycle closes and balance is reported
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Due date is when payment must be received to avoid late fees
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Add all your credit cards for the most accurate overall utilization
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
