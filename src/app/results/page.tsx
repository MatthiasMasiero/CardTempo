'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PaymentTimeline } from '@/components/PaymentTimeline';
import { useCalculatorStore } from '@/store/calculator-store';
import { formatCurrency, formatPercentage } from '@/lib/calculator';
import {
  CreditCard as CreditCardIcon,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Percent,
  Target,
  CheckCircle2,
  Mail,
  RefreshCw,
  UserPlus,
} from 'lucide-react';

export default function ResultsPage() {
  const { result, cards, calculateResults } = useCalculatorStore();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!result && cards.length > 0) {
      calculateResults();
    }
  }, [result, cards.length, calculateResults]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the email
    console.log('Sending payment plan to:', email);
    setEmailSent(true);
  };

  const handleRecalculate = () => {
    calculateResults();
  };

  // Hydration fix
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Credit Optimizer</span>
            </div>
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

  if (!result || cards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <CreditCardIcon className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Credit Optimizer</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">No Cards to Analyze</h1>
            <p className="text-muted-foreground mb-6">
              Add your credit cards first to see your optimized payment plan.
            </p>
            <Link href="/calculator">
              <Button>Go to Calculator</Button>
            </Link>
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
            <Link href="/calculator">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Edit Cards
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Save Results
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Summary Card */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">Your Optimized Payment Plan</h1>
              <p className="text-white/80">
                Based on your {result.cards.length} credit card{result.cards.length > 1 ? 's' : ''}
              </p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Total Credit */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(result.totalCreditLimit)}</p>
                  <p className="text-xs text-muted-foreground">Total Credit Limit</p>
                </div>

                {/* Total Balance */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(result.totalCurrentBalance)}</p>
                  <p className="text-xs text-muted-foreground">Total Balance</p>
                </div>

                {/* Utilization Improvement */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Percent className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg text-red-500 line-through">
                      {formatPercentage(result.currentOverallUtilization)}
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPercentage(result.optimizedOverallUtilization)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Utilization</p>
                </div>

                {/* Score Impact */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    +{result.estimatedScoreImpact.min}-{result.estimatedScoreImpact.max}
                  </p>
                  <p className="text-xs text-muted-foreground">Est. Score Impact</p>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">
                      Potential Score Improvement: +{result.estimatedScoreImpact.min} to +{result.estimatedScoreImpact.max} points
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      By reducing your utilization from {formatPercentage(result.currentOverallUtilization)} to{' '}
                      {formatPercentage(result.optimizedOverallUtilization)}, credit bureaus will report a much
                      healthier credit profile. Interest saved: $0 (you pay in full before due date).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Card Plans */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Card-by-Card Payment Plans</h2>
              <Button variant="outline" size="sm" onClick={handleRecalculate} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recalculate
              </Button>
            </div>
            <div className="space-y-6">
              {result.cards.map((cardPlan, index) => (
                <PaymentTimeline key={cardPlan.card.id || index} plan={cardPlan} />
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Don&apos;t Lose Your Payment Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Email yourself this plan, or create an account to save your cards and get payment reminders.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Email Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Email Your Payment Plan</DialogTitle>
                        <DialogDescription>
                          We&apos;ll send you a summary of your optimized payment dates and amounts.
                        </DialogDescription>
                      </DialogHeader>
                      {emailSent ? (
                        <div className="py-8 text-center">
                          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                          <p className="font-medium">Payment plan sent!</p>
                          <p className="text-sm text-muted-foreground">Check your inbox at {email}</p>
                        </div>
                      ) : (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Send Payment Plan
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Link href="/signup">
                    <Button className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">Set Calendar Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Add payment dates to your calendar so you don&apos;t miss the optimization window.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">Schedule Payments</h4>
                  <p className="text-sm text-muted-foreground">
                    Many banks allow scheduling future payments. Set them up now!
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">Check Your Score</h4>
                  <p className="text-sm text-muted-foreground">
                    Wait 1-2 weeks after statement date, then check for score improvements.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">Repeat Monthly</h4>
                  <p className="text-sm text-muted-foreground">
                    Use this strategy every billing cycle to maintain optimal utilization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 mt-8 border-t bg-white">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            Estimated score impacts are based on general credit scoring principles and may vary.
            This is not financial advice. Consult a financial advisor for personalized guidance.
          </p>
        </div>
      </footer>
    </div>
  );
}
