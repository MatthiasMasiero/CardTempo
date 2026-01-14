import {
  CreditCard,
  CardPaymentPlan,
  OptimizationResult,
  Payment
} from '@/types';
import {
  addDays,
  setDate,
  isBefore,
  isAfter,
  addMonths,
  startOfDay,
  subDays
} from 'date-fns';

const TARGET_UTILIZATION = 0.05; // 5% target
const OPTIMIZATION_DAYS_BEFORE = 2; // Pay 2 days before statement

/**
 * Get the next occurrence of a day in the month
 */
function getNextDateForDay(dayOfMonth: number, referenceDate: Date = new Date()): Date {
  const today = startOfDay(referenceDate);
  const currentMonth = setDate(today, Math.min(dayOfMonth, getDaysInMonth(today)));

  if (isAfter(currentMonth, today) || currentMonth.getTime() === today.getTime()) {
    return currentMonth;
  }

  // Move to next month
  const nextMonth = addMonths(today, 1);
  return setDate(nextMonth, Math.min(dayOfMonth, getDaysInMonth(nextMonth)));
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Calculate utilization percentage
 */
function calculateUtilization(balance: number, limit: number): number {
  if (limit <= 0) return 0;
  return (balance / limit) * 100;
}

/**
 * Determine utilization status color
 */
function getUtilizationStatus(utilization: number): 'good' | 'medium' | 'high' | 'overlimit' {
  if (utilization > 100) return 'overlimit';
  if (utilization > 30) return 'high';
  if (utilization > 10) return 'medium';
  return 'good';
}

/**
 * Calculate the target balance for optimal utilization
 */
function calculateTargetBalance(creditLimit: number, targetUtilization: number = TARGET_UTILIZATION): number {
  return creditLimit * targetUtilization;
}

/**
 * Generate payment plan for a single card
 */
export function calculateCardPaymentPlan(
  card: CreditCard,
  targetUtilization: number = TARGET_UTILIZATION,
  referenceDate: Date = new Date()
): CardPaymentPlan {
  const today = startOfDay(referenceDate);

  // Calculate dates
  const nextStatementDate = getNextDateForDay(card.statementDate, today);
  const nextDueDate = getNextDateForDay(card.dueDate, nextStatementDate);

  // If due date is before statement date in the same month, it's for next month
  if (isBefore(nextDueDate, nextStatementDate)) {
    const adjustedDueDate = addMonths(nextDueDate, 1);
    Object.assign(nextDueDate, adjustedDueDate);
  }

  // Calculate utilization
  const currentUtilization = calculateUtilization(card.currentBalance, card.creditLimit);
  const targetBalance = calculateTargetBalance(card.creditLimit, targetUtilization);
  const targetUtilizationPercent = targetUtilization * 100;

  // Determine if optimization is needed
  const isOverLimit = card.currentBalance > card.creditLimit;
  const isAlreadyOptimal = card.currentBalance <= targetBalance;
  const needsOptimization = !isAlreadyOptimal && card.currentBalance > 0;

  const payments: Payment[] = [];
  let newUtilization = currentUtilization;

  if (isOverLimit) {
    // Urgent: pay down to under limit immediately
    const urgentPayment = card.currentBalance - card.creditLimit * 0.9;
    payments.push({
      date: today,
      amount: urgentPayment,
      purpose: 'optimization',
      description: 'URGENT: Pay immediately to get under credit limit'
    });

    // Then optimization payment before statement
    const optimizationDate = subDays(nextStatementDate, OPTIMIZATION_DAYS_BEFORE);
    const remainingAfterUrgent = card.currentBalance - urgentPayment;
    const optimizationPayment = Math.max(0, remainingAfterUrgent - targetBalance);

    if (optimizationPayment > 0) {
      payments.push({
        date: isBefore(optimizationDate, today) ? addDays(today, 1) : optimizationDate,
        amount: optimizationPayment,
        purpose: 'optimization',
        description: `Optimization payment - reduces reported balance to ${targetUtilizationPercent}%`
      });
    }

    // Final balance payment
    const finalBalance = Math.min(targetBalance, card.currentBalance - urgentPayment - optimizationPayment);
    if (finalBalance > 0) {
      payments.push({
        date: nextDueDate,
        amount: finalBalance,
        purpose: 'balance',
        description: 'Pay remaining balance to avoid interest'
      });
    }

    newUtilization = targetUtilizationPercent;
  } else if (needsOptimization) {
    // Standard two-payment strategy
    const optimizationDate = subDays(nextStatementDate, OPTIMIZATION_DAYS_BEFORE);
    const daysUntilOptimization = Math.ceil((optimizationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate optimization payment amount
    const optimizationAmount = card.currentBalance - targetBalance;

    if (daysUntilOptimization < 2) {
      // Not enough time - pay as soon as possible
      payments.push({
        date: addDays(today, 1),
        amount: optimizationAmount,
        purpose: 'optimization',
        description: `Optimization payment - reduces reported balance to ${targetUtilizationPercent}% (statement date is very close!)`
      });
    } else {
      payments.push({
        date: optimizationDate,
        amount: optimizationAmount,
        purpose: 'optimization',
        description: `Optimization payment - reduces reported balance to ${targetUtilizationPercent}%`
      });
    }

    // Balance payment on due date
    if (targetBalance > 0) {
      payments.push({
        date: nextDueDate,
        amount: targetBalance,
        purpose: 'balance',
        description: 'Pay remaining balance to avoid interest'
      });
    }

    newUtilization = targetUtilizationPercent;
  } else if (card.currentBalance > 0) {
    // Already optimal, just pay by due date
    payments.push({
      date: nextDueDate,
      amount: card.currentBalance,
      purpose: 'balance',
      description: 'Pay balance by due date - already optimally utilized!'
    });
    newUtilization = currentUtilization;
  }
  // If balance is 0, no payments needed

  return {
    card,
    currentUtilization,
    targetUtilization: targetUtilizationPercent,
    newUtilization,
    payments,
    nextStatementDate,
    nextDueDate,
    needsOptimization,
    isOverLimit,
    isAlreadyOptimal,
    utilizationStatus: getUtilizationStatus(currentUtilization)
  };
}

// Score impact ranges for utilization changes (negative = utilization increased)
const NEGATIVE_IMPACT_RANGES: Array<{ threshold: number; min: number; max: number }> = [
  { threshold: 5, min: -15, max: -5 },
  { threshold: 10, min: -25, max: -10 },
  { threshold: 20, min: -45, max: -25 },
  { threshold: 30, min: -70, max: -45 },
  { threshold: 40, min: -90, max: -70 },
  { threshold: Infinity, min: -120, max: -90 },
];

const POSITIVE_IMPACT_RANGES: Array<{ threshold: number; min: number; max: number }> = [
  { threshold: 5, min: 5, max: 12 },
  { threshold: 10, min: 8, max: 18 },
  { threshold: 20, min: 15, max: 30 },
  { threshold: 30, min: 25, max: 45 },
  { threshold: 40, min: 40, max: 65 },
  { threshold: 50, min: 60, max: 90 },
  { threshold: Infinity, min: 85, max: 120 },
];

// Severity multiplier based on starting utilization (higher = bigger gains potential)
function getSeverityMultiplier(currentUtilization: number): number {
  if (currentUtilization >= 70) return 1.3;
  if (currentUtilization >= 50) return 1.1;
  if (currentUtilization >= 30) return 0.85;
  return 0.6;
}

/**
 * Calculate estimated credit score impact based on utilization improvement.
 * Credit utilization accounts for 30% of FICO score.
 *
 * @param utilizationImprovement - Percentage point drop in utilization (e.g., 33.5 for 38.5% to 5%)
 * @param currentUtilization - Starting utilization percentage
 */
export function calculateScoreImpact(
  utilizationImprovement: number,
  currentUtilization: number = 50
): { min: number; max: number } {
  if (utilizationImprovement === 0) {
    return { min: 0, max: 0 };
  }

  // Handle negative impact (utilization increased)
  if (utilizationImprovement < 0) {
    const increase = Math.abs(utilizationImprovement);
    const range = NEGATIVE_IMPACT_RANGES.find(r => increase <= r.threshold);
    return range ? { min: range.min, max: range.max } : { min: -120, max: -90 };
  }

  // Handle positive impact (utilization decreased)
  const range = POSITIVE_IMPACT_RANGES.find(r => utilizationImprovement <= r.threshold);
  if (!range) {
    return { min: 85, max: 120 };
  }

  const multiplier = getSeverityMultiplier(currentUtilization);
  return {
    min: Math.round(range.min * multiplier),
    max: Math.min(Math.round(range.max * multiplier), 150),
  };
}

/**
 * Calculate optimization for multiple cards
 */
export function calculateOptimization(
  cards: CreditCard[],
  targetUtilization: number = TARGET_UTILIZATION,
  referenceDate: Date = new Date()
): OptimizationResult {
  // Sort cards by utilization (highest first) to prioritize
  const sortedCards = [...cards].sort((a, b) => {
    const utilA = calculateUtilization(a.currentBalance, a.creditLimit);
    const utilB = calculateUtilization(b.currentBalance, b.creditLimit);
    return utilB - utilA;
  });

  const cardPlans = sortedCards.map(card =>
    calculateCardPaymentPlan(card, targetUtilization, referenceDate)
  );

  // Calculate totals
  const totalCreditLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalCurrentBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0);

  const currentOverallUtilization = calculateUtilization(totalCurrentBalance, totalCreditLimit);

  // Calculate optimized utilization (target balance across all cards)
  const totalTargetBalance = cards.reduce(
    (sum, card) => sum + Math.min(card.currentBalance, calculateTargetBalance(card.creditLimit, targetUtilization)),
    0
  );
  const optimizedOverallUtilization = calculateUtilization(totalTargetBalance, totalCreditLimit);

  const utilizationImprovement = currentOverallUtilization - optimizedOverallUtilization;
  const estimatedScoreImpact = calculateScoreImpact(utilizationImprovement, currentOverallUtilization);

  return {
    cards: cardPlans,
    totalCreditLimit,
    totalCurrentBalance,
    currentOverallUtilization,
    optimizedOverallUtilization,
    estimatedScoreImpact,
    utilizationImprovement
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generate a cryptographically secure unique ID
 * Uses crypto.randomUUID() for better security and unpredictability
 */
export function generateId(): string {
  // Modern browsers and Node.js 16+ support crypto.randomUUID()
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Server-side Node.js fallback
  if (typeof require !== 'undefined') {
    try {
      const cryptoNode = require('crypto');
      return cryptoNode.randomUUID();
    } catch (e) {
      console.warn('[generateId] crypto module not available, using fallback');
    }
  }

  // Fallback for older browsers - UUID v4 format using crypto.getRandomValues
  // Still much better than Math.random()
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Last resort fallback (should rarely happen)
  console.error('[generateId] No secure random number generator available');
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}
