import {
  RecommendationPreferences,
  RecommendableCard,
  CardRecommendation,
  RecommendationResult,
  SpendingStrategy,
  SpendingCategory,
  RecommendationTimelineEvent,
  CreditScoreRange,
  RewardTier,
  CreditCard,
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
  'online-shopping': 250,
  'streaming': 50,
  'utilities': 200,
  'transit': 100,
  'phone': 100,
  'entertainment': 100,
  'drugstores': 50
};

// Days to wait between card applications (for credit score recovery)
const APPLICATION_SPACING_DAYS = 90;

// ============================================
// CAP HANDLING
// ============================================

/**
 * Calculate capped yearly spend based on the cap period.
 * Different cards have different cap reset periods (monthly, quarterly, annual).
 */
function calculateCappedYearlySpend(
  yearlySpend: number,
  cap: number,
  capPeriod: 'monthly' | 'quarterly' | 'annual' = 'annual'
): number {
  switch (capPeriod) {
    case 'monthly':
      // Cap resets each month, so yearly cap = cap * 12
      return Math.min(yearlySpend, cap * 12);
    case 'quarterly':
      // Cap resets each quarter, so yearly cap = cap * 4
      return Math.min(yearlySpend, cap * 4);
    case 'annual':
    default:
      // Cap applies to the full year
      return Math.min(yearlySpend, cap);
  }
}

// ============================================
// CURRENT CARD MATCHING
// ============================================

/**
 * Try to match a user's card (by nickname) to a known RecommendableCard.
 * Uses fuzzy matching to find the best match.
 */
function matchUserCardToKnownCard(userCard: CreditCard): RecommendableCard | null {
  const nickname = userCard.nickname.toLowerCase();

  // Try exact match first
  let bestMatch: RecommendableCard | null = null;
  let bestScore = 0;

  for (const knownCard of recommendableCards) {
    const knownName = knownCard.name.toLowerCase();
    const knownIssuer = knownCard.issuer.toLowerCase();

    // Check for various match patterns
    let score = 0;

    // Exact name match
    if (nickname === knownName) {
      score = 100;
    }
    // Name contains full known name
    else if (nickname.includes(knownName) || knownName.includes(nickname)) {
      score = 80;
    }
    // Match key parts (issuer + type)
    else {
      // Check if issuer is in nickname
      if (nickname.includes(knownIssuer)) {
        score += 30;
      }

      // Check for card type keywords
      const keywords = ['sapphire', 'freedom', 'gold', 'platinum', 'venture', 'savor',
                       'double cash', 'active cash', 'custom cash', 'autograph', 'quicksilver'];
      for (const keyword of keywords) {
        if (nickname.includes(keyword) && knownName.includes(keyword)) {
          score += 40;
          break;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = knownCard;
    }
  }

  // Only return if we have a reasonable confidence match
  return bestScore >= 50 ? bestMatch : null;
}

/**
 * Match all user cards to known cards
 */
export function matchCurrentCards(userCards: CreditCard[]): Map<string, RecommendableCard> {
  const matches = new Map<string, RecommendableCard>();

  for (const userCard of userCards) {
    const match = matchUserCardToKnownCard(userCard);
    if (match) {
      matches.set(userCard.id, match);
    }
  }

  return matches;
}

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

// Tier score mappings
const SIMPLICITY_TIER_SCORES: Record<string, Record<RewardTier, number>> = {
  'fewer-cards': { basic: 15, moderate: 10, aggressive: 5 },
  'more-rewards': { aggressive: 15, moderate: 12, basic: 8 },
};

/**
 * Calculate fee value score based on net benefit (rewards - fee).
 * Returns 0-15 points. Higher net benefit = higher score.
 *
 * This is purely money-driven: a $325 card earning $600 (net $275)
 * scores higher than a $0 card earning $200 (net $200).
 */
function calculateFeeValueScore(
  card: RecommendableCard,
  monthlySpending: { [key in SpendingCategory]?: number }
): number {
  const annualReward = calculateAnnualReward(card, monthlySpending);
  const annualFee = card.annualFee;
  const netBenefit = annualReward - annualFee;

  // Pure net benefit scoring - the card that makes you more money wins
  if (netBenefit >= 300) return 15;  // Excellent value
  if (netBenefit >= 200) return 13;  // Great value
  if (netBenefit >= 150) return 11;  // Very good
  if (netBenefit >= 100) return 9;   // Good value
  if (netBenefit >= 50) return 7;    // Decent value
  if (netBenefit >= 0) return 5;     // Breaks even
  if (netBenefit >= -50) return 3;   // Slight loss
  return 1;                           // Poor value - fee exceeds rewards
}

/**
 * Calculate penalty for spending caps that limit heavy spenders.
 * Returns 0-10 penalty points to subtract from score.
 */
function calculateCapPenalty(
  card: RecommendableCard,
  monthlySpending: { [key in SpendingCategory]?: number }
): number {
  let penalty = 0;
  const spending = { ...DEFAULT_MONTHLY_SPENDING, ...monthlySpending };

  for (const reward of card.rewards) {
    if (!reward.cap || reward.category === 'all' || reward.category === 'rotating') continue;

    const category = reward.category as SpendingCategory;
    const monthlyInCategory = spending[category] || 0;
    const yearlyInCategory = monthlyInCategory * 12;

    // Calculate the effective yearly cap using cap period
    const yearlyCap = calculateCappedYearlySpend(
      Infinity,
      reward.cap,
      reward.capPeriod || 'annual'
    );

    // If user spends significantly more than cap, penalize
    if (yearlyInCategory > yearlyCap * 1.5) {
      // Exceeds cap by 50%+ : significant penalty
      penalty += 5;
    } else if (yearlyInCategory > yearlyCap) {
      // Exceeds cap: minor penalty
      penalty += 2;
    }
  }

  return Math.min(penalty, 10); // Max 10 point penalty
}

/**
 * Calculate match score for a card against user preferences.
 * Returns a score from 0-100.
 *
 * Score breakdown:
 * - Credit Score Eligibility: 20 pts (must pass)
 * - Category Match: 35 pts max
 * - Reward Type Match: 10 pts
 * - Simplicity Match: 10 pts
 * - Fee Value: 15 pts
 * - Signup Bonus: 10 pts
 * Total: 100 pts
 */
export function calculateMatchScore(
  card: RecommendableCard,
  preferences: RecommendationPreferences
): number {
  // Credit Score Eligibility (20 points) - Must pass to continue
  if (!meetsMinCreditScore(card.minCreditScore, preferences.creditScoreRange)) {
    return 0;
  }

  let score = 20;

  // Category Match (35 points max) - rebalanced from 40 to make room for signup bonus
  const categoryPoints = 35 / Math.max(preferences.topCategories.length, 1);

  // For isAutoHighestCategory cards (like Citi Custom Cash), only count the BEST category
  // since the card only gives bonus rate on ONE category at a time
  if (card.isAutoHighestCategory) {
    // Find the best rate among user's selected categories
    let bestRate = 0;
    for (const category of preferences.topCategories) {
      const rate = getBestRateForCategory(card, category);
      if (rate > bestRate) bestRate = rate;
    }
    // Only give points for ONE category at the best rate, others at base rate
    const baseRate = card.rewards.find(r => r.category === 'all')?.rewardRate || 1;
    score += categoryPoints * Math.min(bestRate / 6, 1); // Best category (6% max for cards like Amex BCP)
    // Remaining categories get base rate scoring
    for (let i = 1; i < preferences.topCategories.length; i++) {
      score += categoryPoints * Math.min(baseRate / 6, 1);
    }
  } else {
    // Normal cards: score each category independently
    for (const category of preferences.topCategories) {
      const rewardRate = getBestRateForCategory(card, category);
      // Use 6 as divisor to give credit to 6% cards like Amex Blue Cash Preferred
      score += categoryPoints * Math.min(rewardRate / 6, 1);
    }
  }

  // Reward Type Match (10 points) - rebalanced from 15
  const cardRewardType = card.rewards[0]?.rewardType;
  if (preferences.rewardPreference === 'either' || preferences.rewardPreference === cardRewardType) {
    score += 10;
  } else {
    score += 3;
  }

  // Simplicity Match (10 points) - rebalanced from 15
  // Scale down SIMPLICITY_TIER_SCORES which originally gave 5-15 points
  const simplicityRawScore = SIMPLICITY_TIER_SCORES[preferences.simplicityPreference][card.tier];
  score += Math.round(simplicityRawScore * (10 / 15)); // Scale to new 10-point max

  // Fee Value Score (15 points) - Always use net benefit calculation
  // Use defaults if no spending data provided for consistent scoring
  const spendingData = preferences.monthlySpending || {};
  score += calculateFeeValueScore(card, spendingData);

  // Signup Bonus Score (10 points) - NEW: High-value bonuses significantly impact first-year value
  score += calculateSignupBonusScore(card, spendingData);

  // Cap Penalty (0 to -10 points) - Heavy spenders lose value on capped cards
  score -= calculateCapPenalty(card, spendingData);

  return Math.round(Math.max(score, 0)); // Ensure score doesn't go negative
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
  const spendingEntries = Object.entries(spending) as [SpendingCategory, number][];

  // For isAutoHighestCategory cards (like Citi Custom Cash), only ONE category
  // gets the bonus rate - whichever has the highest spending
  if (card.isAutoHighestCategory) {
    // Find the category with highest spending that has a bonus rate
    let bestCategory: SpendingCategory | null = null;
    let bestSpend = 0;

    for (const [category, monthly] of spendingEntries) {
      const reward = card.rewards.find(r => r.category === category);
      if (reward && reward.rewardRate > 1 && monthly > bestSpend) {
        bestSpend = monthly;
        bestCategory = category;
      }
    }

    // Calculate rewards: best category gets bonus rate, others get base rate
    const baseReward = card.rewards.find(r => r.category === 'all');
    const baseRate = baseReward?.rewardRate || 1;

    for (const [category, monthly] of spendingEntries) {
      let yearlySpend = monthly * 12;
      const reward = card.rewards.find(r => r.category === category);

      // Only the best-spending category gets the bonus rate
      const rewardRate = (category === bestCategory && reward)
        ? reward.rewardRate
        : baseRate;

      // Apply cap if this is the bonus category (use capPeriod for correct calculation)
      if (category === bestCategory && reward?.cap) {
        yearlySpend = calculateCappedYearlySpend(
          yearlySpend,
          reward.cap,
          reward.capPeriod || 'monthly' // Default to monthly for auto-highest cards (Citi Custom Cash)
        );
      }

      let rewardValue = yearlySpend * (rewardRate / 100);

      // Apply point value multiplier for points cards (~2cpp when transferred)
      const applicableReward = (category === bestCategory && reward) ? reward : baseReward;
      if (applicableReward?.rewardType === 'points' && applicableReward?.pointValue) {
        rewardValue = rewardValue * applicableReward.pointValue;
      }

      annualReward += rewardValue;
    }
  } else {
    // Normal cards: each category calculated independently
    for (const [category, monthly] of spendingEntries) {
      const rewardRate = getBestRateForCategory(card, category);
      let yearlySpend = monthly * 12;

      // Find the specific reward to check for caps
      const reward = card.rewards.find(r => r.category === category) ||
                    card.rewards.find(r => r.category === 'all');

      // Apply caps if they exist (use capPeriod for correct calculation)
      if (reward?.cap) {
        yearlySpend = calculateCappedYearlySpend(
          yearlySpend,
          reward.cap,
          reward.capPeriod || 'annual' // Default to annual for normal cards
        );
      }

      // Calculate reward value (base assumes 1 cent per point/1% cashback)
      let rewardValue = yearlySpend * (rewardRate / 100);

      // Apply point value multiplier (e.g., pointValue: 2 means 2cpp = 2x value)
      if (reward?.rewardType === 'points' && reward?.pointValue) {
        rewardValue = rewardValue * reward.pointValue;
      }

      annualReward += rewardValue;
    }
  }

  return Math.round(annualReward);
}

// ============================================
// SIGNUP BONUS CALCULATIONS
// ============================================

/**
 * Calculate the dollar value of a signup bonus
 * Points bonuses are converted using the card's pointValue (e.g., 2cpp)
 */
export function calculateSignupBonusValue(card: RecommendableCard): number {
  if (!card.signupBonus) return 0;

  const isPointsCard = card.rewards[0]?.rewardType === 'points';
  if (isPointsCard) {
    const pointValue = card.rewards[0]?.pointValue || 1;
    // Points bonuses are in raw points (e.g., 60000)
    // pointValue is cents per point (e.g., 2 = 2cpp)
    return (card.signupBonus.amount * pointValue) / 100;
  }

  // Cashback bonuses are already in dollars
  return card.signupBonus.amount;
}

/**
 * Check if user can reasonably achieve the signup bonus spend requirement
 * based on their projected monthly spending
 */
export function isSignupBonusAttainable(
  card: RecommendableCard,
  monthlySpending: { [key in SpendingCategory]?: number }
): { attainable: boolean; reason?: string } {
  if (!card.signupBonus) return { attainable: true };

  const spending = { ...DEFAULT_MONTHLY_SPENDING, ...monthlySpending };
  const totalMonthly = Object.values(spending).reduce((sum, v) => sum + (v || 0), 0);
  const bonusMonths = card.signupBonus.timeframeDays / 30;
  const totalAvailable = totalMonthly * bonusMonths;

  if (totalAvailable >= card.signupBonus.spendRequirement) {
    return { attainable: true };
  }

  return {
    attainable: false,
    reason: `Requires $${card.signupBonus.spendRequirement.toLocaleString()} in ${Math.round(bonusMonths)} months, but estimated spend is $${Math.round(totalAvailable).toLocaleString()}`
  };
}

/**
 * Calculate first-year value including signup bonus (if attainable)
 * Formula: annual rewards + signup bonus value - annual fee
 */
export function calculateFirstYearValue(
  card: RecommendableCard,
  monthlySpending: { [key in SpendingCategory]?: number } = {}
): number {
  const annualReward = calculateAnnualReward(card, monthlySpending);
  const signupBonusValue = calculateSignupBonusValue(card);
  const attainability = isSignupBonusAttainable(card, monthlySpending);

  // Only include bonus if user can realistically achieve it
  const effectiveBonus = attainability.attainable ? signupBonusValue : 0;

  return annualReward + effectiveBonus - card.annualFee;
}

/**
 * Calculate signup bonus score component (0-10 points)
 * Higher bonus value = higher score
 */
function calculateSignupBonusScore(
  card: RecommendableCard,
  monthlySpending: { [key in SpendingCategory]?: number }
): number {
  const bonusValue = calculateSignupBonusValue(card);
  const attainability = isSignupBonusAttainable(card, monthlySpending);

  // No score if no bonus or can't achieve it
  if (bonusValue === 0 || !attainability.attainable) return 0;

  // Score based on bonus value
  if (bonusValue >= 750) return 10;    // $750+ bonus (e.g., 60k points at 1.25cpp+)
  if (bonusValue >= 500) return 8;     // $500-749
  if (bonusValue >= 300) return 6;     // $300-499
  if (bonusValue >= 150) return 4;     // $150-299
  return 2;                             // Any smaller bonus
}

// ============================================
// REASONING GENERATION
// ============================================

/**
 * Generate human-readable reasoning for why a card was recommended
 */
function generateReasoning(
  card: RecommendableCard,
  preferences: RecommendationPreferences,
  monthlySpending: { [key in SpendingCategory]?: number } = {}
): string[] {
  const reasons: string[] = [];

  // Check if card earns transferable points (pointValue >= 2)
  const hasTransferablePoints = card.rewards.some(r =>
    r.rewardType === 'points' && r.pointValue && r.pointValue >= 2
  );

  // Category-specific reasons
  for (const category of preferences.topCategories) {
    const reward = card.rewards.find(r => r.category === category);
    if (reward && reward.rewardRate >= 3) {
      if (reward.rewardType === 'points') {
        // For points cards, show effective value with transfers
        const effectiveRate = reward.pointValue ? reward.rewardRate * reward.pointValue : reward.rewardRate;
        reasons.push(`${reward.rewardRate}x points on ${formatCategoryName(category)} (~${effectiveRate}% value with transfers)`);
      } else {
        reasons.push(`${reward.rewardRate}% cashback on ${formatCategoryName(category)}`);
      }
    }
  }

  // Flat-rate cards
  const allReward = card.rewards.find(r => r.category === 'all');
  if (allReward && allReward.rewardRate >= 1.5 && reasons.length === 0) {
    if (allReward.rewardType === 'points' && allReward.pointValue && allReward.pointValue >= 2) {
      const effectiveRate = allReward.rewardRate * allReward.pointValue;
      reasons.push(`${allReward.rewardRate}x points on all purchases (~${effectiveRate}% value with transfers)`);
    } else {
      reasons.push(`${allReward.rewardRate}% on all purchases`);
    }
  }

  // Transferable points explanation (high priority for points cards)
  if (hasTransferablePoints && reasons.length < 3) {
    reasons.push('Points transfer to airlines/hotels at ~2¢ each');
  }

  // No annual fee
  if (card.annualFee === 0) {
    reasons.push('No annual fee');
  }

  // Signup bonus with value estimate and attainability warning
  if (card.signupBonus) {
    const attainability = isSignupBonusAttainable(card, monthlySpending);
    if (card.rewards[0]?.rewardType === 'points') {
      const pointValue = card.rewards[0]?.pointValue || 1;
      const bonusDollarValue = Math.round(card.signupBonus.amount * pointValue / 100);
      reasons.push(`${card.signupBonus.amount.toLocaleString()} bonus points (~$${bonusDollarValue} value)`);
    } else {
      reasons.push(`$${card.signupBonus.amount} signup bonus`);
    }
    // Add attainability warning if bonus may be hard to achieve
    if (!attainability.attainable) {
      reasons.push(`⚠️ Bonus may be challenging: ${attainability.reason}`);
    }
  }

  // No foreign transaction fees
  if (!card.foreignTransactionFee) {
    reasons.push('No foreign transaction fees');
  }

  // Tier-specific benefits
  if (card.tier === 'basic' && preferences.simplicityPreference === 'fewer-cards') {
    reasons.push('Simple flat-rate rewards');
  }

  return reasons.slice(0, 6); // Max 6 reasons for display (allowing for attainability warning)
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
 * Select an optimal set of complementary cards.
 * Respects score order while ensuring cards cover different user categories.
 * Minimum score threshold prevents low-scoring cards from being selected just for coverage.
 */
function selectOptimalCardSet(
  scoredCards: ScoredCard[],
  preferences: RecommendationPreferences,
  maxCards: number
): ScoredCard[] {
  const selected: ScoredCard[] = [];
  const coveredCategories = new Set<string>();
  const userCategories = new Set(preferences.topCategories);

  // Minimum score threshold - don't add cards below 50% match
  const MIN_SCORE_THRESHOLD = 50;

  // Phase 1: Always select highest-scoring card first (already sorted by score)
  if (scoredCards.length > 0) {
    const topCard = scoredCards[0];
    selected.push(topCard);

    // Track which USER categories this card covers well (3%+ rate)
    topCard.card.rewards
      .filter(r => r.rewardRate >= 3 && userCategories.has(r.category as SpendingCategory))
      .forEach(r => coveredCategories.add(r.category));
  }

  // Phase 2: Select complementary cards that add significant value
  for (const sc of scoredCards.slice(1)) {
    if (selected.length >= maxCards) break;

    // Skip cards below score threshold
    if (sc.matchScore < MIN_SCORE_THRESHOLD) continue;

    // Find which USER categories this card excels in that aren't covered yet
    const uncoveredBonusCategories = sc.card.rewards.filter(r =>
      r.rewardRate >= 3 &&
      r.category !== 'all' &&
      r.category !== 'rotating' &&
      userCategories.has(r.category as SpendingCategory) &&
      !coveredCategories.has(r.category)
    );

    // Value threshold: must cover at least 1 uncovered user category at 3%+
    const addsSignificantValue = uncoveredBonusCategories.length > 0;

    // Or it's a strong all-rounder (2%+ on everything) - but only if we have few cards
    const isStrongAllRounder = sc.card.rewards.some(r =>
      r.category === 'all' && r.rewardRate >= 2
    );

    if (addsSignificantValue || (isStrongAllRounder && selected.length < 2)) {
      selected.push(sc);
      uncoveredBonusCategories.forEach(r => coveredCategories.add(r.category));
    }
  }

  return selected;
}

// ============================================
// SPENDING STRATEGY
// ============================================

/**
 * Find the best category to focus an auto-highest card on.
 * Uses monthly spending if available, otherwise falls back to category priority order.
 */
function findBestCategoryForAutoHighest(
  card: RecommendableCard,
  categories: SpendingCategory[],
  monthlySpending: { [key in SpendingCategory]?: number } = {}
): SpendingCategory {
  // Get categories this card has bonus rates for (excluding 'all')
  const bonusCategories = card.rewards
    .filter(r => r.category !== 'all' && r.category !== 'rotating' && r.rewardRate > 1)
    .map(r => r.category as SpendingCategory);

  // Filter to only categories the user cares about
  const eligibleCategories = categories.filter(c => bonusCategories.includes(c));

  if (eligibleCategories.length === 0) {
    return categories[0]; // Fallback to first user category
  }

  // If we have spending data, pick the category with highest spending
  const spending = { ...DEFAULT_MONTHLY_SPENDING, ...monthlySpending };
  let highestSpendCategory = eligibleCategories[0];
  let highestSpend = spending[highestSpendCategory] || 0;

  for (const cat of eligibleCategories) {
    const catSpend = spending[cat] || 0;
    if (catSpend > highestSpend) {
      highestSpend = catSpend;
      highestSpendCategory = cat;
    }
  }

  return highestSpendCategory;
}

/**
 * Generate a spending strategy showing which card to use for each category.
 * Handles auto-highest cards by assigning them to only ONE category.
 */
function generateSpendingStrategy(
  recommendations: CardRecommendation[],
  categories: SpendingCategory[],
  monthlySpending: { [key in SpendingCategory]?: number } = {}
): SpendingStrategy[] {
  const strategy: SpendingStrategy[] = [];

  // Pre-assign auto-highest cards to their best single category
  const autoHighestAssignments = new Map<string, SpendingCategory>();
  for (const rec of recommendations) {
    if (rec.card.isAutoHighestCategory) {
      const bestCategory = findBestCategoryForAutoHighest(rec.card, categories, monthlySpending);
      autoHighestAssignments.set(rec.card.id, bestCategory);
    }
  }

  for (const category of categories) {
    let bestCard = recommendations[0];
    let bestRate = 0;

    // Find the best card for this category among recommendations
    for (const rec of recommendations) {
      // Skip auto-highest cards if this isn't their assigned category
      if (rec.card.isAutoHighestCategory) {
        const assignedCategory = autoHighestAssignments.get(rec.card.id);
        if (assignedCategory !== category) {
          continue; // This auto-highest card is reserved for another category
        }
      }

      const rate = getBestRateForCategory(rec.card, category);
      if (rate > bestRate) {
        bestRate = rate;
        bestCard = rec;
      }
    }

    // Build reasoning - special message for auto-highest cards
    let reasoning: string;
    if (bestCard.card.isAutoHighestCategory && autoHighestAssignments.get(bestCard.card.id) === category) {
      reasoning = `Focus your ${formatCategoryName(category).toLowerCase()} spending here for ${bestRate}% back (your highest category)`;
    } else {
      reasoning = `${bestRate}% ${bestCard.card.rewards[0]?.rewardType || 'back'} on ${formatCategoryName(category)}`;
    }

    strategy.push({
      category,
      recommendedCard: bestCard.card.name,
      rewardRate: bestRate,
      reasoning
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
  // 0. Handle current cards if included
  let matchedCurrentCards: Map<string, RecommendableCard> = new Map();
  const currentCardIds: Set<string> = new Set();

  if (preferences.includeCurrentCards && preferences.currentCards) {
    matchedCurrentCards = matchCurrentCards(preferences.currentCards);
    // Get the IDs of matched cards to exclude from recommendations
    matchedCurrentCards.forEach((knownCard) => {
      currentCardIds.add(knownCard.id);
    });
  }

  // 1. Filter eligible cards by credit score AND exclude cards user already owns
  const eligibleCards = recommendableCards.filter(card =>
    meetsMinCreditScore(card.minCreditScore, preferences.creditScoreRange) &&
    !currentCardIds.has(card.id)
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

  // 4. Build recommendation objects with application order and first-year value
  const spendingData = preferences.monthlySpending || {};
  const recommendations: CardRecommendation[] = selectedCards.map((sc, index) => {
    const bonusValue = calculateSignupBonusValue(sc.card);
    const attainability = isSignupBonusAttainable(sc.card, spendingData);
    const firstYearValue = calculateFirstYearValue(sc.card, spendingData);

    return {
      card: sc.card,
      matchScore: sc.matchScore,
      primaryUse: determinePrimaryUse(sc.card, preferences.topCategories),
      reasoning: generateReasoning(sc.card, preferences, spendingData),
      estimatedAnnualReward: sc.estimatedReward,
      applicationOrder: index + 1,
      waitDays: index * APPLICATION_SPACING_DAYS,
      // First-year value metrics
      signupBonusValue: bonusValue > 0 ? bonusValue : undefined,
      firstYearValue: firstYearValue,
      isSignupBonusAttainable: bonusValue > 0 ? attainability.attainable : undefined,
      signupBonusAttainabilityReason: !attainability.attainable ? attainability.reason : undefined,
    };
  });

  // 4.5. Create CardRecommendation objects for matched current cards
  const currentCardRecommendations: CardRecommendation[] = [];
  if (preferences.includeCurrentCards && preferences.currentCards) {
    for (const userCard of preferences.currentCards) {
      const matchedCard = matchedCurrentCards.get(userCard.id);
      if (matchedCard) {
        currentCardRecommendations.push({
          card: matchedCard,
          matchScore: 100, // Current cards get full match score
          primaryUse: determinePrimaryUse(matchedCard, preferences.topCategories),
          reasoning: ['Card you already own', ...generateReasoning(matchedCard, preferences, spendingData).slice(0, 2)],
          estimatedAnnualReward: calculateAnnualReward(matchedCard, preferences.monthlySpending),
          applicationOrder: 0, // 0 indicates already owned
          waitDays: 0
        });
      }
    }
  }

  // 5. Generate spending strategy (include both current and new cards)
  const allCardsForStrategy = [...currentCardRecommendations, ...recommendations];
  const spendingStrategy = generateSpendingStrategy(allCardsForStrategy, preferences.topCategories, preferences.monthlySpending);

  // 6. Calculate totals (only for new recommendations, not current cards)
  const totalEstimatedAnnualReward = recommendations.reduce(
    (sum, r) => sum + r.estimatedAnnualReward,
    0
  );
  const totalAnnualFees = recommendations.reduce(
    (sum, r) => sum + r.card.annualFee,
    0
  );

  // 7. Project score impact (only counts new cards)
  const projectedScoreImpact = calculateScoreProjection(recommendations.length);

  return {
    recommendations,
    spendingStrategy,
    projectedScoreImpact,
    totalEstimatedAnnualReward,
    totalAnnualFees,
    netAnnualBenefit: totalEstimatedAnnualReward - totalAnnualFees,
    currentCardRecommendations: currentCardRecommendations.length > 0 ? currentCardRecommendations : undefined,
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
