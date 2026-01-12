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
  const { cards, addCard, updateCard, removeCard, calculateResults, result, clearResults } =
    useCalculatorStore();
  const { isAuthenticated } = useAuthStore();

  const [showForm, setShowForm] = useState(cards.length === 0);
  const [mounted, setMounted] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to convert CreditCard to CreditCardFormData
  const cardToFormData = (card: CreditCard): CreditCardFormData => ({
    nickname: card.nickname,
    creditLimit: card.creditLimit.toString(),
    currentBalance: card.currentBalance.toString(),
    statementDate: card.statementDate.toString(),
    dueDate: card.dueDate.toString(),
    apr: card.apr?.toString() || '',
    imageUrl: card.imageUrl || '',
  });

  const handleAddCard = (formData: CreditCardFormData) => {
    if (editingCardId) {
      // UPDATE MODE
      updateCard(editingCardId, {
        nickname: formData.nickname,
        creditLimit: parseFloat(formData.creditLimit),
        currentBalance: parseFloat(formData.currentBalance),
        statementDate: parseInt(formData.statementDate),
        dueDate: parseInt(formData.dueDate),
        apr: formData.apr ? parseFloat(formData.apr) : undefined,
        imageUrl: formData.imageUrl || '/cards/default-card.svg',
      });
      setEditingCardId(null);
    } else {
      // CREATE MODE
      const card: Omit<CreditCard, 'id'> = {
        nickname: formData.nickname,
        creditLimit: parseFloat(formData.creditLimit),
        currentBalance: parseFloat(formData.currentBalance),
        statementDate: parseInt(formData.statementDate),
        dueDate: parseInt(formData.dueDate),
        apr: formData.apr ? parseFloat(formData.apr) : undefined,
        imageUrl: formData.imageUrl || '/cards/default-card.svg',
      };
      addCard(card);
    }
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

  const handleEditCard = (id: string) => {
    setEditingCardId(id);
    setShowForm(false);
    clearResults();
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
  };

  const handleCalculate = () => {
    calculateResults();
  };

  // Hydration fix
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-body">
        <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <CreditCardIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-xl text-stone-900">CardTempo</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-200 rounded w-1/3"></div>
            <div className="h-64 bg-stone-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      {/* Header */}
      <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <CreditCardIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-stone-900">CardTempo</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-stone-600 hover:text-stone-900">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2 border-stone-300">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" className="bg-stone-900 hover:bg-stone-800 text-white">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-stone-900 mb-2">Credit Card Calculator</h1>
            <p className="text-stone-600">
              Enter your credit card details to get an optimized payment strategy
            </p>
          </div>

          {/* Cards Grid */}
          {cards.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-stone-900">Your Cards</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="gap-2 border-stone-300 text-stone-700 hover:bg-stone-100"
                  disabled={!!editingCardId}
                >
                  <Plus className="h-4 w-4" />
                  Add Card
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {cards
                  .filter((card) => card.id !== editingCardId)
                  .map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      onRemove={() => handleRemoveCard(card.id)}
                      onEdit={() => handleEditCard(card.id)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Add Card Form */}
          {showForm && !editingCardId && (
            <div className="mb-6">
              <CreditCardForm
                index={cards.length}
                onSubmit={handleAddCard}
                onRemove={cards.length > 0 ? () => setShowForm(false) : undefined}
                showRemove={cards.length > 0}
              />
            </div>
          )}

          {/* Edit Card Form */}
          {editingCardId && (() => {
            const editingCard = cards.find((c) => c.id === editingCardId);
            if (!editingCard) return null;
            return (
              <div className="mb-6">
                <CreditCardForm
                  index={cards.findIndex((c) => c.id === editingCardId)}
                  onSubmit={handleAddCard}
                  onRemove={handleCancelEdit}
                  initialData={cardToFormData(editingCard)}
                  showRemove={true}
                  isEditing={true}
                />
              </div>
            );
          })()}

          {/* Empty State */}
          {cards.length === 0 && !showForm && (
            <Card className="p-8 text-center border-stone-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-display text-xl text-stone-900 mb-2">No cards added yet</h3>
              <p className="text-sm text-stone-600 mb-4">
                Add your first credit card to get started
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                Add Your First Card
              </Button>
            </Card>
          )}

          {/* Calculate Button */}
          {cards.length > 0 && !showForm && (
            <Card className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg text-stone-900 mb-1">
                      Ready to optimize {cards.length} card{cards.length > 1 ? 's' : ''}?
                    </h3>
                    <p className="text-sm text-stone-600">
                      Get your personalized payment plan to improve your credit score
                    </p>
                  </div>
                  {result ? (
                    <Link href="/results">
                      <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        View Results
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button size="lg" onClick={handleCalculate} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Calculator className="h-4 w-4" />
                      Calculate Optimal Strategy
                    </Button>
                  )}
                </div>

                {result && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="font-display text-2xl text-stone-700">
                          {result.currentOverallUtilization.toFixed(1)}%
                        </p>
                        <p className="text-xs text-stone-500">Current</p>
                      </div>
                      <div>
                        <p className="font-display text-2xl text-emerald-600">
                          {result.optimizedOverallUtilization.toFixed(1)}%
                        </p>
                        <p className="text-xs text-stone-500">Optimized</p>
                      </div>
                      <div>
                        <p className="font-display text-2xl text-blue-600">
                          -{result.utilizationImprovement.toFixed(1)}%
                        </p>
                        <p className="text-xs text-stone-500">Improvement</p>
                      </div>
                      <div>
                        <p className="font-display text-2xl text-purple-600">
                          {result.estimatedScoreImpact.min === result.estimatedScoreImpact.max
                            ? `+${result.estimatedScoreImpact.min} pts`
                            : `+${result.estimatedScoreImpact.min} to +${result.estimatedScoreImpact.max} pts`}
                        </p>
                        <p className="text-xs text-stone-500">Score Impact</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tips Section */}
          <Card className="mt-8 border-stone-200">
            <CardHeader>
              <CardTitle className="font-display text-xl text-stone-900">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>
                    Enter your current balance as of today, not your statement balance
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>
                    Statement date is when your billing cycle closes and balance is reported
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
                  <span>
                    Due date is when payment must be received to avoid late fees
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600">•</span>
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
