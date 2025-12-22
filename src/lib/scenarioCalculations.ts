import { CreditCard } from '@/types';
import { calculateScoreImpact } from './calculator';
import { addDays, isBefore } from 'date-fns';

export interface ScenarioResult {
  cards: CreditCard[];
  overallUtilization: number;
  utilizationChange: number;
  estimatedScoreImpact: {
    min: number;
    max: number;
  };
  scoreChange: {
    min: number;
    max: number;
  };
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
 * Calculate baseline scenario from current cards
 */
export function calculateBaseline(cards: CreditCard[]): ScenarioResult {
  const totalCreditLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0);
  const overallUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

  const cardsOver30Percent = cards.filter(card => {
    const util = (card.currentBalance / card.creditLimit) * 100;
    return util > 30;
  }).length;

  const cardsOver50Percent = cards.filter(card => {
    const util = (card.currentBalance / card.creditLimit) * 100;
    return util > 50;
  }).length;

  // For baseline, score impact is 0 (no change from current state)
  const scoreImpact = { min: 0, max: 0 };

  return {
    cards,
    overallUtilization,
    utilizationChange: 0,
    estimatedScoreImpact: scoreImpact,
    scoreChange: { min: 0, max: 0 },
    warnings: [],
    recommendations: [],
    metrics: {
      totalCreditLimit,
      totalBalance,
      cardsOver30Percent,
      cardsOver50Percent,
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
  newPaymentAmount: number,
  _paymentDate: Date
): ScenarioResult {
  const baseline = calculateBaseline(cards);
  const updatedCards = cards.map(card => {
    if (card.id === cardId) {
      const newBalance = Math.max(0, card.currentBalance - newPaymentAmount);
      return { ...card, currentBalance: newBalance };
    }
    return card;
  });

  const targetCard = cards.find(c => c.id === cardId);
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (targetCard) {
    const minimumPayment = targetCard.currentBalance * 0.02; // Typically 2% minimum
    if (newPaymentAmount < minimumPayment && newPaymentAmount < targetCard.currentBalance) {
      warnings.push(
        `Payment below minimum (${minimumPayment.toFixed(0)}). You'll be charged a late fee (~$25-40).`
      );
    }

    const remainingBalance = targetCard.currentBalance - newPaymentAmount;
    const newUtilization = (remainingBalance / targetCard.creditLimit) * 100;

    if (newUtilization > 30) {
      warnings.push(
        `Card utilization will be ${newUtilization.toFixed(1)}%, which may hurt your score. Consider paying more.`
      );
    }

    if (newUtilization < 10) {
      recommendations.push(
        `Excellent! This payment brings utilization to ${newUtilization.toFixed(1)}%, optimal for credit scores.`
      );
    }

    // Interest calculation (assuming 20% APR average)
    if (remainingBalance > 0) {
      const monthlyInterest = (remainingBalance * 0.20) / 12;
      warnings.push(
        `Remaining balance of $${remainingBalance.toFixed(2)} will accrue ~$${monthlyInterest.toFixed(2)} in interest this month.`
      );
    } else {
      recommendations.push('Paying in full means zero interest charges!');
    }
  }

  const result = calculateBaseline(updatedCards);
  const utilizationChange = result.overallUtilization - baseline.overallUtilization;

  // Calculate actual score improvement from baseline to new state
  // Positive utilizationImprovement = score goes UP (utilization goes DOWN)
  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);

  // The estimated score impact IS the improvement from making this payment
  // scoreChange is the same as scoreImpact for payment scenarios
  const scoreChange = {
    min: scoreImpact.min,
    max: scoreImpact.max,
  };

  return {
    ...result,
    utilizationChange,
    estimatedScoreImpact: scoreImpact,  // This is the actual score boost from this payment
    scoreChange,
    warnings,
    recommendations,
  };
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
    warnings.push('Card not found');
    return { ...baseline, warnings };
  }

  // Check if purchase is before or after statement date
  const statementDate = targetCard.statementDate ? new Date(targetCard.statementDate) : new Date();
  const isBeforeStatement = isBefore(purchaseDate, statementDate);

  const updatedCards = cards.map(card => {
    if (card.id === cardId) {
      const newBalance = card.currentBalance + purchaseAmount;

      // Check if exceeds credit limit
      if (newBalance > card.creditLimit) {
        warnings.push(
          `This purchase would exceed your credit limit by $${(newBalance - card.creditLimit).toFixed(2)}. Transaction will be declined.`
        );
        return card;
      }

      return { ...card, currentBalance: newBalance };
    }
    return card;
  });

  const newUtilization = ((targetCard.currentBalance + purchaseAmount) / targetCard.creditLimit) * 100;

  if (isBeforeStatement) {
    warnings.push(
      `Purchase before statement date means ${newUtilization.toFixed(1)}% utilization will be reported to credit bureaus.`
    );

    if (newUtilization > 30) {
      const daysUntilStatement = Math.ceil(
        (statementDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const alternativeDate = addDays(statementDate, 1);
      recommendations.push(
        `Consider waiting ${daysUntilStatement} days until after your statement date (${alternativeDate.toLocaleDateString()}) to make this purchase.`
      );
      recommendations.push(
        `Or, pay down $${(purchaseAmount * 0.7).toFixed(2)} before the statement closes to keep utilization under 30%.`
      );
    }
  } else {
    recommendations.push(
      `Good timing! Purchase after statement date means current ${baseline.overallUtilization.toFixed(1)}% utilization is reported, not the higher amount.`
    );
    recommendations.push(
      `You'll have until the next billing cycle to pay this off before it affects your credit report.`
    );
  }

  const result = calculateBaseline(updatedCards);
  const utilizationChange = result.overallUtilization - baseline.overallUtilization;

  // Calculate actual score impact from baseline to new state
  // Negative utilizationImprovement = score goes DOWN (utilization goes UP)
  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);

  // The estimated score impact IS the change from making this purchase
  const scoreChange = {
    min: scoreImpact.min,
    max: scoreImpact.max,
  };

  return {
    ...result,
    utilizationChange,
    estimatedScoreImpact: scoreImpact,  // This is the actual score impact from this purchase
    scoreChange,
    warnings,
    recommendations,
  };
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
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!targetCard) {
    warnings.push('Card not found');
    return { ...baseline, warnings };
  }

  if (newLimit < targetCard.currentBalance) {
    warnings.push(
      `New limit ($${newLimit}) cannot be lower than current balance ($${targetCard.currentBalance}).`
    );
    return { ...baseline, warnings };
  }

  const percentIncrease = ((newLimit - targetCard.creditLimit) / targetCard.creditLimit) * 100;

  const updatedCards = cards.map(card => {
    if (card.id === cardId) {
      return { ...card, creditLimit: newLimit };
    }
    return card;
  });

  const oldUtilization = (targetCard.currentBalance / targetCard.creditLimit) * 100;
  const newUtilization = (targetCard.currentBalance / newLimit) * 100;

  recommendations.push(
    `Credit limit increase of ${percentIncrease.toFixed(0)}% drops this card's utilization from ${oldUtilization.toFixed(1)}% to ${newUtilization.toFixed(1)}%.`
  );

  if (newUtilization < 10) {
    recommendations.push(
      `Excellent! New utilization under 10% is optimal for credit scores.`
    );
  }

  recommendations.push(
    `Best time to request: 6-12 months after your last increase, or after a significant income increase.`
  );

  recommendations.push(
    `Tip: Call your card issuer and request an increase. Many issuers approve 50-100% increases automatically.`
  );

  const result = calculateBaseline(updatedCards);
  const utilizationChange = result.overallUtilization - baseline.overallUtilization;

  // Calculate actual score impact from baseline to new state
  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);

  const scoreChange = {
    min: scoreImpact.min,
    max: scoreImpact.max,
  };

  return {
    ...result,
    utilizationChange,
    estimatedScoreImpact: scoreImpact,
    scoreChange,
    warnings,
    recommendations,
  };
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
    statementDate: new Date().toISOString(),
    dueDate: addDays(new Date(), 25).toISOString(),
  };

  const updatedCards = [...existingCards, newCard];
  const result = calculateBaseline(updatedCards);
  const utilizationChange = result.overallUtilization - baseline.overallUtilization;

  if (includeHardInquiry) {
    warnings.push(
      `Hard inquiry will temporarily decrease your score by 5-10 points for ~12 months.`
    );
    recommendations.push(
      `Short-term impact: -5 to -10 points from hard inquiry.`
    );
  }

  recommendations.push(
    `Long-term benefit: Overall utilization drops from ${baseline.overallUtilization.toFixed(1)}% to ${result.overallUtilization.toFixed(1)}%.`
  );

  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);

  // Adjust for hard inquiry - calculate directly to avoid mutation
  const scoreChange = includeHardInquiry
    ? {
        min: scoreImpact.min - 10,
        max: scoreImpact.max - 5,
      }
    : {
        min: scoreImpact.min,
        max: scoreImpact.max,
      };

  recommendations.push(
    `Estimated net score change: ${scoreChange.min > 0 ? '+' : ''}${scoreChange.min} to ${scoreChange.max > 0 ? '+' : ''}${scoreChange.max} points after 6 months.`
  );

  // Average age impact
  if (existingCards.length > 0) {
    warnings.push(
      `Opening a new card will lower your average account age, which may temporarily reduce your score by 5-15 points.`
    );
  }

  // Credit mix benefit
  recommendations.push(
    `Credit mix benefit: Having ${existingCards.length + 1} cards shows diverse credit management.`
  );

  return {
    ...result,
    utilizationChange,
    estimatedScoreImpact: scoreChange,  // Include hard inquiry adjustment
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
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!targetCard) {
    warnings.push('Card not found');
    return { ...baseline, warnings };
  }

  if (targetCard.currentBalance > 0) {
    warnings.push(
      `You cannot close a card with an outstanding balance of $${targetCard.currentBalance.toFixed(2)}. Pay it off first.`
    );
    return { ...baseline, warnings };
  }

  const updatedCards = cards.filter(c => c.id !== cardIdToClose);
  const result = calculateBaseline(updatedCards);
  const utilizationChange = result.overallUtilization - baseline.overallUtilization;

  warnings.push(
    `Closing this card will reduce your total available credit by $${targetCard.creditLimit.toFixed(2)}.`
  );

  warnings.push(
    `Overall utilization will increase from ${baseline.overallUtilization.toFixed(1)}% to ${result.overallUtilization.toFixed(1)}%.`
  );

  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);
  const scoreChange = {
    min: scoreImpact.min,
    max: scoreImpact.max,
  };

  warnings.push(
    `Estimated score impact: ${scoreChange.min} to ${scoreChange.max} points.`
  );

  // Check if it's the oldest card (would need card age data)
  if (cards.length > 1 && cards.indexOf(targetCard) === 0) {
    warnings.push(
      `⚠️ WARNING: This appears to be one of your oldest cards. Closing it may hurt your credit age and reduce your score by an additional 10-20 points.`
    );
  }

  recommendations.push(
    `Alternative: Keep the card open with a $0 balance. Set up a small recurring charge (like Netflix) with autopay to prevent closure due to inactivity.`
  );

  if (targetCard.creditLimit > 5000) {
    recommendations.push(
      `This card has a high credit limit. Consider requesting a product change to a no-annual-fee version instead of closing.`
    );
  }

  return {
    ...result,
    utilizationChange,
    estimatedScoreImpact: scoreImpact,
    scoreChange,
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
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!fromCard || !toCard) {
    warnings.push('Card not found');
    return { ...baseline, warnings };
  }

  if (transferAmount > fromCard.currentBalance) {
    warnings.push(
      `Transfer amount ($${transferAmount}) exceeds available balance on source card ($${fromCard.currentBalance}).`
    );
    return { ...baseline, warnings };
  }

  const fee = transferAmount * (transferFeePercent / 100);
  const totalToTransfer = transferAmount + fee;

  if (toCard.currentBalance + totalToTransfer > toCard.creditLimit) {
    warnings.push(
      `Transfer would exceed destination card's credit limit. Maximum you can transfer: $${(toCard.creditLimit - toCard.currentBalance - fee).toFixed(2)}.`
    );
    return { ...baseline, warnings };
  }

  const updatedCards = cards.map(card => {
    if (card.id === fromCardId) {
      return { ...card, currentBalance: card.currentBalance - transferAmount };
    }
    if (card.id === toCardId) {
      return { ...card, currentBalance: card.currentBalance + totalToTransfer };
    }
    return card;
  });

  const fromCardOldUtil = (fromCard.currentBalance / fromCard.creditLimit) * 100;
  const fromCardNewUtil = ((fromCard.currentBalance - transferAmount) / fromCard.creditLimit) * 100;
  const toCardOldUtil = (toCard.currentBalance / toCard.creditLimit) * 100;
  const toCardNewUtil = ((toCard.currentBalance + totalToTransfer) / toCard.creditLimit) * 100;

  recommendations.push(
    `${fromCard.nickname}: Utilization drops from ${fromCardOldUtil.toFixed(1)}% to ${fromCardNewUtil.toFixed(1)}%.`
  );

  if (toCardNewUtil > 30) {
    warnings.push(
      `${toCard.nickname}: Utilization increases from ${toCardOldUtil.toFixed(1)}% to ${toCardNewUtil.toFixed(1)}%. This may hurt your score.`
    );
  } else {
    recommendations.push(
      `${toCard.nickname}: Utilization increases from ${toCardOldUtil.toFixed(1)}% to ${toCardNewUtil.toFixed(1)}% (still under 30%).`
    );
  }

  warnings.push(
    `Balance transfer fee: $${fee.toFixed(2)} (${transferFeePercent}% of transfer amount).`
  );

  // Interest savings calculation (assuming 20% APR on source, 0% intro on destination)
  const monthlyInterest = (transferAmount * 0.20) / 12;
  const yearlyInterest = monthlyInterest * 12;
  const netSavings = yearlyInterest - fee;

  if (netSavings > 0) {
    recommendations.push(
      `Potential interest savings: $${yearlyInterest.toFixed(2)}/year. Net benefit after fee: $${netSavings.toFixed(2)}.`
    );
  } else {
    warnings.push(
      `Fee ($${fee.toFixed(2)}) may outweigh interest savings ($${yearlyInterest.toFixed(2)}/year).`
    );
  }

  const result = calculateBaseline(updatedCards);
  const utilizationChange = result.overallUtilization - baseline.overallUtilization;

  const utilizationImprovement = baseline.overallUtilization - result.overallUtilization;
  const scoreImpact = calculateScoreImpact(utilizationImprovement);
  const scoreChange = {
    min: scoreImpact.min,
    max: scoreImpact.max,
  };

  return {
    ...result,
    utilizationChange,
    estimatedScoreImpact: scoreImpact,
    scoreChange,
    warnings,
    recommendations,
  };
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

  // Utilization comparison
  if (scenario.overallUtilization < baseline.overallUtilization) {
    improvements.push(
      `Utilization improves: ${baseline.overallUtilization.toFixed(1)}% → ${scenario.overallUtilization.toFixed(1)}%`
    );
  } else if (scenario.overallUtilization > baseline.overallUtilization) {
    declines.push(
      `Utilization worsens: ${baseline.overallUtilization.toFixed(1)}% → ${scenario.overallUtilization.toFixed(1)}%`
    );
  }

  // Cards over 30%
  if (scenario.metrics.cardsOver30Percent < baseline.metrics.cardsOver30Percent) {
    improvements.push(
      `Cards over 30%: ${baseline.metrics.cardsOver30Percent} → ${scenario.metrics.cardsOver30Percent}`
    );
  } else if (scenario.metrics.cardsOver30Percent > baseline.metrics.cardsOver30Percent) {
    declines.push(
      `Cards over 30%: ${baseline.metrics.cardsOver30Percent} → ${scenario.metrics.cardsOver30Percent}`
    );
  }

  // Available credit
  if (scenario.metrics.totalCreditLimit > baseline.metrics.totalCreditLimit) {
    improvements.push(
      `Available credit increases: $${baseline.metrics.totalCreditLimit.toFixed(0)} → $${scenario.metrics.totalCreditLimit.toFixed(0)}`
    );
  } else if (scenario.metrics.totalCreditLimit < baseline.metrics.totalCreditLimit) {
    declines.push(
      `Available credit decreases: $${baseline.metrics.totalCreditLimit.toFixed(0)} → $${scenario.metrics.totalCreditLimit.toFixed(0)}`
    );
  }

  // Score impact
  const baselineAvgScore = (baseline.estimatedScoreImpact.min + baseline.estimatedScoreImpact.max) / 2;
  const scenarioAvgScore = (scenario.estimatedScoreImpact.min + scenario.estimatedScoreImpact.max) / 2;

  if (scenarioAvgScore > baselineAvgScore) {
    improvements.push(
      `Score impact improves: +${baselineAvgScore.toFixed(0)} pts → +${scenarioAvgScore.toFixed(0)} pts`
    );
  } else if (scenarioAvgScore < baselineAvgScore) {
    declines.push(
      `Score impact worsens: +${baselineAvgScore.toFixed(0)} pts → +${scenarioAvgScore.toFixed(0)} pts`
    );
  }

  const netChange: 'positive' | 'negative' | 'neutral' =
    improvements.length > declines.length
      ? 'positive'
      : declines.length > improvements.length
      ? 'negative'
      : 'neutral';

  return {
    baseline,
    scenario,
    improvements,
    declines,
    netChange,
  };
}
