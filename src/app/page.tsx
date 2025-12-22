'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LayoutDashboard,
  User,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Credit Optimizer</span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </button>
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="/calculator">
              <Button variant="outline" size="sm">
                Calculator
              </Button>
            </Link>
            {isAuthenticated ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <div className="flex flex-col">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium">Signed in as</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link href="/dashboard" className="block">
                        <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        size="sm"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Optimize Your Credit Card Payments to{' '}
              <span className="text-primary">Boost Your Score</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Most people pay on the due date, but banks report balances on the statement date.
              Learn the optimal time to pay and potentially improve your score by 15-50 points.
            </p>
            <div className="flex flex-col gap-4 items-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/calculator">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Calculate My Optimal Strategy
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  Learn How It Works
                </Button>
              </div>
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button size="lg" variant="default" className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700">
                    <LayoutDashboard className="h-4 w-4" />
                    Return to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Visual */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              The Secret Banks Don&apos;t Tell You
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Credit bureaus see your balance on the <strong>statement date</strong>, not the due date.
              This means timing your payments strategically can dramatically improve your reported utilization.
            </p>

            {/* Timeline Diagram */}
            <Card className="p-8 bg-gradient-to-r from-slate-50 to-white">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  {/* Statement Date */}
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Statement Date</h3>
                    <p className="text-sm text-muted-foreground">
                      Balance is reported to credit bureaus
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-yellow-600 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      Critical Date
                    </div>
                  </div>

                  <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />

                  {/* Balance Reported */}
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Bureaus Calculate Score</h3>
                    <p className="text-sm text-muted-foreground">
                      Utilization affects ~30% of your score
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-blue-600 text-xs font-medium">
                      <Clock className="h-3 w-3" />
                      21-25 days later
                    </div>
                  </div>

                  <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />

                  {/* Due Date */}
                  <div className="flex-1 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Due Date</h3>
                    <p className="text-sm text-muted-foreground">
                      Standard payment deadline
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Avoid Interest
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-center text-sm">
                    <strong>The Strategy:</strong> Pay down your balance <span className="text-primary font-semibold">before</span> the statement date
                    so a lower balance is reported, then pay the remaining small amount by the due date.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why This Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Lower Utilization Reported</h3>
              <p className="text-sm text-muted-foreground">
                Credit bureaus see a 5% utilization instead of 50%+, directly improving your score.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">No Extra Interest</h3>
              <p className="text-sm text-muted-foreground">
                You still pay the full balance by the due date, so you never pay any interest.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Fast Results</h3>
              <p className="text-sm text-muted-foreground">
                See score improvements within one billing cycle - often within 30 days.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  Is this actually legitimate? Will it really help my credit score?
                </AccordionTrigger>
                <AccordionContent>
                  Yes! This is based on how credit scoring actually works. Credit utilization
                  (how much of your available credit you&apos;re using) accounts for about 30% of your
                  FICO score. By strategically timing your payments, you control what balance
                  gets reported to the bureaus. This is completely legal and used by financial
                  advisors everywhere.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  When exactly do I need to make payments?
                </AccordionTrigger>
                <AccordionContent>
                  Make your &ldquo;optimization payment&rdquo; 2-3 days before your statement closing date
                  to bring your balance down to 5-9% of your limit. Then pay the remaining small
                  balance by your due date. Our calculator will give you the exact dates and amounts
                  for each of your cards.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  What&apos;s the ideal credit utilization percentage?
                </AccordionTrigger>
                <AccordionContent>
                  For the best credit score impact, aim for 1-9% utilization on each card.
                  Keeping some balance (rather than $0) shows you actively use credit responsibly.
                  Our calculator targets 5% as the sweet spot between showing activity and keeping
                  utilization low.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>
                  How fast will I see results?
                </AccordionTrigger>
                <AccordionContent>
                  Credit card issuers typically report to bureaus once per month, around your
                  statement date. So you can see score changes within one billing cycle - often
                  within 30 days of optimizing your payment timing.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>
                  Will I pay any interest using this method?
                </AccordionTrigger>
                <AccordionContent>
                  No! You&apos;re still paying your full balance before the due date. You&apos;re just
                  splitting it into two payments: one before the statement date (to optimize
                  reported utilization) and one before the due date (to pay the remaining amount).
                  You avoid all interest charges.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>
                  What if I have multiple credit cards?
                </AccordionTrigger>
                <AccordionContent>
                  Our calculator handles multiple cards! It will create an optimized payment plan
                  for each card, prioritizing cards with the highest utilization. It also shows
                  your overall utilization across all cards.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>
                  How is this different from just paying on time?
                </AccordionTrigger>
                <AccordionContent>
                  Paying on time avoids late fees and interest, which is great! But the balance
                  that gets reported to credit bureaus is determined by your statement date, not
                  your due date. If you pay on the due date with a high balance on your statement
                  date, bureaus see high utilization even though you paid in full.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Optimize Your Credit?
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Enter your credit card details and get a personalized payment plan in seconds.
              No sign-up required to use the calculator.
            </p>
            <Link href="/calculator">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Optimizing Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="font-semibold text-white">Credit Optimizer</span>
            </div>
            <p className="text-sm">
              For educational purposes. Not financial advice. Results may vary.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
