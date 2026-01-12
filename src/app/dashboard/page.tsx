'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardDisplay } from '@/components/CardDisplay';
import { CreditCardForm } from '@/components/CreditCardForm';
import { CalendarView } from '@/components/CalendarView';
import { SquareProgress } from '@/components/SquareProgress';
import { HighUtilizationBanner } from '@/components/HighUtilizationBanner';
import { useAuthStore } from '@/store/auth-store';
import { useCalculatorStore } from '@/store/calculator-store';
import { formatCurrency, formatPercentage } from '@/lib/calculator';
import { format, differenceInDays, addDays, startOfDay, isSameDay } from 'date-fns';
import { CreditCard, CreditCardFormData } from '@/types';
import {
  CreditCard as CreditCardIcon,
  Plus,
  Calendar,
  Bell,
  Settings,
  DollarSign,
  LogOut,
  TrendingUp,
  Clock,
  Calculator,
  RefreshCw,
  Zap,
  Sparkles,
  ChevronRight,
  Percent,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, checkSession } = useAuthStore();
  const { cards, result, calculateResults, updateCard, removeCard } = useCalculatorStore();
  const [mounted, setMounted] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    calculateResults();
    // Brief delay to show the animation
    setTimeout(() => setIsRecalculating(false), 600);
  };

  useEffect(() => {
    setMounted(true);
    // Check session on mount - this picks up session from cookies (e.g., after email confirmation)
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (cards.length > 0 && !result) {
      calculateResults();
    }
  }, [cards.length, result, calculateResults]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

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

  const handleEditCard = (id: string) => {
    setEditingCardId(id);
  };

  const handleUpdateCard = (formData: CreditCardFormData) => {
    if (editingCardId) {
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
      // Recalculate results after edit
      calculateResults();
    }
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
  };

  // Hydration fix
  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-body">
        <div className="animate-pulse p-8">
          <div className="h-8 bg-stone-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate upcoming payments from results
  const upcomingPayments = result?.cards
    .flatMap((cardPlan) =>
      cardPlan.payments.map((payment) => ({
        cardName: cardPlan.card.nickname,
        ...payment,
        daysUntil: differenceInDays(payment.date, new Date()),
      }))
    )
    .filter((p) => p.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5) || [];

  // Calculate overall stats
  const totalCreditLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0);
  const overallUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Utilization insight message
  const getUtilizationInsight = () => {
    if (cards.length === 0) return null;
    if (overallUtilization <= 10) {
      return { text: 'Your utilization is excellent—keep it up!', type: 'success' as const };
    }
    if (overallUtilization <= 30) {
      return { text: `Your utilization is ${formatPercentage(overallUtilization)}—in the acceptable range.`, type: 'neutral' as const };
    }
    return { text: `Your utilization is ${formatPercentage(overallUtilization)}—consider making a payment soon.`, type: 'warning' as const };
  };

  const utilizationInsight = getUtilizationInsight();

  // Generate next 7 days for mini calendar
  const today = startOfDay(new Date());
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Get payment dates for mini calendar dots
  const paymentDates = upcomingPayments.map(p => startOfDay(p.date));
  const hasPaymentOnDay = (day: Date) => paymentDates.some(pd => isSameDay(pd, day));

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
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2 text-stone-600 hover:text-stone-900">
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-stone-500 hover:text-stone-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-stone-900 mb-1">{getGreeting()}</h1>
            <p className="text-stone-500 text-sm mb-3">{user?.email}</p>
            {utilizationInsight && (
              <p className={`text-sm ${
                utilizationInsight.type === 'success' ? 'text-emerald-600' :
                utilizationInsight.type === 'warning' ? 'text-amber-600' :
                'text-stone-600'
              }`}>
                {utilizationInsight.text}
              </p>
            )}
          </div>

          {/* High Utilization Banner */}
          <HighUtilizationBanner overallUtilization={overallUtilization} />

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-stone-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <CreditCardIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="font-display text-3xl text-stone-900">{cards.length}</p>
                  <p className="text-xs text-stone-500">Credit Cards</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <SquareProgress progress={overallUtilization} size={48} strokeWidth={3} className="mx-auto mb-3">
                    <Percent className={`h-5 w-5 ${
                      overallUtilization <= 10 ? 'text-emerald-600' :
                      overallUtilization <= 30 ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                  </SquareProgress>
                  <p className={`font-display text-3xl ${
                    overallUtilization <= 10 ? 'text-emerald-600' :
                    overallUtilization <= 30 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {formatPercentage(overallUtilization)}
                  </p>
                  <p className="text-xs text-stone-500">Utilization</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-display text-3xl text-stone-900">{upcomingPayments.length}</p>
                  <p className="text-xs text-stone-500">Upcoming Payments</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="font-display text-3xl text-emerald-600">
                    {result
                      ? result.estimatedScoreImpact.min === result.estimatedScoreImpact.max
                        ? `+${result.estimatedScoreImpact.min}`
                        : `+${result.estimatedScoreImpact.min} to +${result.estimatedScoreImpact.max}`
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-stone-500">Est. Score Impact</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content */}
          <Tabs defaultValue="cards" className="space-y-6">
            <TabsList>
              <TabsTrigger value="cards" className="gap-2">
                <CreditCardIcon className="h-4 w-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="reminders" className="gap-2">
                <Bell className="h-4 w-4" />
                Reminders
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>

            {/* Cards Tab */}
            <TabsContent value="cards">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-stone-900">Your Credit Cards</h2>
                <div className="flex gap-2">
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
                  <Link href="/calculator">
                    <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4" />
                      Add Card
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Mini Calendar Preview */}
              {cards.length > 0 && upcomingPayments.length > 0 && (
                <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-stone-500" />
                    <span className="text-sm font-medium text-stone-700">Upcoming Week</span>
                  </div>
                  <div className="flex gap-2">
                    {next7Days.map((day, i) => {
                      const hasPayment = hasPaymentOnDay(day);
                      const isToday = i === 0;
                      return (
                        <div
                          key={i}
                          className={`flex-1 text-center py-2 px-1 rounded-lg transition-colors ${
                            isToday ? 'bg-white border border-stone-200 shadow-sm' : ''
                          }`}
                        >
                          <p className={`text-xs ${isToday ? 'text-emerald-600 font-medium' : 'text-stone-500'}`}>
                            {format(day, 'EEE')}
                          </p>
                          <p className={`text-sm font-medium ${isToday ? 'text-stone-900' : 'text-stone-700'}`}>
                            {format(day, 'd')}
                          </p>
                          {hasPayment && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto mt-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {upcomingPayments.length > 0 && upcomingPayments[0].daysUntil <= 7 && (
                    <p className="text-xs text-stone-500 mt-3">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                      Next payment: {upcomingPayments[0].cardName} on {format(upcomingPayments[0].date, 'MMM d')}
                    </p>
                  )}
                </div>
              )}

              {cards.length === 0 ? (
                <Card className="p-12 text-center border-stone-200">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                    <CreditCardIcon className="h-8 w-8 text-stone-400" />
                  </div>
                  <h3 className="font-display text-xl text-stone-900 mb-2">No cards added yet</h3>
                  <p className="text-stone-600 mb-4">
                    Add your credit cards to start optimizing your payments
                  </p>
                  <Link href="/calculator">
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4" />
                      Add Your First Card
                    </Button>
                  </Link>
                </Card>
              ) : (
                <>
                  {/* Edit Card Form */}
                  {editingCardId && (() => {
                    const editingCard = cards.find((c) => c.id === editingCardId);
                    if (!editingCard) return null;
                    return (
                      <div className="mb-6">
                        <CreditCardForm
                          index={cards.findIndex((c) => c.id === editingCardId)}
                          onSubmit={handleUpdateCard}
                          onRemove={handleCancelEdit}
                          initialData={cardToFormData(editingCard)}
                          showRemove={true}
                          isEditing={true}
                        />
                      </div>
                    );
                  })()}

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards
                      .filter((card) => card.id !== editingCardId)
                      .map((card) => {
                        // Find payments for this card from the result
                        const cardPlan = result?.cards.find(cp => cp.card.id === card.id);
                        return (
                          <CardDisplay
                            key={card.id}
                            card={card}
                            onRemove={() => removeCard(card.id)}
                            onEdit={() => handleEditCard(card.id)}
                            payments={cardPlan?.payments}
                          />
                        );
                      })}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-8 space-y-3">
                    <h2 className="font-display text-xl text-stone-900 mb-4">Quick Actions</h2>

                    {/* View Results - only show if there's a result */}
                    {result && (
                      <Link href="/results">
                        <Card className="border-stone-200 border-l-4 border-l-emerald-600 hover:shadow-sm transition-all group">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                                <Calculator className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-display text-base text-stone-900 mb-0.5">View Payment Plan</h3>
                                <p className="text-sm text-stone-500">
                                  Your optimized schedule is ready
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )}

                    <Link href="/dashboard/priority">
                      <Card className="border-stone-200 border-l-4 border-l-emerald-400 hover:shadow-sm transition-all group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                              <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-base text-stone-900 mb-0.5">Smart Payment Allocation</h3>
                              <p className="text-sm text-stone-500">
                                Distribute limited budget optimally
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/dashboard/scenarios">
                      <Card className="border-stone-200 border-l-4 border-l-blue-400 hover:shadow-sm transition-all group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                              <Zap className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-base text-stone-900 mb-0.5">What-If Scenarios</h3>
                              <p className="text-sm text-stone-500">
                                Test decisions before making them
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/recommendations">
                      <Card className="border-stone-200 border-l-4 border-l-amber-400 hover:shadow-sm transition-all group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                              <Sparkles className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-base text-stone-900 mb-0.5">Card Recommendations</h3>
                              <p className="text-sm text-stone-500">
                                Find cards for your spending habits
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Reminders Tab */}
            <TabsContent value="reminders">
              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-stone-900">Upcoming Payment Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingPayments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-7 w-7 text-stone-400" />
                      </div>
                      <p className="font-display text-lg text-stone-900">No upcoming payments</p>
                      <p className="text-sm text-stone-500">Add cards to see payment reminders</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingPayments.map((payment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 border border-stone-200 rounded-lg"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                payment.purpose === 'optimization'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}
                            >
                              {payment.purpose === 'optimization' ? (
                                <TrendingUp className="h-5 w-5" />
                              ) : (
                                <CreditCardIcon className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-stone-900 truncate">{payment.cardName}</p>
                              <p className="text-sm text-stone-500">
                                {payment.purpose === 'optimization'
                                  ? 'Optimization Payment'
                                  : 'Balance Payment'}
                              </p>
                            </div>
                          </div>
                          <div className="text-center shrink-0 w-[140px] ml-auto mr-64">
                            <p className="font-semibold text-stone-900 tabular-nums">{formatCurrency(payment.amount)}</p>
                            <div className="flex items-center justify-center gap-1 text-sm text-stone-500">
                              <Clock className="h-3 w-3" />
                              {payment.daysUntil === 0
                                ? 'Today'
                                : payment.daysUntil === 1
                                ? 'Tomorrow'
                                : `${payment.daysUntil} days`}
                            </div>
                          </div>
                          <Badge
                            variant={payment.daysUntil <= 2 ? 'destructive' : 'secondary'}
                            className="shrink-0"
                          >
                            {format(payment.date, 'MMM d')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              {cards.length === 0 ? (
                <Card className="border-stone-200">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-7 w-7 text-stone-400" />
                      </div>
                      <p className="font-display text-lg text-stone-900 mb-1">No Cards Added Yet</p>
                      <p className="text-sm text-stone-500 mb-4">
                        Add your credit cards to see your payment calendar
                      </p>
                      <Link href="/calculator">
                        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                          <Plus className="h-4 w-4" />
                          Add Cards
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <CalendarView cards={cards} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
