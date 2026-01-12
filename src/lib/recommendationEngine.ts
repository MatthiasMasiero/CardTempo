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

// Annual fee score thresholds (used as fallback when no spending data)
const FEE_SCORES: Array<{ maxFee: number; score: number }> = [
  { maxFee: 0, score: 10 },
  { maxFee: 100, score: 5 },
  { maxFee: 200, score: 2 },
  { maxFee: Infinity, score: 0 },
];

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
 * Calculate match score for a card against user preferences.
 * Returns a score from 0-100.
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

  // Category Match (40 points max)
  const categoryPoints = 40 / Math.max(preferences.topCategories.length, 1);

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
    score += categoryPoints * Math.min(bestRate / 5, 1); // Best category
    // Remaining categories get base rate scoring
    for (let i = 1; i < preferences.topCategories.length; i++) {
      score += categoryPoints * Math.min(baseRate / 5, 1);
    }
  } else {
    // Normal cards: score each category independently
    for (const category of preferences.topCategories) {
      const rewardRate = getBestRateForCategory(card, category);
      score += categoryPoints * Math.min(rewardRate / 5, 1);
    }
  }

  // Reward Type Match (15 points)
  const cardRewardType = card.rewards[0]?.rewardType;
  if (preferences.rewardPreference === 'either' || preferences.rewardPreference === cardRewardType) {
    score += 15;
  } else {
    score += 5;
  }

  // Simplicity Match (15 points)
  score += SIMPLICITY_TIER_SCORES[preferences.simplicityPreference][card.tier];

  // Fee Value Score (15 points) - Use spending-based scoring if available
  const hasSpendingData = preferences.monthlySpending &&
    Object.keys(preferences.monthlySpending).length > 0;

  if (hasSpendingData) {
    // Use dynamic scoring based on whether rewards justify the fee
    score += calculateFeeValueScore(card, preferences.monthlySpending!);
  } else {
    // Fallback to static fee penalty (scaled to 15 points max)
    const feeEntry = FEE_SCORES.find(f => card.annualFee <= f.maxFee)!;
    score += Math.round(feeEntry.score * 1.5); // Scale 0-10 to 0-15
  }

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

      // Apply cap if this is the bonus category
      if (category === bestCategory && reward?.cap) {
        yearlySpend = Math.min(yearlySpend, reward.cap * 12); // cap is monthly
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

      // Apply caps if they exist
      if (reward?.cap) {
        yearlySpend = Math.min(yearlySpend, reward.cap);
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

  // Signup bonus with value estimate
  if (card.signupBonus) {
    if (card.rewards[0]?.rewardType === 'points') {
      const pointValue = card.rewards[0]?.pointValue || 1;
      const bonusDollarValue = Math.round(card.signupBonus.amount * pointValue / 100);
      reasons.push(`${card.signupBonus.amount.toLocaleString()} bonus points (~$${bonusDollarValue} value)`);
    } else {
      reasons.push(`$${card.signupBonus.amount} signup bonus`);
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

  return reasons.slice(0, 5); // Max 5 reasons for display
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
          reasoning: ['Card you already own', ...generateReasoning(matchedCard, preferences).slice(0, 2)],
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
