// Priority-based payment allocation system

export interface CardForRanking {
  id: string;
  name: string;
  currentBalance: number;
  creditLimit: number;
  apr: number;
  minimumPayment: number;
  statementDate: number; // Day of month
  dueDate: number;
}

export interface PriorityScore {
  cardId: string;
  totalScore: number; // 0-100
  breakdown: {
    utilizationImpact: number; // 0-40 points
    aprWeight: number; // 0-25 points
    timeUrgency: number; // 0-20 points
    creditLimitWeight: number; // 0-15 points
  };
  reasoning: string[]; // Human-readable reasons
  rank: number; // 1, 2, 3, etc.
}

export interface AllocationStrategy {
  type: 'max_score' | 'min_interest' | 'utilization_focus' | 'equal_distribution' | 'custom';
  name: string;
  description: string;
  allocations: CardAllocation[];
  expectedImpact: ImpactSummary;
}

export interface CardAllocation {
  cardId: string;
  cardName: string;
  amount: number;
  newBalance: number;
  newUtilization: number;
  priorityRank: number;
  reasoning: string;
}

export interface ImpactSummary {
  totalPayment: number;
  overallUtilizationBefore: number;
  overallUtilizationAfter: number;
  estimatedScoreImpact: number;
  interestSaved: number;
  cardsUnder30Percent: number;
  cardsOptimal: number; // Under 10%
  percentOfOptimalAchieved: number;
}

// Helper function to calculate days until a statement date
function calculateDaysUntilDate(dayOfMonth: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let targetDate = new Date(currentYear, currentMonth, dayOfMonth);

  // If the statement date has passed this month, use next month
  if (dayOfMonth < currentDay) {
    targetDate = new Date(currentYear, currentMonth + 1, dayOfMonth);
  }

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// Calculate priority score for a single card
export function calculatePriorityScore(
  card: CardForRanking,
  allCards: CardForRanking[]
): PriorityScore {
  const score = {
    utilizationImpact: 0, // Max 40 points
    aprWeight: 0, // Max 25 points
    timeUrgency: 0, // Max 20 points
    creditLimitWeight: 0, // Max 15 points
  };

  const reasoning: string[] = [];

  // 1. Utilization Impact (40 points max)
  const utilization = (card.currentBalance / card.creditLimit) * 100;

  if (utilization > 90) {
    score.utilizationImpact = 40;
    reasoning.push('Critical: Over 90% utilization');
  } else if (utilization > 75) {
    score.utilizationImpact = 35;
    reasoning.push('Very high utilization (over 75%)');
  } else if (utilization > 50) {
    score.utilizationImpact = 30;
    reasoning.push('High utilization (over 50%)');
  } else if (utilization > 30) {
    score.utilizationImpact = 20;
    reasoning.push('Above optimal threshold (30%)');
  } else if (utilization > 10) {
    score.utilizationImpact = 10;
    reasoning.push('In acceptable range but not optimal');
  } else {
    score.utilizationImpact = 5;
    reasoning.push('Already in optimal range');
  }

  // Bonus points for cards just above key thresholds
  if (utilization > 30 && utilization <= 35) {
    score.utilizationImpact += 5;
    reasoning.push('Just above 30% threshold - easy win');
  }
  if (utilization > 50 && utilization <= 55) {
    score.utilizationImpact += 3;
    reasoning.push('Just above 50% - high impact opportunity');
  }

  // 2. APR Weight (25 points max)
  const maxAPR = Math.max(...allCards.map((c) => c.apr));
  const aprScore = (card.apr / maxAPR) * 25;
  score.aprWeight = Math.round(aprScore);

  if (card.apr > 25) {
    reasoning.push(`Very high APR (${card.apr.toFixed(2)}%)`);
  } else if (card.apr > 20) {
    reasoning.push(`High APR (${card.apr.toFixed(2)}%)`);
  } else if (card.apr > 15) {
    reasoning.push(`Moderate APR (${card.apr.toFixed(2)}%)`);
  }

  // 3. Time Urgency (20 points max)
  const daysToStatement = calculateDaysUntilDate(card.statementDate);

  if (daysToStatement <= 3) {
    score.timeUrgency = 20;
    reasoning.push(`Urgent: Statement closes in ${daysToStatement} days`);
  } else if (daysToStatement <= 7) {
    score.timeUrgency = 15;
    reasoning.push(`Statement closes soon (${daysToStatement} days)`);
  } else if (daysToStatement <= 14) {
    score.timeUrgency = 10;
    reasoning.push(`Statement closes in ${daysToStatement} days`);
  } else {
    score.timeUrgency = 5;
    reasoning.push('Statement date not urgent');
  }

  // 4. Credit Limit Weight (15 points max)
  const maxLimit = Math.max(...allCards.map((c) => c.creditLimit));
  const limitScore = (card.creditLimit / maxLimit) * 15;
  score.creditLimitWeight = Math.round(limitScore);

  if (card.creditLimit >= 10000) {
    reasoning.push(`Large credit limit ($${(card.creditLimit / 1000).toFixed(0)}k) - high score impact`);
  } else if (card.creditLimit >= 5000) {
    reasoning.push(`Medium credit limit ($${(card.creditLimit / 1000).toFixed(0)}k)`);
  }

  const totalScore =
    score.utilizationImpact +
    score.aprWeight +
    score.timeUrgency +
    score.creditLimitWeight;

  return {
    cardId: card.id,
    totalScore: Math.round(totalScore),
    breakdown: score,
    reasoning,
    rank: 0, // Will be set after sorting
  };
}

// Rank all cards by priority
export function rankCardsByPriority(cards: CardForRanking[]): PriorityScore[] {
  // Calculate scores for all cards
  const scores = cards.map((card) => calculatePriorityScore(card, cards));

  // Sort by total score (descending)
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return scores;
}

// Estimate score impact based on utilization change
function estimateScoreImpact(utilizationBefore: number, utilizationAfter: number): number {
  const improvement = utilizationBefore - utilizationAfter;
  let scoreChange = 0;

  // Threshold bonuses
  if (utilizationBefore > 90 && utilizationAfter <= 90) {
    scoreChange += 30;
  }
  if (utilizationBefore > 75 && utilizationAfter <= 75) {
    scoreChange += 20;
  }
  if (utilizationBefore > 50 && utilizationAfter <= 50) {
    scoreChange += 15;
  }
  if (utilizationBefore > 30 && utilizationAfter <= 30) {
    scoreChange += 25; // Big jump
  }
  if (utilizationBefore > 10 && utilizationAfter <= 10) {
    scoreChange += 15;
  }

  // Linear improvement within ranges
  scoreChange += improvement * 0.5;

  return Math.max(scoreChange, 0);
}

// Calculate impact summary
function calculateImpact(
  originalCards: CardForRanking[],
  allocations: CardAllocation[],
  totalBudget: number
): ImpactSummary {
  // Calculate overall utilization before
  const totalBalanceBefore = originalCards.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalLimit = originalCards.reduce((sum, c) => sum + c.creditLimit, 0);
  const utilizationBefore = (totalBalanceBefore / totalLimit) * 100;

  // Calculate overall utilization after
  const totalBalanceAfter = allocations.reduce((sum, a) => sum + a.newBalance, 0);
  const utilizationAfter = (totalBalanceAfter / totalLimit) * 100;

  // Count cards under thresholds
  const cardsUnder30After = allocations.filter((a) => a.newUtilization < 30).length;
  const cardsOptimalAfter = allocations.filter((a) => a.newUtilization < 10).length;

  // Estimate score impact
  const scoreImpact = estimateScoreImpact(utilizationBefore, utilizationAfter);

  // Calculate interest saved
  let interestSaved = 0;
  allocations.forEach((alloc) => {
    const card = originalCards.find((c) => c.id === alloc.cardId)!;
    const balanceReduction = card.currentBalance - alloc.newBalance;
    const monthlyRate = card.apr / 100 / 12;
    interestSaved += balanceReduction * monthlyRate;
  });

  // Calculate percent of optimal
  const optimalBalance = totalLimit * 0.05;
  const optimalPayment = totalBalanceBefore - optimalBalance;
  let percentOfOptimal = (totalBudget / optimalPayment) * 100;
  percentOfOptimal = Math.min(percentOfOptimal, 100);

  return {
    totalPayment: totalBudget,
    overallUtilizationBefore: Math.round(utilizationBefore * 10) / 10,
    overallUtilizationAfter: Math.round(utilizationAfter * 10) / 10,
    estimatedScoreImpact: Math.round(scoreImpact),
    interestSaved: Math.round(interestSaved * 100) / 100,
    cardsUnder30Percent: cardsUnder30After,
    cardsOptimal: cardsOptimalAfter,
    percentOfOptimalAchieved: Math.round(percentOfOptimal),
  };
}

// Strategy 1: Maximum Score Impact
export function allocateForMaxScoreImpact(
  cards: CardForRanking[],
  totalBudget: number
): AllocationStrategy {
  const minimumTotal = cards.reduce((sum, c) => sum + c.minimumPayment, 0);

  if (totalBudget < minimumTotal) {
    throw new Error(`Budget ($${totalBudget}) is below required minimums ($${minimumTotal})`);
  }

  let remainingBudget = totalBudget - minimumTotal;
  const allocations: CardAllocation[] = [];

  // Start with minimum payments
  cards.forEach((card) => {
    allocations.push({
      cardId: card.id,
      cardName: card.name,
      amount: card.minimumPayment,
      newBalance: card.currentBalance - card.minimumPayment,
      newUtilization: ((card.currentBalance - card.minimumPayment) / card.creditLimit) * 100,
      priorityRank: 0,
      reasoning: 'Minimum payment',
    });
  });

  // Rank cards by priority
  const priorities = rankCardsByPriority(cards);

  // Allocate remaining budget using greedy algorithm
  const thresholds = [90, 75, 50, 30, 10, 0];

  for (const threshold of thresholds) {
    if (remainingBudget <= 0) break;

    // Find cards above this threshold
    const cardsAboveThreshold = allocations.filter((alloc) => alloc.newUtilization > threshold);

    // Sort by priority score
    cardsAboveThreshold.sort((a, b) => {
      const scoreA = priorities.find((p) => p.cardId === a.cardId)!.totalScore;
      const scoreB = priorities.find((p) => p.cardId === b.cardId)!.totalScore;
      return scoreB - scoreA;
    });

    // Pay down cards to get them under threshold
    for (const allocation of cardsAboveThreshold) {
      if (remainingBudget <= 0) break;

      const card = cards.find((c) => c.id === allocation.cardId)!;
      const targetBalance = card.creditLimit * (threshold / 100);
      const additionalPayment = Math.min(
        allocation.newBalance - targetBalance,
        remainingBudget
      );

      if (additionalPayment > 0) {
        allocation.amount += additionalPayment;
        allocation.newBalance -= additionalPayment;
        allocation.newUtilization = (allocation.newBalance / card.creditLimit) * 100;
        remainingBudget -= additionalPayment;
        allocation.reasoning = `Get under ${threshold}% utilization`;
      }
    }
  }

  // If budget remains, distribute to highest priority cards
  if (remainingBudget > 0) {
    const sortedByPriority = [...allocations].sort((a, b) => {
      const scoreA = priorities.find((p) => p.cardId === a.cardId)!.totalScore;
      const scoreB = priorities.find((p) => p.cardId === b.cardId)!.totalScore;
      return scoreB - scoreA;
    });

    for (const allocation of sortedByPriority) {
      if (remainingBudget <= 0) break;

      const additionalPayment = Math.min(allocation.newBalance, remainingBudget);

      if (additionalPayment > 0) {
        allocation.amount += additionalPayment;
        allocation.newBalance -= additionalPayment;
        const card = cards.find((c) => c.id === allocation.cardId)!;
        allocation.newUtilization = (allocation.newBalance / card.creditLimit) * 100;
        remainingBudget -= additionalPayment;
        allocation.reasoning = 'Maximize score impact';
      }
    }
  }

  // Add priority ranks to allocations
  allocations.forEach((alloc) => {
    const priority = priorities.find((p) => p.cardId === alloc.cardId)!;
    alloc.priorityRank = priority.rank;
  });

  const impact = calculateImpact(cards, allocations, totalBudget);

  return {
    type: 'max_score',
    name: 'Maximum Score Impact',
    description: 'Optimized to improve your credit score the most',
    allocations,
    expectedImpact: impact,
  };
}

// Strategy 2: Minimum Interest (Avalanche)
export function allocateForMinInterest(
  cards: CardForRanking[],
  totalBudget: number
): AllocationStrategy {
  const minimumTotal = cards.reduce((sum, c) => sum + c.minimumPayment, 0);
  let remainingBudget = totalBudget - minimumTotal;

  const allocations: CardAllocation[] = cards.map((card) => ({
    cardId: card.id,
    cardName: card.name,
    amount: card.minimumPayment,
    newBalance: card.currentBalance - card.minimumPayment,
    newUtilization: ((card.currentBalance - card.minimumPayment) / card.creditLimit) * 100,
    priorityRank: 0,
    reasoning: 'Minimum payment',
  }));

  // Sort cards by APR (highest first)
  const cardsByAPR = [...cards].sort((a, b) => b.apr - a.apr);

  // Allocate remaining budget to highest APR cards
  for (const card of cardsByAPR) {
    if (remainingBudget <= 0) break;

    const allocation = allocations.find((a) => a.cardId === card.id)!;
    const additionalPayment = Math.min(allocation.newBalance, remainingBudget);

    allocation.amount += additionalPayment;
    allocation.newBalance -= additionalPayment;
    allocation.newUtilization = (allocation.newBalance / card.creditLimit) * 100;
    allocation.reasoning = `Highest APR (${card.apr.toFixed(2)}%) - saves most interest`;
    remainingBudget -= additionalPayment;
  }

  // Rank by APR
  allocations.forEach((alloc) => {
    const card = cards.find((c) => c.id === alloc.cardId)!;
    const rankByAPR = cardsByAPR.findIndex((c) => c.id === card.id) + 1;
    alloc.priorityRank = rankByAPR;
  });

  const impact = calculateImpact(cards, allocations, totalBudget);

  return {
    type: 'min_interest',
    name: 'Minimum Interest (Avalanche)',
    description: 'Save the most money on interest charges',
    allocations,
    expectedImpact: impact,
  };
}

// Strategy 3: Utilization Focus
export function allocateForUtilization(
  cards: CardForRanking[],
  totalBudget: number
): AllocationStrategy {
  const minimumTotal = cards.reduce((sum, c) => sum + c.minimumPayment, 0);
  let remainingBudget = totalBudget - minimumTotal;

  const allocations: CardAllocation[] = cards.map((card) => ({
    cardId: card.id,
    cardName: card.name,
    amount: card.minimumPayment,
    newBalance: card.currentBalance - card.minimumPayment,
    newUtilization: ((card.currentBalance - card.minimumPayment) / card.creditLimit) * 100,
    priorityRank: 0,
    reasoning: 'Minimum payment',
  }));

  // Sort by utilization (highest first)
  const cardsByUtilization = [...cards].sort((a, b) => {
    const utilA = a.currentBalance / a.creditLimit;
    const utilB = b.currentBalance / b.creditLimit;
    return utilB - utilA;
  });

  // Allocate to highest utilization cards
  for (const card of cardsByUtilization) {
    if (remainingBudget <= 0) break;

    const allocation = allocations.find((a) => a.cardId === card.id)!;
    const additionalPayment = Math.min(allocation.newBalance, remainingBudget);

    allocation.amount += additionalPayment;
    allocation.newBalance -= additionalPayment;
    allocation.newUtilization = (allocation.newBalance / card.creditLimit) * 100;

    const currentUtil = (card.currentBalance / card.creditLimit) * 100;
    allocation.reasoning = `Highest utilization (${currentUtil.toFixed(0)}%)`;
    remainingBudget -= additionalPayment;
  }

  allocations.forEach((alloc) => {
    const card = cards.find((c) => c.id === alloc.cardId)!;
    const rankByUtil = cardsByUtilization.findIndex((c) => c.id === card.id) + 1;
    alloc.priorityRank = rankByUtil;
  });

  const impact = calculateImpact(cards, allocations, totalBudget);

  return {
    type: 'utilization_focus',
    name: 'Utilization Focus',
    description: 'Target highest utilization cards first',
    allocations,
    expectedImpact: impact,
  };
}

// Strategy 4: Equal Distribution
export function allocateEqually(
  cards: CardForRanking[],
  totalBudget: number
): AllocationStrategy {
  const perCardBudget = totalBudget / cards.length;

  const allocations: CardAllocation[] = cards.map((card) => {
    const payment = Math.min(perCardBudget, card.currentBalance);
    const newBalance = card.currentBalance - payment;

    return {
      cardId: card.id,
      cardName: card.name,
      amount: payment,
      newBalance,
      newUtilization: (newBalance / card.creditLimit) * 100,
      priorityRank: 0,
      reasoning: 'Equal distribution',
    };
  });

  const impact = calculateImpact(cards, allocations, totalBudget);

  return {
    type: 'equal_distribution',
    name: 'Equal Distribution',
    description: 'Split budget equally across all cards',
    allocations,
    expectedImpact: impact,
  };
}
