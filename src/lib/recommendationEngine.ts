import {
  RecommendationPreferences,
  RecommendableCard,
  CardRecommendation,
  RecommendationResult,
  SpendingStrategy,
  SpendingCategory,
  RecommendationTimelineEvent,
  CreditScoreRange
} from '@/types';
import {
  recommendableCards,
  getBestRateForCategory,
  formatCategoryName
} from '@/data/recommendable-cards';
import { addDays, addMonths } from 'date-fns';

// ============================================
// CONSTANTS
// ============================================

const CREDIT_SCORE_ORDER: CreditScoreRange[] = ['building', 'fair', 'good', 'excellent'];

// Default monthly spending assumptions if not provided
const DEFAULT_MONTHLY_SPENDING: Record<SpendingCategory, number> = {
  'dining': 300,
  'groceries': 400,
  'gas': 150,
  'travel': 200,
  'online-shopping': 250
};

// Days to wait between card applications (for credit score recovery)
const APPLICATION_SPACING_DAYS = 90;

// ============================================
// ELIGIBILITY CHECKS
// ============================================

/**
 * Check if user's credit score meets card's minimum requirement
 */
function meetsMinCreditScore(cardMin: CreditScoreRange, userScore: CreditScoreRange): boolean {
  return CREDIT_SCORE_ORDER.indexOf(userScore) >= CREDIT_SCORE_ORDER.indexOf(cardMin);
}

// ============================================
// SCORING FUNCTIONS
// ============================================

/**
 * Calculate match score for a card against user preferences
 * Returns a score from 0-100
 *
 * Scoring breakdown:
 * - Credit score eligibility: 20 points (pass/fail)
 * - Category match: 40 points (based on reward rates in user's categories)
 * - Reward type match: 15 points (cashback vs points preference)
 * - Simplicity match: 15 points (tier alignment with user preference)
 * - Fee consideration: 10 points (no fee = full points)
 */
export function calculateMatchScore(
  card: RecommendableCard,
  preferences: RecommendationPreferences
): number {
  let score = 0;

  // 1. Credit Score Eligibility (20 points) - Must pass to continue
  if (!meetsMinCreditScore(card.minCreditScore, preferences.creditScoreRange)) {
    return 0; // Disqualified
  }
  score += 20;

  // 2. Category Match (40 points max)
  const categoryPoints = 40 / Math.max(preferences.topCategories.length, 1);
  for (const category of preferences.topCategories) {
    const rewardRate = getBestRateForCategory(card, category);
    // Scale: 5%+ = full points, 1% = 20% of points
    const rateMultiplier = Math.min(rewardRate / 5, 1);
    score += categoryPoints * rateMultiplier;
  }

  // 3. Reward Type Match (15 points)
  const cardRewardType = card.rewards[0]?.rewardType;
  if (preferences.rewardPreference === 'either') {
    score += 15;
  } else if (preferences.rewardPreference === cardRewardType) {
    score += 15;
  } else {
    score += 5; // Partial credit for mismatch
  }

  // 4. Simplicity Match (15 points)
  if (preferences.simplicityPreference === 'fewer-cards') {
    // Prefer basic/flat rate cards for simplicity seekers
    if (card.tier === 'basic') score += 15;
    else if (card.tier === 'moderate') score += 10;
    else score += 5;
  } else {
    // Prefer aggressive/specialized cards for reward maximizers
    if (card.tier === 'aggressive') score += 15;
    else if (card.tier === 'moderate') score += 12;
    else score += 8;
  }

  // 5. Annual Fee Consideration (10 points)
  if (card.annualFee === 0) {
    score += 10;
  } else if (card.annualFee <= 100) {
    score += 5;
  } else if (card.annualFee <= 200) {
    score += 2;
  }
  // High-fee cards can still score well if other factors are strong

  return Math.round(score);
}

/**
 * Calculate estimated annual reward based on user spending
 */
export function calculateAnnualReward(
  card: RecommendableCard,
  monthlySpending: { [key in SpendingCategory]?: number } = {}
): number {
  let annualReward = 0;

  // Use default spending for categories not specified
  const spending = { ...DEFAULT_MONTHLY_SPENDING, ...monthlySpending };

  for (const [category, monthly] of Object.entries(spending) as [SpendingCategory, number][]) {
    const rewardRate = getBestRateForCategory(card, category);
    let yearlySpend = monthly * 12;

    // Find the specific reward to check for caps
    const reward = card.rewards.find(r => r.category === category) ||
                   card.rewards.find(r => r.category === 'all');

    // Apply caps if they exist
    if (reward?.cap) {
      yearlySpend = Math.min(yearlySpend, reward.cap);
    }

    // Calculate reward value
    let rewardValue = yearlySpend * (rewardRate / 100);

    // Convert points to dollar value if applicable
    if (reward?.rewardType === 'points' && reward?.pointValue) {
      rewardValue = rewardValue * (reward.pointValue / 100);
    }

    annualReward += rewardValue;
  }

  return Math.round(annualReward);
}

// ============================================
// REASONING GENERATION
// ============================================

/**
 * Generate human-readable reasoning for why a card was recommended
 */
function generateReasoning(
  card: RecommendableCard,
  preferences: RecommendationPreferences
): string[] {
  const reasons: string[] = [];

  // Category-specific reasons
  for (const category of preferences.topCategories) {
    const reward = card.rewards.find(r => r.category === category);
    if (reward && reward.rewardRate >= 3) {
      const typeLabel = reward.rewardType === 'points' ? 'points' : '%';
      reasons.push(`${reward.rewardRate}${typeLabel === '%' ? '%' : 'x'} ${reward.rewardType} on ${formatCategoryName(category)}`);
    }
  }

  // Flat-rate cards
  const allReward = card.rewards.find(r => r.category === 'all');
  if (allReward && allReward.rewardRate >= 1.5 && reasons.length === 0) {
    reasons.push(`${allReward.rewardRate}% on all purchases`);
  }

  // No annual fee
  if (card.annualFee === 0) {
    reasons.push('No annual fee');
  }

  // Signup bonus
  if (card.signupBonus) {
    const bonusText = card.rewards[0]?.rewardType === 'points'
      ? `${card.signupBonus.amount.toLocaleString()} bonus points`
      : `$${card.signupBonus.amount} signup bonus`;
    reasons.push(bonusText);
  }

  // No foreign transaction fees
  if (!card.foreignTransactionFee) {
    reasons.push('No foreign transaction fees');
  }

  // Tier-specific benefits
  if (card.tier === 'basic' && preferences.simplicityPreference === 'fewer-cards') {
    reasons.push('Simple flat-rate rewards');
  }

  return reasons.slice(0, 4); // Max 4 reasons for display
}

/**
 * Determine the primary use case for a card
 */
function determinePrimaryUse(
  card: RecommendableCard,
  userCategories: SpendingCategory[]
): SpendingCategory | 'all' {
  // Find the highest-rewarding category that matches user preferences
  for (const category of userCategories) {
    const reward = card.rewards.find(r => r.category === category && r.rewardRate >= 3);
    if (reward) return category;
  }

  // Check for all-around card
  const allReward = card.rewards.find(r => r.category === 'all');
  if (allReward && allReward.rewardRate >= 1.5) return 'all';

  // Default to highest reward category
  const sortedRewards = [...card.rewards].sort((a, b) => b.rewardRate - a.rewardRate);
  const best = sortedRewards[0];
  if (best && best.category !== 'all' && best.category !== 'rotating') {
    return best.category as SpendingCategory;
  }

  return 'all';
}

// ============================================
// CARD SELECTION
// ============================================

interface ScoredCard {
  card: RecommendableCard;
  matchScore: number;
  estimatedReward: number;
}

/**
 * Select an optimal set of complementary cards
 * Ensures cards cover different categories without too much overlap
 */
function selectOptimalCardSet(
  scoredCards: ScoredCard[],
  preferences: RecommendationPreferences,
  maxCards: number
): ScoredCard[] {
  const selected: ScoredCard[] = [];
  const coveredCategories = new Set<string>();

  for (const sc of scoredCards) {
    if (selected.length >= maxCards) break;

    // Find which categories this card excels in (3%+ rate)
    const cardCategories = sc.card.rewards
      .filter(r => r.category !== 'all' && r.category !== 'rotating' && r.rewardRate >= 3)
      .map(r => r.category);

    // Check if this card adds value (covers new categories)
    const addsNewCategory = cardCategories.some(c => !coveredCategories.has(c));

    // Or if it's a strong all-rounder
    const isStrongAllRounder = sc.card.rewards.some(r => r.category === 'all' && r.rewardRate >= 1.5);

    // Always add the first card, then be selective
    if (selected.length === 0 || addsNewCategory || (isStrongAllRounder && selected.length < 2)) {
      selected.push(sc);
      cardCategories.forEach(c => coveredCategories.add(c));
    }
  }

  return selected;
}

// ============================================
// SPENDING STRATEGY
// ============================================

/**
 * Generate a spending strategy showing which card to use for each category
 */
function generateSpendingStrategy(
  recommendations: CardRecommendation[],
  categories: SpendingCategory[]
): SpendingStrategy[] {
  const strategy: SpendingStrategy[] = [];

  for (const category of categories) {
    let bestCard = recommendations[0];
    let bestRate = 0;

    // Find the best card for this category among recommendations
    for (const rec of recommendations) {
      const rate = getBestRateForCategory(rec.card, category);
      if (rate > bestRate) {
        bestRate = rate;
        bestCard = rec;
      }
    }

    strategy.push({
      category,
      recommendedCard: bestCard.card.name,
      rewardRate: bestRate,
      reasoning: `${bestRate}% ${bestCard.card.rewards[0]?.rewardType || 'back'} on ${formatCategoryName(category)}`
    });
  }

  return strategy;
}

// ============================================
// SCORE PROJECTION
// ============================================

/**
 * Calculate projected credit score impact
 * Short-term: Hard pulls and new accounts lower score
 * Long-term: More available credit = lower utilization = higher score
 */
function calculateScoreProjection(cardCount: number): { shortTerm: number; longTerm: number } {
  // Each hard pull: -5 to -10 points
  // New accounts lower average age: -5 to -10 points total
  const shortTermImpact = -(cardCount * 7 + 5);

  // Long term benefits (6+ months):
  // More available credit reduces utilization
  // Each card adds ~$5-10k in available credit typically
  const longTermImpact = Math.min(50, cardCount * 12);

  return {
    shortTerm: shortTermImpact,
    longTerm: longTermImpact
  };
}

// ============================================
// MAIN RECOMMENDATION FUNCTION
// ============================================

/**
 * Generate card recommendations based on user preferences
 */
export function generateRecommendations(
  preferences: RecommendationPreferences
): RecommendationResult {
  // 1. Filter eligible cards by credit score
  const eligibleCards = recommendableCards.filter(card =>
    meetsMinCreditScore(card.minCreditScore, preferences.creditScoreRange)
  );

  // 2. Score all eligible cards
  const scoredCards: ScoredCard[] = eligibleCards
    .map(card => ({
      card,
      matchScore: calculateMatchScore(card, preferences),
      estimatedReward: calculateAnnualReward(card, preferences.monthlySpending)
    }))
    .filter(sc => sc.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  // 3. Select optimal card set based on simplicity preference
  const maxCards = preferences.simplicityPreference === 'fewer-cards' ? 2 : 4;
  const selectedCards = selectOptimalCardSet(scoredCards, preferences, maxCards);

  // 4. Build recommendation objects with application order
  const recommendations: CardRecommendation[] = selectedCards.map((sc, index) => ({
    card: sc.card,
    matchScore: sc.matchScore,
    primaryUse: determinePrimaryUse(sc.card, preferences.topCategories),
    reasoning: generateReasoning(sc.card, preferences),
    estimatedAnnualReward: sc.estimatedReward,
    applicationOrder: index + 1,
    waitDays: index * APPLICATION_SPACING_DAYS
  }));

  // 5. Generate spending strategy
  const spendingStrategy = generateSpendingStrategy(recommendations, preferences.topCategories);

  // 6. Calculate totals
  const totalEstimatedAnnualReward = recommendations.reduce(
    (sum, r) => sum + r.estimatedAnnualReward,
    0
  );
  const totalAnnualFees = recommendations.reduce(
    (sum, r) => sum + r.card.annualFee,
    0
  );

  // 7. Project score impact
  const projectedScoreImpact = calculateScoreProjection(recommendations.length);

  return {
    recommendations,
    spendingStrategy,
    projectedScoreImpact,
    totalEstimatedAnnualReward,
    totalAnnualFees,
    netAnnualBenefit: totalEstimatedAnnualReward - totalAnnualFees
  };
}

// ============================================
// TIMELINE GENERATION
// ============================================

/**
 * Generate timeline events for visualization
 */
export function generateRecommendationTimeline(
  recommendations: CardRecommendation[]
): RecommendationTimelineEvent[] {
  const events: RecommendationTimelineEvent[] = [];
  const today = new Date();

  // Add application events for each card
  for (const rec of recommendations) {
    const applicationDate = addDays(today, rec.waitDays);

    // Application event
    events.push({
      date: applicationDate,
      type: 'application',
      cardName: rec.card.name,
      description: rec.waitDays === 0
        ? `Apply for ${rec.card.name}`
        : `Apply for ${rec.card.name} (after score recovers)`,
      icon: 'card'
    });

    // Bonus deadline if applicable
    if (rec.card.signupBonus) {
      const bonusDeadline = addDays(applicationDate, rec.card.signupBonus.timeframeDays);
      const bonusAmount = rec.card.rewards[0]?.rewardType === 'points'
        ? `${rec.card.signupBonus.amount.toLocaleString()} points`
        : `$${rec.card.signupBonus.amount}`;

      events.push({
        date: bonusDeadline,
        type: 'bonus-deadline',
        cardName: rec.card.name,
        description: `Meet $${rec.card.signupBonus.spendRequirement.toLocaleString()} spend for ${bonusAmount} bonus`,
        icon: 'calendar'
      });
    }
  }

  // Add strategy start milestone
  events.push({
    date: addDays(today, 14),
    type: 'strategy-start',
    description: 'Start using optimal spending strategy with first card',
    icon: 'wallet'
  });

  // Add score recovery milestone
  events.push({
    date: addMonths(today, 6),
    type: 'score-recovery',
    description: 'Expected credit score recovery from new accounts',
    icon: 'trending-up'
  });

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}
