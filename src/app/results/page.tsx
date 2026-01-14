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
import { EmailReminderModal } from '@/components/EmailReminderModal';
import { CalendarExportModal } from '@/components/CalendarExportModal';
import { useCalculatorStore } from '@/store/calculator-store';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { PremiumBadge } from '@/components/UpgradePrompt';
import { formatCurrency, formatPercentage } from '@/lib/calculator';
import { PaymentEvent } from '@/lib/calendarUtils';
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
  Bell,
  Download,
  Loader2,
  Calendar,
  LayoutDashboard,
  Lock,
} from 'lucide-react';

export default function ResultsPage() {
  const { result, cards, calculateResults } = useCalculatorStore();
  const { isAuthenticated } = useAuthStore();
  const { canAccessFeature } = useSubscriptionStore();
  const [email, setEmail] = useState('');

  // Check feature access for exports and reminders
  const canExportPdf = canAccessFeature('hasPdfExport');
  const canExportCalendar = canAccessFeature('hasCalendarExport');
  const canSetReminders = canAccessFeature('hasEmailReminders');
  const [emailSent, setEmailSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

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
    setIsRecalculating(true);
    calculateResults();
    // Brief delay to show the animation
    setTimeout(() => setIsRecalculating(false), 600);
  };

  // Convert payment plans to calendar events
  const getCalendarEvents = (): PaymentEvent[] => {
    if (!result) return [];

    const events: PaymentEvent[] = [];

    result.cards.forEach(cardPlan => {
      cardPlan.payments.forEach(payment => {
        const event: PaymentEvent = {
          cardName: cardPlan.card.nickname,
          amount: payment.amount,
          date: payment.date,
          type: payment.purpose,
          currentBalance: cardPlan.card.currentBalance,
          newBalance: payment.purpose === 'optimization'
            ? cardPlan.card.currentBalance - payment.amount
            : 0,
          utilization: payment.purpose === 'optimization'
            ? cardPlan.newUtilization
            : undefined,
          scoreImpact: result.estimatedScoreImpact.min === result.estimatedScoreImpact.max
            ? `+${result.estimatedScoreImpact.min} pts`
            : `+${result.estimatedScoreImpact.min} to +${result.estimatedScoreImpact.max} pts`,
        };
        events.push(event);
      });

      // Optionally add statement closing date
      events.push({
        cardName: cardPlan.card.nickname,
        amount: 0,
        date: cardPlan.nextStatementDate,
        type: 'statement',
        currentBalance: cardPlan.card.currentBalance,
      });
    });

    return events;
  };

  const handleDownloadPDF = async () => {
    if (!result) return;

    setDownloadingPDF(true);
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credit-optimization-plan-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Hydration fix
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-body">
        <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <CreditCardIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-xl text-stone-900">CardTempo</span>
            </div>
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

  if (!result || cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-body">
        <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <CreditCardIcon className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-xl text-stone-900">CardTempo</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="font-display text-2xl text-stone-900 mb-2">No Cards to Analyze</h1>
            <p className="text-stone-600 mb-6">
              Add your credit cards first to see your optimized payment plan.
            </p>
            <Link href="/calculator">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Go to Calculator</Button>
            </Link>
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
            <Link href="/calculator">
              <Button variant="ghost" size="sm" className="gap-2 text-stone-600 hover:text-stone-900">
                <ArrowLeft className="h-4 w-4" />
                Edit Cards
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
                <Button size="sm" className="gap-2 bg-stone-900 hover:bg-stone-800 text-white">
                  <UserPlus className="h-4 w-4" />
                  Save Results
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Summary Card */}
          <Card className="mb-8 overflow-hidden border-l-4 border-l-emerald-600 border-stone-200">
            <div className="bg-emerald-600 text-white p-6">
              <h1 className="font-display text-2xl mb-2">Your Optimized Payment Plan</h1>
              <p className="text-white/80">
                Based on your {result.cards.length} credit card{result.cards.length > 1 ? 's' : ''}
              </p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Total Credit */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-display text-2xl text-stone-900">{formatCurrency(result.totalCreditLimit)}</p>
                  <p className="text-xs text-stone-500">Total Credit Limit</p>
                </div>

                {/* Total Balance */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="font-display text-2xl text-stone-900">{formatCurrency(result.totalCurrentBalance)}</p>
                  <p className="text-xs text-stone-500">Total Balance</p>
                </div>

                {/* Utilization Improvement */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Percent className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg text-red-500 line-through">
                      {formatPercentage(result.currentOverallUtilization)}
                    </span>
                    <span className="font-display text-2xl text-emerald-600">
                      {formatPercentage(result.optimizedOverallUtilization)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">Utilization</p>
                </div>

                {/* Score Impact */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="font-display text-2xl text-emerald-600">
                    {result.estimatedScoreImpact.min === result.estimatedScoreImpact.max
                      ? `+${result.estimatedScoreImpact.min}`
                      : `+${result.estimatedScoreImpact.min} to +${result.estimatedScoreImpact.max}`}
                  </p>
                  <p className="text-xs text-stone-500">Est. Score Impact</p>
                </div>
              </div>

              {/* Impact Summary */}
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-700">
                      Potential Score Improvement: +{result.estimatedScoreImpact.min} to +{result.estimatedScoreImpact.max} points
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
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
              <h2 className="font-display text-xl text-stone-900">Card-by-Card Payment Plans</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="gap-2 border-stone-300 text-stone-700 hover:bg-stone-100"
              >
                <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                {isRecalculating ? 'Calculating...' : 'Recalculate'}
              </Button>
            </div>
            <div className="space-y-6">
              {result.cards.map((cardPlan, index) => (
                <PaymentTimeline key={cardPlan.card.id || index} plan={cardPlan} />
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <Card className="border-l-4 border-l-emerald-600 border-stone-200 bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-display text-lg text-stone-900 mb-2">
                    {isAuthenticated ? 'Manage Your Payment Plan' : 'Don\'t Lose Your Payment Plan'}
                  </h3>
                  <p className="text-sm text-stone-600">
                    {isAuthenticated
                      ? 'Export your plan or set up reminders to stay on track.'
                      : 'Email yourself this plan, or create an account to save your cards and get payment reminders.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {canExportCalendar ? (
                    <Button
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowCalendarModal(true)}
                    >
                      <Calendar className="h-4 w-4" />
                      Add to Calendar
                    </Button>
                  ) : (
                    <Link href="/pricing">
                      <Button
                        variant="outline"
                        className="gap-2 border-stone-300 text-stone-500 hover:bg-stone-100"
                      >
                        <Lock className="h-4 w-4" />
                        Add to Calendar
                        <PremiumBadge />
                      </Button>
                    </Link>
                  )}
                  {canExportPdf ? (
                    <Button
                      variant="outline"
                      className="gap-2 border-stone-300 text-stone-700 hover:bg-stone-100"
                      onClick={handleDownloadPDF}
                      disabled={downloadingPDF}
                    >
                      {downloadingPDF ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link href="/pricing">
                      <Button
                        variant="outline"
                        className="gap-2 border-stone-300 text-stone-500 hover:bg-stone-100"
                      >
                        <Lock className="h-4 w-4" />
                        Download PDF
                        <PremiumBadge />
                      </Button>
                    </Link>
                  )}
                  {canSetReminders ? (
                    <EmailReminderModal
                      cardPlans={result.cards}
                      userEmail={email}
                      trigger={
                        <Button variant="outline" className="gap-2 border-stone-300 text-stone-700 hover:bg-stone-100">
                          <Bell className="h-4 w-4" />
                          Set Reminders
                        </Button>
                      }
                    />
                  ) : (
                    <Link href="/pricing">
                      <Button
                        variant="outline"
                        className="gap-2 border-stone-300 text-stone-500 hover:bg-stone-100"
                      >
                        <Lock className="h-4 w-4" />
                        Set Reminders
                        <PremiumBadge />
                      </Button>
                    </Link>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 border-stone-300 text-stone-700 hover:bg-stone-100">
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
                  {!isAuthenticated && (
                    <Link href="/signup">
                      <Button className="gap-2 bg-stone-900 hover:bg-stone-800 text-white">
                        <UserPlus className="h-4 w-4" />
                        Create Account
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="mt-8 border-l-4 border-l-emerald-600 border-stone-200">
            <CardHeader>
              <CardTitle className="font-display text-lg text-stone-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-stone-200 border-l-4 border-l-emerald-400 rounded-lg">
                  <h4 className="font-medium text-stone-900 mb-2">Set Calendar Reminders</h4>
                  <p className="text-sm text-stone-600">
                    Add payment dates to your calendar so you don&apos;t miss the optimization window.
                  </p>
                </div>
                <div className="p-4 bg-white border border-stone-200 border-l-4 border-l-blue-400 rounded-lg">
                  <h4 className="font-medium text-stone-900 mb-2">Schedule Payments</h4>
                  <p className="text-sm text-stone-600">
                    Many banks allow scheduling future payments. Set them up now!
                  </p>
                </div>
                <div className="p-4 bg-white border border-stone-200 border-l-4 border-l-amber-400 rounded-lg">
                  <h4 className="font-medium text-stone-900 mb-2">Check Your Score</h4>
                  <p className="text-sm text-stone-600">
                    Wait 1-2 weeks after statement date, then check for score improvements.
                  </p>
                </div>
                <div className="p-4 bg-white border border-stone-200 border-l-4 border-l-purple-400 rounded-lg">
                  <h4 className="font-medium text-stone-900 mb-2">Repeat Monthly</h4>
                  <p className="text-sm text-stone-600">
                    Use this strategy every billing cycle to maintain optimal utilization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 mt-8 border-t border-stone-200 bg-white">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-stone-500">
            Estimated score impacts are based on general credit scoring principles and may vary.
            This is not financial advice. Consult a financial advisor for personalized guidance.
          </p>
        </div>
      </footer>

      {/* Calendar Export Modal */}
      {result && (
        <CalendarExportModal
          open={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          events={getCalendarEvents()}
        />
      )}
    </div>
  );
}
