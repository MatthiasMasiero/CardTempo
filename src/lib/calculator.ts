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

/**
 * Calculate estimated credit score impact based on utilization improvement
 *
 * Credit utilization accounts for 30-35% of FICO score (210-280 points out of 850)
 * Improving utilization can have significant impact on score
 *
 * Estimates are conservative and based on:
 * - Industry research on credit scoring models
 * - Utilization is 30% of FICO score
 * - Assumes good payment history (otherwise impact is lower)
 */
export function calculateScoreImpact(utilizationImprovement: number): { min: number; max: number } {
  // Handle negative impact (utilization increased)
  if (utilizationImprovement < 0) {
    const utilizationIncrease = Math.abs(utilizationImprovement);

    // Very small increase (0-5% utilization increase)
    if (utilizationIncrease <= 5) {
      return { min: -15, max: -5 };
    }

    // Small increase (5-10% utilization increase)
    if (utilizationIncrease <= 10) {
      return { min: -25, max: -10 };
    }

    // Moderate increase (10-20% utilization increase)
    if (utilizationIncrease <= 20) {
      return { min: -45, max: -25 };
    }

    // Large increase (20-30% utilization increase)
    if (utilizationIncrease <= 30) {
      return { min: -70, max: -45 };
    }

    // Very large increase (30-40% utilization increase)
    if (utilizationIncrease <= 40) {
      return { min: -90, max: -70 };
    }

    // Extreme increase (40%+ utilization increase)
    return { min: -120, max: -90 };
  }

  // No change
  if (utilizationImprovement === 0) {
    return { min: 0, max: 0 };
  }

  // Very small improvement (0-5% utilization drop)
  if (utilizationImprovement <= 5) {
    return { min: 5, max: 15 };
  }

  // Small improvement (5-10% utilization drop)
  // Example: 40% → 35% utilization
  if (utilizationImprovement <= 10) {
    return { min: 10, max: 25 };
  }

  // Moderate improvement (10-20% utilization drop)
  // Example: 45% → 30% or 35% → 20%
  if (utilizationImprovement <= 20) {
    return { min: 25, max: 45 };
  }

  // Good improvement (20-30% utilization drop)
  // Example: 50% → 25% or 40% → 15%
  if (utilizationImprovement <= 30) {
    return { min: 45, max: 70 };
  }

  // Excellent improvement (30-40% utilization drop)
  // Example: 60% → 25% or 50% → 15%
  if (utilizationImprovement <= 40) {
    return { min: 70, max: 100 };
  }

  // Outstanding improvement (40-50% utilization drop)
  if (utilizationImprovement <= 50) {
    return { min: 100, max: 130 };
  }

  // Extreme improvement (50%+ utilization drop)
  // Example: 80% → 10% or 90% → 5%
  return { min: 130, max: 160 };
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
  const estimatedScoreImpact = calculateScoreImpact(utilizationImprovement);

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
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
