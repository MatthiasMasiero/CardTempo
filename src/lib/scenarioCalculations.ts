import { CreditCard } from '@/types';
import { calculateScoreImpact } from './calculator';
import { addDays, isBefore } from 'date-fns';

export interface ScenarioResult {
  cards: CreditCard[];
  overallUtilization: number;
  utilizationChange: number;
  estimatedScoreImpact: { min: number; max: number };
  scoreChange: { min: number; max: number };
  warnings: string[];
  recommendations: string[];
  metrics: {
    totalCreditLimit: number;
    totalBalance: number;
    cardsOver30Percent: number;
    cardsOver50Percent: number;
    averageUtilization: number;
  };
}

export interface ComparisonResult {
  baseline: ScenarioResult;
  scenario: ScenarioResult;
  improvements: string[];
  declines: string[];
  netChange: 'positive' | 'negative' | 'neutral';
}

/**
 * Calculate card utilization percentage.
 */
function cardUtilization(card: CreditCard): number {
  return (card.currentBalance / card.creditLimit) * 100;
}

/**
 * Count cards exceeding a utilization threshold.
 */
function countCardsOverThreshold(cards: CreditCard[], threshold: number): number {
  return cards.filter(card => cardUtilization(card) > threshold).length;
}

/**
 * Build a ScenarioResult from cards with computed score impact from baseline.
 */
function buildScenarioResult(
  cards: CreditCard[],
  baseline: ScenarioResult,
  warnings: string[] = [],
  recommendations: string[] = []
): ScenarioResult {
  const result = calculateBaseline(cards);
  const utilizationChange = result.overallUtilization - baseline.overallUtilization;
  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);

  return {
    ...result,
    utilizationChange,
    estimatedScoreImpact: scoreImpact,
    scoreChange: scoreImpact,
    warnings,
    recommendations,
  };
}

/**
 * Calculate baseline scenario from current cards.
 */
export function calculateBaseline(cards: CreditCard[]): ScenarioResult {
  const totalCreditLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0);
  const overallUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

  const noImpact = { min: 0, max: 0 };

  return {
    cards,
    overallUtilization,
    utilizationChange: 0,
    estimatedScoreImpact: noImpact,
    scoreChange: noImpact,
    warnings: [],
    recommendations: [],
    metrics: {
      totalCreditLimit,
      totalBalance,
      cardsOver30Percent: countCardsOverThreshold(cards, 30),
      cardsOver50Percent: countCardsOverThreshold(cards, 50),
      averageUtilization: overallUtilization,
    },
  };
}

/**
 * Scenario 1: Payment Amount Variation
 */
export function calculatePaymentAdjustment(
  cards: CreditCard[],
  cardId: string,
  newPaymentAmount: number
): ScenarioResult {
  const baseline = calculateBaseline(cards);
  const targetCard = cards.find(c => c.id === cardId);
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const updatedCards = cards.map(card => {
    if (card.id === cardId) {
      return { ...card, currentBalance: Math.max(0, card.currentBalance - newPaymentAmount) };
    }
    return card;
  });

  if (targetCard) {
    const minimumPayment = targetCard.currentBalance * 0.02;
    const remainingBalance = targetCard.currentBalance - newPaymentAmount;
    const newUtilization = (remainingBalance / targetCard.creditLimit) * 100;

    if (newPaymentAmount < minimumPayment && newPaymentAmount < targetCard.currentBalance) {
      warnings.push(`Payment below minimum (${minimumPayment.toFixed(0)}). You'll be charged a late fee (~$25-40).`);
    }

    if (newUtilization > 30) {
      warnings.push(`Card utilization will be ${newUtilization.toFixed(1)}%, which may hurt your score. Consider paying more.`);
    } else if (newUtilization < 10) {
      recommendations.push(`Excellent! This payment brings utilization to ${newUtilization.toFixed(1)}%, optimal for credit scores.`);
    }

    if (remainingBalance > 0) {
      const monthlyInterest = (remainingBalance * 0.20) / 12;
      warnings.push(`Remaining balance of $${remainingBalance.toFixed(2)} will accrue ~$${monthlyInterest.toFixed(2)} in interest this month.`);
    } else {
      recommendations.push('Paying in full means zero interest charges!');
    }
  }

  return buildScenarioResult(updatedCards, baseline, warnings, recommendations);
}

/**
 * Scenario 2: Large Purchase Impact
 */
export function calculatePurchaseImpact(
  cards: CreditCard[],
  cardId: string,
  purchaseAmount: number,
  purchaseDate: Date
): ScenarioResult {
  const baseline = calculateBaseline(cards);
  const targetCard = cards.find(c => c.id === cardId);
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!targetCard) {
    return { ...baseline, warnings: ['Card not found'] };
  }

  const newBalance = targetCard.currentBalance + purchaseAmount;
  const newUtilization = (newBalance / targetCard.creditLimit) * 100;

  // Check if exceeds credit limit
  if (newBalance > targetCard.creditLimit) {
    warnings.push(`This purchase would exceed your credit limit by $${(newBalance - targetCard.creditLimit).toFixed(2)}. Transaction will be declined.`);
    return { ...baseline, warnings };
  }

  const updatedCards = cards.map(card =>
    card.id === cardId ? { ...card, currentBalance: newBalance } : card
  );

  // Check timing relative to statement date
  const statementDate = new Date();
  statementDate.setDate(targetCard.statementDate);
  const isBeforeStatement = isBefore(purchaseDate, statementDate);

  if (isBeforeStatement) {
    warnings.push(`Purchase before statement date means ${newUtilization.toFixed(1)}% utilization will be reported to credit bureaus.`);

    if (newUtilization > 30) {
      const daysUntilStatement = Math.ceil((statementDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const alternativeDate = addDays(statementDate, 1);
      recommendations.push(`Consider waiting ${daysUntilStatement} days until after your statement date (${alternativeDate.toLocaleDateString()}) to make this purchase.`);
      recommendations.push(`Or, pay down $${(purchaseAmount * 0.7).toFixed(2)} before the statement closes to keep utilization under 30%.`);
    }
  } else {
    recommendations.push(`Good timing! Purchase after statement date means current ${baseline.overallUtilization.toFixed(1)}% utilization is reported, not the higher amount.`);
    recommendations.push(`You'll have until the next billing cycle to pay this off before it affects your credit report.`);
  }

  return buildScenarioResult(updatedCards, baseline, warnings, recommendations);
}

/**
 * Scenario 3: Credit Limit Increase
 */
export function calculateLimitIncrease(
  cards: CreditCard[],
  cardId: string,
  newLimit: number
): ScenarioResult {
  const baseline = calculateBaseline(cards);
  const targetCard = cards.find(c => c.id === cardId);

  if (!targetCard) {
    return { ...baseline, warnings: ['Card not found'] };
  }

  if (newLimit < targetCard.currentBalance) {
    return { ...baseline, warnings: [`New limit ($${newLimit}) cannot be lower than current balance ($${targetCard.currentBalance}).`] };
  }

  const recommendations: string[] = [];
  const oldUtilization = cardUtilization(targetCard);
  const newUtilization = (targetCard.currentBalance / newLimit) * 100;
  const percentIncrease = ((newLimit - targetCard.creditLimit) / targetCard.creditLimit) * 100;

  recommendations.push(`Credit limit increase of ${percentIncrease.toFixed(0)}% drops this card's utilization from ${oldUtilization.toFixed(1)}% to ${newUtilization.toFixed(1)}%.`);

  if (newUtilization < 10) {
    recommendations.push(`Excellent! New utilization under 10% is optimal for credit scores.`);
  }

  recommendations.push(`Best time to request: 6-12 months after your last increase, or after a significant income increase.`);
  recommendations.push(`Tip: Call your card issuer and request an increase. Many issuers approve 50-100% increases automatically.`);

  const updatedCards = cards.map(card =>
    card.id === cardId ? { ...card, creditLimit: newLimit } : card
  );

  return buildScenarioResult(updatedCards, baseline, [], recommendations);
}

/**
 * Scenario 4: New Card Addition
 */
export function calculateNewCard(
  existingCards: CreditCard[],
  newCardLimit: number,
  startingBalance: number = 0,
  includeHardInquiry: boolean = true
): ScenarioResult {
  const baseline = calculateBaseline(existingCards);
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const newCard: CreditCard = {
    id: `new-card-${Date.now()}`,
    nickname: 'New Card',
    creditLimit: newCardLimit,
    currentBalance: startingBalance,
    statementDate: 15,
    dueDate: 10,
  };

  const updatedCards = [...existingCards, newCard];
  const result = calculateBaseline(updatedCards);

  if (includeHardInquiry) {
    warnings.push(`Hard inquiry will temporarily decrease your score by 5-10 points for ~12 months.`);
    recommendations.push(`Short-term impact: -5 to -10 points from hard inquiry.`);
  }

  recommendations.push(`Long-term benefit: Overall utilization drops from ${baseline.overallUtilization.toFixed(1)}% to ${result.overallUtilization.toFixed(1)}%.`);

  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);

  // Adjust for hard inquiry impact
  const scoreChange = includeHardInquiry
    ? { min: scoreImpact.min - 10, max: scoreImpact.max - 5 }
    : scoreImpact;

  recommendations.push(`Estimated net score change: ${scoreChange.min > 0 ? '+' : ''}${scoreChange.min} to ${scoreChange.max > 0 ? '+' : ''}${scoreChange.max} points after 6 months.`);

  if (existingCards.length > 0) {
    warnings.push(`Opening a new card will lower your average account age, which may temporarily reduce your score by 5-15 points.`);
  }

  recommendations.push(`Credit mix benefit: Having ${existingCards.length + 1} cards shows diverse credit management.`);

  return {
    ...result,
    utilizationChange: result.overallUtilization - baseline.overallUtilization,
    estimatedScoreImpact: scoreChange,
    scoreChange,
    warnings,
    recommendations,
  };
}

/**
 * Scenario 5: Closing a Card
 */
export function calculateCardClosure(
  cards: CreditCard[],
  cardIdToClose: string
): ScenarioResult {
  const baseline = calculateBaseline(cards);
  const targetCard = cards.find(c => c.id === cardIdToClose);

  if (!targetCard) {
    return { ...baseline, warnings: ['Card not found'] };
  }

  if (targetCard.currentBalance > 0) {
    return { ...baseline, warnings: [`You cannot close a card with an outstanding balance of $${targetCard.currentBalance.toFixed(2)}. Pay it off first.`] };
  }

  const warnings: string[] = [];
  const recommendations: string[] = [];
  const updatedCards = cards.filter(c => c.id !== cardIdToClose);
  const result = calculateBaseline(updatedCards);

  warnings.push(`Closing this card will reduce your total available credit by $${targetCard.creditLimit.toFixed(2)}.`);
  warnings.push(`Overall utilization will increase from ${baseline.overallUtilization.toFixed(1)}% to ${result.overallUtilization.toFixed(1)}%.`);

  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);

  warnings.push(`Estimated score impact: ${scoreImpact.min} to ${scoreImpact.max} points.`);

  // Check if it's potentially the oldest card
  if (cards.length > 1 && cards.indexOf(targetCard) === 0) {
    warnings.push(`WARNING: This appears to be one of your oldest cards. Closing it may hurt your credit age and reduce your score by an additional 10-20 points.`);
  }

  recommendations.push(`Alternative: Keep the card open with a $0 balance. Set up a small recurring charge (like Netflix) with autopay to prevent closure due to inactivity.`);

  if (targetCard.creditLimit > 5000) {
    recommendations.push(`This card has a high credit limit. Consider requesting a product change to a no-annual-fee version instead of closing.`);
  }

  return {
    ...result,
    utilizationChange: result.overallUtilization - baseline.overallUtilization,
    estimatedScoreImpact: scoreImpact,
    scoreChange: scoreImpact,
    warnings,
    recommendations,
  };
}

/**
 * Scenario 6: Balance Transfer
 */
export function calculateBalanceTransfer(
  cards: CreditCard[],
  fromCardId: string,
  toCardId: string,
  transferAmount: number,
  transferFeePercent: number = 3
): ScenarioResult {
  const baseline = calculateBaseline(cards);
  const fromCard = cards.find(c => c.id === fromCardId);
  const toCard = cards.find(c => c.id === toCardId);

  if (!fromCard || !toCard) {
    return { ...baseline, warnings: ['Card not found'] };
  }

  if (transferAmount > fromCard.currentBalance) {
    return { ...baseline, warnings: [`Transfer amount ($${transferAmount}) exceeds available balance on source card ($${fromCard.currentBalance}).`] };
  }

  const fee = transferAmount * (transferFeePercent / 100);
  const totalToTransfer = transferAmount + fee;

  if (toCard.currentBalance + totalToTransfer > toCard.creditLimit) {
    const maxTransfer = toCard.creditLimit - toCard.currentBalance - fee;
    return { ...baseline, warnings: [`Transfer would exceed destination card's credit limit. Maximum you can transfer: $${maxTransfer.toFixed(2)}.`] };
  }

  const warnings: string[] = [];
  const recommendations: string[] = [];

  const updatedCards = cards.map(card => {
    if (card.id === fromCardId) {
      return { ...card, currentBalance: card.currentBalance - transferAmount };
    }
    if (card.id === toCardId) {
      return { ...card, currentBalance: card.currentBalance + totalToTransfer };
    }
    return card;
  });

  const fromCardOldUtil = cardUtilization(fromCard);
  const fromCardNewUtil = ((fromCard.currentBalance - transferAmount) / fromCard.creditLimit) * 100;
  const toCardOldUtil = cardUtilization(toCard);
  const toCardNewUtil = ((toCard.currentBalance + totalToTransfer) / toCard.creditLimit) * 100;

  recommendations.push(`${fromCard.nickname}: Utilization drops from ${fromCardOldUtil.toFixed(1)}% to ${fromCardNewUtil.toFixed(1)}%.`);

  if (toCardNewUtil > 30) {
    warnings.push(`${toCard.nickname}: Utilization increases from ${toCardOldUtil.toFixed(1)}% to ${toCardNewUtil.toFixed(1)}%. This may hurt your score.`);
  } else {
    recommendations.push(`${toCard.nickname}: Utilization increases from ${toCardOldUtil.toFixed(1)}% to ${toCardNewUtil.toFixed(1)}% (still under 30%).`);
  }

  warnings.push(`Balance transfer fee: $${fee.toFixed(2)} (${transferFeePercent}% of transfer amount).`);

  // Interest savings calculation (assuming 20% APR on source, 0% intro on destination)
  const yearlyInterest = transferAmount * 0.20;
  const netSavings = yearlyInterest - fee;

  if (netSavings > 0) {
    recommendations.push(`Potential interest savings: $${yearlyInterest.toFixed(2)}/year. Net benefit after fee: $${netSavings.toFixed(2)}.`);
  } else {
    warnings.push(`Fee ($${fee.toFixed(2)}) may outweigh interest savings ($${yearlyInterest.toFixed(2)}/year).`);
  }

  return buildScenarioResult(updatedCards, baseline, warnings, recommendations);
}

/**
 * Compare two scenarios
 */
export function compareScenarios(
  baseline: ScenarioResult,
  scenario: ScenarioResult
): ComparisonResult {
  const improvements: string[] = [];
  const declines: string[] = [];

  // Helper to add comparison message to appropriate array
  function addComparison(
    baselineValue: number,
    scenarioValue: number,
    lowerIsBetter: boolean,
    formatFn: (base: number, scenario: number) => string
  ): void {
    const improved = lowerIsBetter
      ? scenarioValue < baselineValue
      : scenarioValue > baselineValue;
    const declined = lowerIsBetter
      ? scenarioValue > baselineValue
      : scenarioValue < baselineValue;

    if (improved) {
      improvements.push(formatFn(baselineValue, scenarioValue));
    } else if (declined) {
      declines.push(formatFn(baselineValue, scenarioValue));
    }
  }

  addComparison(
    baseline.overallUtilization,
    scenario.overallUtilization,
    true,
    (b, s) => `Utilization ${s < b ? 'improves' : 'worsens'}: ${b.toFixed(1)}% -> ${s.toFixed(1)}%`
  );

  addComparison(
    baseline.metrics.cardsOver30Percent,
    scenario.metrics.cardsOver30Percent,
    true,
    (b, s) => `Cards over 30%: ${b} -> ${s}`
  );

  addComparison(
    baseline.metrics.totalCreditLimit,
    scenario.metrics.totalCreditLimit,
    false,
    (b, s) => `Available credit ${s > b ? 'increases' : 'decreases'}: $${b.toFixed(0)} -> $${s.toFixed(0)}`
  );

  const baselineAvgScore = (baseline.estimatedScoreImpact.min + baseline.estimatedScoreImpact.max) / 2;
  const scenarioAvgScore = (scenario.estimatedScoreImpact.min + scenario.estimatedScoreImpact.max) / 2;

  addComparison(
    baselineAvgScore,
    scenarioAvgScore,
    false,
    (b, s) => `Score impact ${s > b ? 'improves' : 'worsens'}: +${b.toFixed(0)} pts -> +${s.toFixed(0)} pts`
  );

  // Determine net change
  let netChange: 'positive' | 'negative' | 'neutral';
  if (improvements.length > declines.length) {
    netChange = 'positive';
  } else if (declines.length > improvements.length) {
    netChange = 'negative';
  } else {
    netChange = 'neutral';
  }

  return { baseline, scenario, improvements, declines, netChange };
}
