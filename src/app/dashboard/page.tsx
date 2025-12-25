'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardDisplay } from '@/components/CardDisplay';
import { CalendarView } from '@/components/CalendarView';
import { useAuthStore } from '@/store/auth-store';
import { useCalculatorStore } from '@/store/calculator-store';
import { formatCurrency, formatPercentage } from '@/lib/calculator';
import { format, differenceInDays } from 'date-fns';
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
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cards, result, calculateResults, removeCard } = useCalculatorStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Hydration fix
  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="animate-pulse p-8">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
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
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
            <p className="text-muted-foreground">
              {user?.email} | Manage your credit cards and optimize your payments
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CreditCardIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold">{cards.length}</p>
                  <p className="text-xs text-muted-foreground">Credit Cards</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold">
                    {formatPercentage(overallUtilization)}
                  </p>
                  <p className="text-xs text-muted-foreground">Overall Utilization</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{upcomingPayments.length}</p>
                  <p className="text-xs text-muted-foreground">Upcoming Payments</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">
                    {result
                      ? result.estimatedScoreImpact.min === result.estimatedScoreImpact.max
                        ? `+${result.estimatedScoreImpact.min}`
                        : `+${result.estimatedScoreImpact.min} to +${result.estimatedScoreImpact.max}`
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Est. Score Impact</p>
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
                <h2 className="text-xl font-semibold">Your Credit Cards</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => calculateResults()}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Recalculate
                  </Button>
                  <Link href="/calculator">
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Card
                    </Button>
                  </Link>
                </div>
              </div>

              {cards.length === 0 ? (
                <Card className="p-12 text-center">
                  <CreditCardIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No cards added yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your credit cards to start optimizing your payments
                  </p>
                  <Link href="/calculator">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Card
                    </Button>
                  </Link>
                </Card>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card) => (
                      <CardDisplay
                        key={card.id}
                        card={card}
                        onRemove={() => removeCard(card.id)}
                      />
                    ))}
                  </div>

                  {/* View Results CTA */}
                  {result && (
                    <Link href="/results" className="block mt-6">
                      <Card className="bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-all cursor-pointer border border-primary/20">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-white/20 p-2.5 rounded-lg">
                                <Calculator className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-base mb-0.5">Optimized Payment Plan Ready</h3>
                                <p className="text-primary-foreground/80 text-sm">
                                  View detailed payment schedule and recommendations
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 shrink-0"
                            >
                              View Results
                              <span className="text-lg">→</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )}

                  {/* Quick Action Cards */}
                  <div className="mt-8 space-y-4">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>

                    <Link href="/dashboard/priority">
                      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-6 w-6" />
                                <h3 className="text-xl font-bold">Smart Payment Allocation</h3>
                              </div>
                              <p className="text-green-100">
                                Limited budget? Find the optimal way to distribute payments across your cards
                              </p>
                            </div>
                            <div className="text-4xl">→</div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    <Link href="/dashboard/scenarios">
                      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-6 w-6" />
                                <h3 className="text-xl font-bold">Test What-If Scenarios</h3>
                              </div>
                              <p className="text-blue-100">
                                See how different decisions affect your credit score before making them
                              </p>
                            </div>
                            <div className="text-4xl">→</div>
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
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Payment Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming payments</p>
                      <p className="text-sm">Add cards to see payment reminders</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingPayments.map((payment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                payment.purpose === 'optimization'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-green-100 text-green-600'
                              }`}
                            >
                              {payment.purpose === 'optimization' ? (
                                <TrendingUp className="h-5 w-5" />
                              ) : (
                                <CreditCardIcon className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{payment.cardName}</p>
                              <p className="text-sm text-muted-foreground">
                                {payment.purpose === 'optimization'
                                  ? 'Optimization Payment'
                                  : 'Balance Payment'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
                <Card>
                  <CardContent className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No Cards Added Yet</p>
                      <p className="text-sm mb-4">
                        Add your credit cards to see your payment calendar
                      </p>
                      <Link href="/calculator">
                        <Button className="gap-2">
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
