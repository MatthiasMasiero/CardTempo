'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
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
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// Animated Counter Component
function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isInView]);

  return <span ref={ref}>{count}</span>;
}

// Scroll Animation Wrapper
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-x-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b border-white/20 dark:border-white/10 bg-gradient-to-r from-blue-50/60 via-indigo-50/60 to-purple-50/60 dark:from-slate-900/60 dark:via-blue-950/60 dark:to-purple-950/60 backdrop-blur-2xl sticky top-0 z-50 shadow-[0_8px_32px_rgba(99,102,241,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
          >
            <div className="relative">
              <CreditCard className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              CardTempo
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-all relative group"
            >
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all group-hover:w-full" />
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-all relative group"
            >
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all group-hover:w-full" />
            </button>
            <Link href="/blog" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-all relative group">
              Blog
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all group-hover:w-full" />
            </Link>
            {isAuthenticated ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" className="gap-2 hover:scale-105 transition-transform">
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
                <Button size="sm" className="bg-gradient-to-r from-primary via-blue-600 to-blue-700 hover:from-blue-600 hover:via-primary hover:to-purple-600 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative pt-12 md:pt-20 pb-24 md:pb-40 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
          <motion.div
            style={{ y }}
            className="absolute inset-0"
          >
            <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/40 dark:bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-400/40 dark:bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-300/30 dark:bg-indigo-500/20 rounded-full blur-3xl" />
          </motion.div>
        </div>

        {/* Mid-ground Decorative Shapes */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-32 h-32 border-4 border-blue-300/20 dark:border-blue-400/20 rounded-2xl"
          style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '60%']) }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-24 h-24 border-4 border-purple-300/20 dark:border-purple-400/20 rounded-full"
          style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '40%']) }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Floating Elements */}
        <motion.div
          className="absolute top-32 left-10 text-primary/20 hover:text-primary/40 transition-colors cursor-pointer group"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          whileHover={{ scale: 1.2, rotate: 15 }}
          style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '50%']) }}
        >
          <CreditCard className="h-20 w-20 group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-20 text-primary/20 hover:text-primary/40 transition-colors cursor-pointer group"
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          whileHover={{ scale: 1.2, rotate: -15 }}
          style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '30%']) }}
        >
          <TrendingUp className="h-24 w-24 group-hover:drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all" />
        </motion.div>

        {/* Additional Floating Icons */}
        <motion.div
          className="absolute top-1/2 right-10 text-emerald-500/15 dark:text-emerald-400/20"
          animate={{ y: [0, -15, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '45%']) }}
        >
          <CheckCircle2 className="h-16 w-16" />
        </motion.div>

        {/* Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 dark:bg-primary/30 rounded-full"
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}

        <motion.div
          style={{ opacity }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-5xl mx-auto text-center">
            <div className="backdrop-blur-2xl bg-white/30 dark:bg-slate-900/30 rounded-3xl p-12 md:p-16 border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-xl bg-white/20 dark:bg-white/10 border border-white/30 shadow-2xl mb-8 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(59,130,246,0.3)] transition-all duration-300 cursor-default group">
                <Zap className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-bold text-primary">Boost Your Score by up to 100 Points</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-tight mb-8 group cursor-default"
              whileHover={{ scale: 1.01 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary to-blue-600 dark:from-white dark:via-blue-400 dark:to-purple-400">
                Optimize Your Credit Card Payments to{' '}
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-purple-600">
                <span className="inline animate-gradient bg-[length:200%_auto]">
                  Boost Your Score
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed font-medium"
            >
              Most people pay on the due date, but banks report balances on the <strong className="text-slate-900 dark:text-white">statement date</strong>.
              Learn the optimal time to pay and potentially improve your score within 30 days.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col gap-6 items-center"
            >
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/calculator">
                  <Button size="lg" className="w-full sm:w-auto gap-3 text-lg font-bold px-10 py-7 hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-[0_20px_60px_rgba(59,130,246,0.4)] bg-gradient-to-r from-primary via-blue-600 to-blue-700 hover:from-blue-600 hover:via-primary hover:to-purple-600 group">
                    Calculate My Optimal Strategy
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-lg font-semibold px-10 py-7 hover:scale-110 transition-all duration-300 backdrop-blur-xl bg-white/30 dark:bg-white/10 border-2 border-white/50 hover:bg-white/50 dark:hover:bg-white/20 shadow-xl hover:shadow-2xl"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  Learn How It Works
                </Button>
              </div>
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button size="lg" variant="default" className="w-full sm:w-auto gap-3 text-lg font-bold px-10 py-7 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-2xl hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] hover:scale-110 transition-all duration-300 group">
                    <LayoutDashboard className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                    Return to Dashboard
                  </Button>
                </Link>
              )}
            </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <ScrollReveal delay={0}>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2 flex items-center justify-center gap-1">
                  <span>+</span>
                  <AnimatedCounter end={10} />
                  <span>-</span>
                  <AnimatedCounter end={100} />
                </div>
                <p className="text-muted-foreground">Point Score Increase</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  <AnimatedCounter end={30} />
                  <span className="text-2xl">%</span>
                </div>
                <p className="text-muted-foreground">Of your credit score is utilization</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2 flex items-center justify-center">
                  <AnimatedCounter end={30} />
                  <span className="text-2xl"> days</span>
                </div>
                <p className="text-muted-foreground">Or less to see results</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Problem/Solution Visual */}
      <section id="how-it-works" className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                The Secret Banks Don&apos;t Tell You
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto text-lg">
                Credit bureaus see your balance on the <strong className="text-foreground">statement date</strong>, not the due date.
                This means timing your payments strategically can dramatically improve your reported utilization.
              </p>
            </ScrollReveal>

            {/* Timeline Diagram */}
            <ScrollReveal delay={0.2}>
              <Card className="p-8 md:p-12 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 shadow-xl hover:shadow-2xl transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
                    {/* Statement Date */}
                    <motion.div
                      className="flex-1 text-center group"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                          <Calendar className="h-10 w-10 text-yellow-600" />
                        </div>
                        <motion.div
                          className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Statement Date</h3>
                      <p className="text-sm text-muted-foreground">
                        Balance is reported to credit bureaus
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1 text-yellow-600 text-xs font-medium bg-yellow-50 px-3 py-1 rounded-full">
                        <AlertTriangle className="h-3 w-3" />
                        Critical Date
                      </div>
                    </motion.div>

                    <ArrowRight className="h-8 w-8 text-primary hidden md:block" />

                    {/* Balance Reported */}
                    <motion.div
                      className="flex-1 text-center group"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                          <TrendingUp className="h-10 w-10 text-blue-600" />
                        </div>
                        <motion.div
                          className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Bureaus Calculate Score</h3>
                      <p className="text-sm text-muted-foreground">
                        Utilization affects ~30% of your score
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1 text-blue-600 text-xs font-medium bg-blue-50 px-3 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        21-25 days later
                      </div>
                    </motion.div>

                    <ArrowRight className="h-8 w-8 text-primary hidden md:block" />

                    {/* Due Date */}
                    <motion.div
                      className="flex-1 text-center group"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                          <CreditCard className="h-10 w-10 text-green-600" />
                        </div>
                        <motion.div
                          className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Due Date</h3>
                      <p className="text-sm text-muted-foreground">
                        Standard payment deadline
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Avoid Interest
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    className="mt-12 p-6 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 rounded-xl border-2 border-primary/30"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-center text-base">
                      <strong className="text-lg">The Strategy:</strong> Pay down your balance{' '}
                      <span className="text-primary font-semibold text-lg">2-3 days before</span> the statement date
                      so a lower balance is reported, then pay the remaining small amount by the due date.
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              Why This Works
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <ScrollReveal delay={0}>
              <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className="p-8 h-full hover:shadow-xl transition-all border-2 hover:border-green-200 bg-gradient-to-br from-white to-green-50/30">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-6 shadow-lg">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-xl mb-3">Lower Utilization Reported</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Credit bureaus see a 5% utilization instead of 50%+, directly improving your score.
                  </p>
                </Card>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className="p-8 h-full hover:shadow-xl transition-all border-2 hover:border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-6 shadow-lg">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-xl mb-3">No Extra Interest</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You still pay the full balance by the due date, so you never pay any interest.
                  </p>
                </Card>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className="p-8 h-full hover:shadow-xl transition-all border-2 hover:border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-6 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-xl mb-3">Fast Results</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    See score improvements within one billing cycle - often within 30 days.
                  </p>
                </Card>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
                Frequently Asked Questions
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Is this actually legitimate? Will it really help my credit score?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Yes! This is based on how credit scoring actually works. Credit utilization
                    (how much of your available credit you&apos;re using) accounts for about 30% of your
                    FICO score. By strategically timing your payments, you control what balance
                    gets reported to the bureaus. This is completely legal and used by financial
                    advisors everywhere.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left hover:no-underline">
                    When exactly do I need to make payments?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Make your &ldquo;optimization payment&rdquo; 2-3 days before your statement closing date
                    to bring your balance down to 5-9% of your limit. Then pay the remaining small
                    balance by your due date. Our calculator will give you the exact dates and amounts
                    for each of your cards.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left hover:no-underline">
                    What&apos;s the ideal credit utilization percentage?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    For the best credit score impact, aim for 1-9% utilization on each card.
                    Keeping some balance (rather than $0) shows you actively use credit responsibly.
                    Our calculator targets 5% as the sweet spot between showing activity and keeping
                    utilization low.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left hover:no-underline">
                    How fast will I see results?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Credit card issuers typically report to bureaus once per month, around your
                    statement date. So you can see score changes within one billing cycle - often
                    within 30 days of optimizing your payment timing.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Will I pay any interest using this method?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    No! You&apos;re still paying your full balance before the due date. You&apos;re just
                    splitting it into two payments: one before the statement date (to optimize
                    reported utilization) and one before the due date (to pay the remaining amount).
                    You avoid all interest charges.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left hover:no-underline">
                    What if I have multiple credit cards?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Our calculator handles multiple cards! It will create an optimized payment plan
                    for each card, prioritizing cards with the highest utilization. It also shows
                    your overall utilization across all cards.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left hover:no-underline">
                    How is this different from just paying on time?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Paying on time avoids late fees and interest, which is great! But the balance
                    that gets reported to credit bureaus is determined by your statement date, not
                    your due date. If you pay on the due date with a high balance on your statement
                    date, bureaus see high utilization even though you paid in full.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-purple-600">
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Optimize Your Credit?
              </h2>
              <p className="text-xl text-white/90 mb-10 leading-relaxed">
                Enter your credit card details and get a personalized payment plan in seconds.
                No sign-up required to use the calculator.
              </p>
              <Link href="/calculator">
                <Button size="lg" variant="secondary" className="gap-2 text-base px-8 py-6 hover:scale-105 transition-transform shadow-xl hover:shadow-2xl">
                  Start Optimizing Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="font-semibold text-white">CardTempo</span>
            </div>
            <p className="text-sm">
              For educational purposes. Not financial advice. Results may vary.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
