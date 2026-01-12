'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
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
  Clock,
  LayoutDashboard,
  User,
  LogOut,
  Sparkles,
  Star,
  ArrowUpRight,
  ChevronRight,
  Shield,
  ShieldCheck,
  Lock,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// Staggered reveal animation
function RevealOnScroll({
  children,
  delay = 0,
  className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated number counter
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [end, isInView]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Hero section with scroll-linked rotating card
function HeroSection({
  isAuthenticated,
  scrollToSection
}: {
  isAuthenticated: boolean;
  scrollToSection: (id: string) => void;
}) {
  const sectionRef = useRef(null);
  const { scrollY } = useScroll();

  // Card rotates based on raw scroll pixels - 5px buffer before starting
  const rotateY = useTransform(scrollY, [5, 400], [0, 25]);
  const rotateX = useTransform(scrollY, [5, 400], [0, -10]);
  const scale = useTransform(scrollY, [5, 300], [1, 0.9]);

  return (
    <section ref={sectionRef} className="pt-16 md:pt-24 pb-20 md:pb-32 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-wrap items-center gap-3 mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-700">Free — no signup required</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">No card numbers needed</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl text-stone-900 leading-[0.95] tracking-tight mb-6"
            >
              Your credit score
              <br />
              <span className="text-emerald-600">is being held back.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl md:text-2xl text-stone-600 max-w-xl mb-10 leading-relaxed"
            >
              Banks report your balance on the <em className="text-stone-900 not-italic font-medium">statement date</em>, not when you pay.
              Time it right, and watch your score climb.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/calculator">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base px-8 h-14 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all">
                  Get Your Free Plan
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection('how-it-works')}
                className="gap-2 text-base px-8 h-14 rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100"
              >
                See How It Works
              </Button>
            </motion.div>

            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <Link href="/dashboard">
                  <Button variant="ghost" className="gap-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
                    <LayoutDashboard className="h-4 w-4" />
                    Go to Dashboard
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Right: Rotating Card Stack */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block mt-16"
            style={{ perspective: 1200 }}
          >
            <motion.div
              className="relative w-full aspect-[4/3]"
              style={{
                rotateY,
                rotateX,
                scale,
                transformStyle: "preserve-3d"
              }}
            >
              {/* Shadow/glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-3xl blur-3xl -z-10 translate-y-12" />

              {/* Back card - Chase Sapphire */}
              <motion.div
                className="absolute top-24 left-4 w-[80%] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl"
                style={{ transform: "translateZ(-80px) rotateY(-6deg) rotateZ(-3deg)" }}
              >
                <Image
                  src="/cards/chase-sapphire-preferred.png"
                  alt="Chase Sapphire Preferred"
                  fill
                  className="object-cover"
                />
              </motion.div>

              {/* Middle card - Amex Gold */}
              <motion.div
                className="absolute top-12 left-16 w-[80%] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl"
                style={{ transform: "translateZ(-40px) rotateY(-3deg) rotateZ(-1.5deg)" }}
              >
                <Image
                  src="/cards/amex-gold.png"
                  alt="Amex Gold"
                  fill
                  className="object-cover"
                />
              </motion.div>

              {/* Front card - Amex Platinum */}
              <motion.div
                className="absolute top-0 left-28 w-[80%] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20"
                style={{ transform: "translateZ(0px)" }}
                whileHover={{ scale: 1.02 }}
              >
                <Image
                  src="/cards/amex-platinum.png"
                  alt="Amex Platinum"
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuthStore();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-[#FAFAF8]/80 backdrop-blur-md border-b border-stone-200"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-stone-900">CardTempo</span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('card-finder')}
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Card Finder
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              FAQ
            </button>
            <Link href="/blog" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Blog
            </Link>

            {isAuthenticated ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-stone-300">
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <div className="flex flex-col">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900">Signed in as</p>
                      <p className="text-sm text-stone-500 truncate">{user?.email}</p>
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
                        onClick={() => logout()}
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
                <Button size="sm" className="bg-stone-900 hover:bg-stone-800 text-white">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <HeroSection
        isAuthenticated={isAuthenticated}
        scrollToSection={scrollToSection}
      />

      {/* Stats Bar */}
      <section className="py-8 border-y border-stone-200 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <div className="font-display text-4xl md:text-5xl text-stone-900">
                <Counter end={100} suffix="+" />
              </div>
              <p className="text-sm text-stone-500 mt-1">Point increase possible</p>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl text-stone-900">
                <Counter end={30} suffix="%" />
              </div>
              <p className="text-sm text-stone-500 mt-1">Of your score is utilization</p>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl text-stone-900">
                <Counter end={30} />
              </div>
              <p className="text-sm text-stone-500 mt-1">Days to see results</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-5 bg-stone-50 border-b border-stone-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm text-stone-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>No credit card numbers required</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-emerald-600" />
              <span>No SSN or personal data</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>Calculations stay in your browser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Card Finder Premium Feature */}
      <section id="card-finder" className="py-24 md:py-32 bg-stone-900 text-white relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealOnScroll>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Premium Feature</span>
              </div>

              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
                Find the perfect card for <span className="text-emerald-400">your</span> spending.
              </h2>

              <p className="text-lg text-stone-400 mb-8 leading-relaxed">
                Our Card Finder analyzes your spending habits and recommends cards that maximize your rewards.
                Stop leaving money on the table with the wrong cards.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </div>
                  <p className="text-stone-300">Personalized recommendations based on your actual spending</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </div>
                  <p className="text-stone-300">See exactly how much you&apos;ll earn in rewards annually</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  </div>
                  <p className="text-stone-300">Optimal card combinations for maximum cashback</p>
                </div>
              </div>

              <Link href="/recommendations">
                <Button size="lg" className="bg-white text-stone-900 hover:bg-stone-100 gap-2 text-base px-8 h-14 rounded-xl">
                  Find My Cards
                  <ArrowUpRight className="h-5 w-5" />
                </Button>
              </Link>
            </RevealOnScroll>

            {/* Card Preview Stack */}
            <RevealOnScroll delay={0.2} className="relative">
              <div className="relative h-[400px] md:h-[500px]">
                {/* Background card */}
                <motion.div
                  className="absolute top-8 left-8 right-0 bottom-0 bg-stone-800 rounded-2xl border border-stone-700"
                  initial={{ rotate: 6 }}
                  whileHover={{ rotate: 8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                {/* Middle card */}
                <motion.div
                  className="absolute top-4 left-4 right-4 bottom-4 bg-stone-800 rounded-2xl border border-stone-700"
                  initial={{ rotate: 3 }}
                  whileHover={{ rotate: 4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                {/* Front card */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl border border-stone-700 p-6 md:p-8 flex flex-col"
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Top Recommendation</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-amber-400 font-medium">98% Match</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Chase Sapphire Preferred</p>
                      <p className="text-sm text-stone-400">Travel Rewards</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-stone-700">
                      <span className="text-stone-400">Annual Rewards</span>
                      <span className="font-medium text-emerald-400">$847</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-stone-700">
                      <span className="text-stone-400">Sign-up Bonus</span>
                      <span className="font-medium text-white">75,000 pts</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-stone-400">Annual Fee</span>
                      <span className="font-medium text-white">$95</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-sm text-emerald-400">
                      <span className="font-semibold">+$752 net value</span> per year based on your spending
                    </p>
                  </div>
                </motion.div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl text-stone-900 mb-4">
                The timing trick banks don&apos;t tell you
              </h2>
              <p className="text-lg text-stone-600 max-w-2xl mx-auto">
                Credit bureaus see your balance on the statement date. Pay strategically,
                and they&apos;ll report a much lower utilization.
              </p>
            </div>
          </RevealOnScroll>

          {/* Timeline Visual */}
          <RevealOnScroll delay={0.1}>
            <Card className="max-w-4xl mx-auto border-stone-200 shadow-sm overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-0">
                  {/* Step 1 */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto md:mx-0 mb-4">
                      <Calendar className="h-7 w-7 text-amber-600" />
                    </div>
                    <h3 className="font-display text-xl text-stone-900 mb-2">Statement Date</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      Your balance is reported to credit bureaus. This is the date that matters.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Critical
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center px-6">
                    <ArrowRight className="h-6 w-6 text-stone-300" />
                  </div>

                  {/* Step 2 */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto md:mx-0 mb-4">
                      <TrendingUp className="h-7 w-7 text-blue-600" />
                    </div>
                    <h3 className="font-display text-xl text-stone-900 mb-2">Score Calculated</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      Bureaus calculate utilization. Lower reported balance = higher score.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      <Clock className="h-3 w-3" />
                      ~21 days later
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center px-6">
                    <ArrowRight className="h-6 w-6 text-stone-300" />
                  </div>

                  {/* Step 3 */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto md:mx-0 mb-4">
                      <CreditCard className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h3 className="font-display text-xl text-stone-900 mb-2">Due Date</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      Standard payment deadline. Pay remaining balance here to avoid interest.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      No interest
                    </div>
                  </div>
                </div>

                {/* Strategy Box */}
                <div className="mt-10 p-6 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-center text-stone-700">
                    <span className="font-semibold text-stone-900">The strategy:</span> Pay most of your balance{' '}
                    <span className="text-emerald-600 font-semibold">2-3 days before</span> the statement date,
                    then pay the small remainder by the due date.
                  </p>
                </div>
              </CardContent>
            </Card>
          </RevealOnScroll>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 md:py-32 bg-white border-y border-stone-200">
        <div className="container mx-auto px-6">
          <RevealOnScroll>
            <h2 className="font-display text-4xl md:text-5xl text-stone-900 text-center mb-16">
              Why this works
            </h2>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <RevealOnScroll delay={0}>
              <Card className="border-stone-200 hover:border-stone-300 hover:shadow-md transition-all h-full">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-display text-xl text-stone-900 mb-3">Lower utilization reported</h3>
                  <p className="text-stone-600 leading-relaxed">
                    Bureaus see 5% utilization instead of 50%. Utilization is 30% of your FICO score.
                  </p>
                </CardContent>
              </Card>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <Card className="border-stone-200 hover:border-stone-300 hover:shadow-md transition-all h-full">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-display text-xl text-stone-900 mb-3">Zero extra interest</h3>
                  <p className="text-stone-600 leading-relaxed">
                    You still pay the full balance by the due date. Just split into two strategic payments.
                  </p>
                </CardContent>
              </Card>
            </RevealOnScroll>

            <RevealOnScroll delay={0.2}>
              <Card className="border-stone-200 hover:border-stone-300 hover:shadow-md transition-all h-full">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-display text-xl text-stone-900 mb-3">Results in 30 days</h3>
                  <p className="text-stone-600 leading-relaxed">
                    See score improvements within one billing cycle. No waiting months for results.
                  </p>
                </CardContent>
              </Card>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <RevealOnScroll>
              <h2 className="font-display text-4xl md:text-5xl text-stone-900 text-center mb-16">
                Common questions
              </h2>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-0" className="border border-stone-200 rounded-xl px-6 bg-white">
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-stone-900">
                    What information do I need to enter?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-600 pb-5 leading-relaxed">
                    Just basic card details: your credit limit, current balance, statement date, and due date.
                    <strong className="text-stone-900"> We never ask for card numbers, SSN, or any sensitive personal information.</strong>{' '}
                    The calculator works entirely with these simple numbers that you can find on any statement.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-1" className="border border-stone-200 rounded-xl px-6 bg-white">
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-stone-900">
                    Is this legitimate? Will it really help my score?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-600 pb-5 leading-relaxed">
                    Yes. This is based on how credit scoring actually works. Utilization accounts for about 30% of your FICO score.
                    By timing payments strategically, you control what gets reported. This is completely legal and recommended by financial advisors.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border border-stone-200 rounded-xl px-6 bg-white">
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-stone-900">
                    When exactly should I make payments?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-600 pb-5 leading-relaxed">
                    Make your &quot;optimization payment&quot; 2-3 days before your statement date to bring your balance down to 5-9% of your limit.
                    Then pay the remaining balance by your due date. Our calculator gives you exact dates and amounts.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border border-stone-200 rounded-xl px-6 bg-white">
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-stone-900">
                    What&apos;s the ideal utilization percentage?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-600 pb-5 leading-relaxed">
                    For the best score impact, aim for 1-9% utilization. Keeping some balance shows you actively use credit.
                    Our calculator targets 5% as the optimal balance between showing activity and keeping utilization low.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border border-stone-200 rounded-xl px-6 bg-white">
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-stone-900">
                    Will I pay any interest using this method?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-600 pb-5 leading-relaxed">
                    No. You&apos;re still paying your full balance before the due date—just splitting it into two payments.
                    One before the statement date (to optimize reported utilization) and one before the due date (to clear the rest).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border border-stone-200 rounded-xl px-6 bg-white">
                  <AccordionTrigger className="text-left hover:no-underline py-5 text-stone-900">
                    What if I have multiple credit cards?
                  </AccordionTrigger>
                  <AccordionContent className="text-stone-600 pb-5 leading-relaxed">
                    Our calculator handles multiple cards. It creates an optimized payment plan for each one, prioritizing cards with the highest utilization.
                    It also shows your overall utilization across all cards.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 bg-stone-900 text-white">
        <div className="container mx-auto px-6">
          <RevealOnScroll>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6">
                Ready to unlock your credit potential?
              </h2>
              <p className="text-xl text-stone-400 mb-10 leading-relaxed">
                Enter your cards and get a personalized payment plan in seconds.
                No card numbers, no SSN, no signup — just limits and balances.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/calculator">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base px-8 h-14 rounded-xl">
                    Start Optimizing
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/recommendations">
                  <Button size="lg" className="bg-transparent border border-stone-600 text-white hover:bg-stone-800 gap-2 text-base px-8 h-14 rounded-xl">
                    Find My Cards
                    <Sparkles className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-stone-950 text-stone-400">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-stone-400" />
              </div>
              <span className="font-display text-lg text-stone-300">CardTempo</span>
            </div>
            <p className="text-sm">
              For educational purposes. Not financial advice. Results may vary.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-stone-200 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-stone-200 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
