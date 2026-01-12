// Priority-based payment allocation system

export interface CardForRanking {
  id: string;
  name: string;
  currentBalance: number;
  creditLimit: number;
  apr: number;
  minimumPayment: number;
  statementDate: number;
  dueDate: number;
}

export interface PriorityScore {
  cardId: string;
  totalScore: number;
  breakdown: {
    utilizationImpact: number;
    aprWeight: number;
    timeUrgency: number;
    creditLimitWeight: number;
  };
  reasoning: string[];
  rank: number;
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
  cardsOptimal: number;
  percentOfOptimalAchieved: number;
}

/**
 * Calculate card utilization percentage.
 */
function cardUtilization(card: CardForRanking): number {
  return (card.currentBalance / card.creditLimit) * 100;
}

/**
 * Create initial allocations with minimum payments for all cards.
 */
function createInitialAllocations(cards: CardForRanking[]): CardAllocation[] {
  return cards.map(card => ({
    cardId: card.id,
    cardName: card.name,
    amount: card.minimumPayment,
    newBalance: card.currentBalance - card.minimumPayment,
    newUtilization: ((card.currentBalance - card.minimumPayment) / card.creditLimit) * 100,
    priorityRank: 0,
    reasoning: 'Minimum payment',
  }));
}

// Helper function to calculate days until a statement date
function calculateDaysUntilDate(dayOfMonth: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  let targetDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);

  if (dayOfMonth < currentDay) {
    targetDate = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
  }

  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Utilization thresholds and their scores
const UTILIZATION_THRESHOLDS = [
  { threshold: 90, score: 40, reason: 'Critical: Over 90% utilization' },
  { threshold: 75, score: 35, reason: 'Very high utilization (over 75%)' },
  { threshold: 50, score: 30, reason: 'High utilization (over 50%)' },
  { threshold: 30, score: 20, reason: 'Above optimal threshold (30%)' },
  { threshold: 10, score: 10, reason: 'In acceptable range but not optimal' },
  { threshold: 0, score: 5, reason: 'Already in optimal range' },
];

// Time urgency thresholds
const TIME_URGENCY_THRESHOLDS = [
  { days: 3, score: 20, urgent: true },
  { days: 7, score: 15, urgent: false },
  { days: 14, score: 10, urgent: false },
  { days: Infinity, score: 5, urgent: false },
];

/**
 * Calculate priority score for a single card.
 */
export function calculatePriorityScore(
  card: CardForRanking,
  allCards: CardForRanking[]
): PriorityScore {
  const reasoning: string[] = [];
  const utilization = cardUtilization(card);

  // 1. Utilization Impact (40 points max)
  const utilizationEntry = UTILIZATION_THRESHOLDS.find(t => utilization > t.threshold) || UTILIZATION_THRESHOLDS[UTILIZATION_THRESHOLDS.length - 1];
  let utilizationImpact = utilizationEntry.score;
  reasoning.push(utilizationEntry.reason);

  // Bonus for cards just above key thresholds
  if (utilization > 30 && utilization <= 35) {
    utilizationImpact += 5;
    reasoning.push('Just above 30% threshold - easy win');
  }
  if (utilization > 50 && utilization <= 55) {
    utilizationImpact += 3;
    reasoning.push('Just above 50% - high impact opportunity');
  }

  // 2. APR Weight (25 points max)
  const maxAPR = Math.max(...allCards.map(c => c.apr));
  const aprWeight = Math.round((card.apr / maxAPR) * 25);

  if (card.apr > 25) {
    reasoning.push(`Very high APR (${card.apr.toFixed(2)}%)`);
  } else if (card.apr > 20) {
    reasoning.push(`High APR (${card.apr.toFixed(2)}%)`);
  } else if (card.apr > 15) {
    reasoning.push(`Moderate APR (${card.apr.toFixed(2)}%)`);
  }

  // 3. Time Urgency (20 points max)
  const daysToStatement = calculateDaysUntilDate(card.statementDate);
  const urgencyEntry = TIME_URGENCY_THRESHOLDS.find(t => daysToStatement <= t.days)!;
  const timeUrgency = urgencyEntry.score;

  if (urgencyEntry.urgent) {
    reasoning.push(`Urgent: Statement closes in ${daysToStatement} days`);
  } else if (daysToStatement <= 14) {
    reasoning.push(`Statement closes ${daysToStatement <= 7 ? 'soon' : ''} (${daysToStatement} days)`);
  } else {
    reasoning.push('Statement date not urgent');
  }

  // 4. Credit Limit Weight (15 points max)
  const maxLimit = Math.max(...allCards.map(c => c.creditLimit));
  const creditLimitWeight = Math.round((card.creditLimit / maxLimit) * 15);

  if (card.creditLimit >= 10000) {
    reasoning.push(`Large credit limit ($${(card.creditLimit / 1000).toFixed(0)}k) - high score impact`);
  } else if (card.creditLimit >= 5000) {
    reasoning.push(`Medium credit limit ($${(card.creditLimit / 1000).toFixed(0)}k)`);
  }

  const totalScore = utilizationImpact + aprWeight + timeUrgency + creditLimitWeight;

  return {
    cardId: card.id,
    totalScore: Math.round(totalScore),
    breakdown: { utilizationImpact, aprWeight, timeUrgency, creditLimitWeight },
    reasoning,
    rank: 0,
  };
}

// Rank all cards by priority
export function rankCardsByPriority(cards: CardForRanking[]): PriorityScore[] {
  const scores = cards.map(card => calculatePriorityScore(card, cards));
  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });
  return scores;
}

// Score impact thresholds
const SCORE_IMPACT_THRESHOLDS = [
  { threshold: 90, bonus: 30 },
  { threshold: 75, bonus: 20 },
  { threshold: 50, bonus: 15 },
  { threshold: 30, bonus: 25 },
  { threshold: 10, bonus: 15 },
];

// Estimate score impact based on utilization change
function estimateScoreImpact(utilizationBefore: number, utilizationAfter: number): number {
  let scoreChange = 0;

  // Add bonus for crossing key thresholds
  for (const { threshold, bonus } of SCORE_IMPACT_THRESHOLDS) {
    if (utilizationBefore > threshold && utilizationAfter <= threshold) {
      scoreChange += bonus;
    }
  }

  // Linear improvement component
  scoreChange += (utilizationBefore - utilizationAfter) * 0.5;

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

/**
 * Validate budget and return remaining after minimum payments.
 */
function validateBudget(cards: CardForRanking[], totalBudget: number): number {
  const minimumTotal = cards.reduce((sum, c) => sum + c.minimumPayment, 0);
  if (totalBudget < minimumTotal) {
    throw new Error(`Budget ($${totalBudget}) is below required minimums ($${minimumTotal})`);
  }
  return totalBudget - minimumTotal;
}

/**
 * Apply additional payment to an allocation.
 */
function applyPayment(
  allocation: CardAllocation,
  additionalPayment: number,
  card: CardForRanking,
  reasoning: string
): number {
  const payment = Math.min(additionalPayment, allocation.newBalance);
  if (payment > 0) {
    allocation.amount += payment;
    allocation.newBalance -= payment;
    allocation.newUtilization = (allocation.newBalance / card.creditLimit) * 100;
    allocation.reasoning = reasoning;
  }
  return payment;
}

// Strategy 1: Maximum Score Impact
export function allocateForMaxScoreImpact(
  cards: CardForRanking[],
  totalBudget: number
): AllocationStrategy {
  let remainingBudget = validateBudget(cards, totalBudget);
  const allocations = createInitialAllocations(cards);
  const priorities = rankCardsByPriority(cards);

  // Helper to sort allocations by priority score
  const sortByPriority = (allocs: CardAllocation[]) => {
    return [...allocs].sort((a, b) => {
      const scoreA = priorities.find(p => p.cardId === a.cardId)!.totalScore;
      const scoreB = priorities.find(p => p.cardId === b.cardId)!.totalScore;
      return scoreB - scoreA;
    });
  };

  // Allocate remaining budget using greedy algorithm
  const thresholds = [90, 75, 50, 30, 10, 0];

  for (const threshold of thresholds) {
    if (remainingBudget <= 0) break;

    const cardsAboveThreshold = sortByPriority(
      allocations.filter(alloc => alloc.newUtilization > threshold)
    );

    for (const allocation of cardsAboveThreshold) {
      if (remainingBudget <= 0) break;

      const card = cards.find(c => c.id === allocation.cardId)!;
      const targetBalance = card.creditLimit * (threshold / 100);
      const payment = applyPayment(
        allocation,
        allocation.newBalance - targetBalance,
        card,
        `Get under ${threshold}% utilization`
      );
      remainingBudget -= payment;
    }
  }

  // Distribute remaining budget to highest priority cards
  if (remainingBudget > 0) {
    for (const allocation of sortByPriority(allocations)) {
      if (remainingBudget <= 0) break;

      const card = cards.find(c => c.id === allocation.cardId)!;
      remainingBudget -= applyPayment(allocation, remainingBudget, card, 'Maximize score impact');
    }
  }

  // Add priority ranks
  allocations.forEach(alloc => {
    alloc.priorityRank = priorities.find(p => p.cardId === alloc.cardId)!.rank;
  });

  return {
    type: 'max_score',
    name: 'Maximum Score Impact',
    description: 'Optimized to improve your credit score the most',
    allocations,
    expectedImpact: calculateImpact(cards, allocations, totalBudget),
  };
}

// Strategy 2: Minimum Interest (Avalanche)
export function allocateForMinInterest(
  cards: CardForRanking[],
  totalBudget: number
): AllocationStrategy {
  let remainingBudget = validateBudget(cards, totalBudget);
  const allocations = createInitialAllocations(cards);
  const cardsByAPR = [...cards].sort((a, b) => b.apr - a.apr);

  for (const card of cardsByAPR) {
    if (remainingBudget <= 0) break;

    const allocation = allocations.find(a => a.cardId === card.id)!;
    remainingBudget -= applyPayment(
      allocation,
      remainingBudget,
      card,
      `Highest APR (${card.apr.toFixed(2)}%) - saves most interest`
    );
  }

  // Assign ranks by APR
  allocations.forEach(alloc => {
    alloc.priorityRank = cardsByAPR.findIndex(c => c.id === alloc.cardId) + 1;
  });

  return {
    type: 'min_interest',
    name: 'Minimum Interest (Avalanche)',
    description: 'Save the most money on interest charges',
    allocations,
    expectedImpact: calculateImpact(cards, allocations, totalBudget),
  };
}

// Strategy 3: Utilization Focus
export function allocateForUtilization(
  cards: CardForRanking[],
  totalBudget: number
): AllocationStrategy {
  let remainingBudget = validateBudget(cards, totalBudget);
  const allocations = createInitialAllocations(cards);
  const cardsByUtilization = [...cards].sort((a, b) => cardUtilization(b) - cardUtilization(a));

  for (const card of cardsByUtilization) {
    if (remainingBudget <= 0) break;

    const allocation = allocations.find(a => a.cardId === card.id)!;
    remainingBudget -= applyPayment(
      allocation,
      remainingBudget,
      card,
      `Highest utilization (${cardUtilization(card).toFixed(0)}%)`
    );
  }

  // Assign ranks by utilization
  allocations.forEach(alloc => {
    alloc.priorityRank = cardsByUtilization.findIndex(c => c.id === alloc.cardId) + 1;
  });

  return {
    type: 'utilization_focus',
    name: 'Utilization Focus',
    description: 'Target highest utilization cards first',
    allocations,
    expectedImpact: calculateImpact(cards, allocations, totalBudget),
  };
}

// Strategy 4: Equal Distribution
export function allocateEqually(
  cards: CardForRanking[],
  totalBudget: number
): AllocationStrategy {
  const perCardBudget = totalBudget / cards.length;

  const allocations: CardAllocation[] = cards.map(card => {
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

  return {
    type: 'equal_distribution',
    name: 'Equal Distribution',
    description: 'Split budget equally across all cards',
    allocations,
    expectedImpact: calculateImpact(cards, allocations, totalBudget),
  };
}
