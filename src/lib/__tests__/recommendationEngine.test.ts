import {
  calculateMatchScore,
  calculateAnnualReward,
  calculateSignupBonusValue,
  isSignupBonusAttainable,
  calculateFirstYearValue,
  generateRecommendations,
} from '../recommendationEngine';
import { getBestRateForCategory } from '@/data/recommendable-cards';
import {
  RecommendableCard,
  RecommendationPreferences,
  SpendingCategory,
} from '@/types';

// ============================================
// TEST FIXTURES
// ============================================

/**
 * Mock card with cashback signup bonus
 */
const mockCashbackCard: RecommendableCard = {
  id: 'test-cashback-card',
  name: 'Test Cashback Card',
  issuer: 'Test Bank',
  imageUrl: '/test.png',
  tier: 'basic',
  annualFee: 0,
  minCreditScore: 'good',
  foreignTransactionFee: false,
  pros: ['No annual fee'],
  cons: [],
  rewards: [
    { category: 'dining', rewardRate: 3, rewardType: 'cashback' },
    { category: 'groceries', rewardRate: 3, rewardType: 'cashback' },
    { category: 'all', rewardRate: 1, rewardType: 'cashback' },
  ],
  signupBonus: {
    amount: 200,
    spendRequirement: 500,
    timeframeDays: 90,
  },
};

/**
 * Mock card with points signup bonus (e.g., Amex/Chase style)
 */
const mockPointsCard: RecommendableCard = {
  id: 'test-points-card',
  name: 'Test Points Card',
  issuer: 'Test Premium',
  imageUrl: '/test-premium.png',
  tier: 'aggressive',
  annualFee: 250,
  minCreditScore: 'excellent',
  foreignTransactionFee: false,
  pros: ['Great travel rewards'],
  cons: ['High annual fee'],
  rewards: [
    { category: 'dining', rewardRate: 4, rewardType: 'points', pointValue: 2 },
    { category: 'travel', rewardRate: 4, rewardType: 'points', pointValue: 2 },
    { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 },
  ],
  signupBonus: {
    amount: 60000,
    spendRequirement: 4000,
    timeframeDays: 90,
  },
};

/**
 * Mock card with spending cap (Citi Custom Cash style)
 */
const mockCappedCard: RecommendableCard = {
  id: 'test-capped-card',
  name: 'Test Capped Card',
  issuer: 'Test Bank',
  imageUrl: '/test-capped.png',
  tier: 'moderate',
  annualFee: 0,
  minCreditScore: 'good',
  foreignTransactionFee: false,
  pros: ['5% on top category'],
  cons: ['$500 monthly cap'],
  rewards: [
    { category: 'groceries', rewardRate: 5, rewardType: 'cashback', cap: 500, capPeriod: 'monthly' },
    { category: 'dining', rewardRate: 5, rewardType: 'cashback', cap: 500, capPeriod: 'monthly' },
    { category: 'all', rewardRate: 1, rewardType: 'cashback' },
  ],
  isAutoHighestCategory: true,
};

/**
 * Mock card with rotating categories (Chase Freedom Flex style)
 */
const mockRotatingCard: RecommendableCard = {
  id: 'test-rotating-card',
  name: 'Test Rotating Card',
  issuer: 'Test Bank',
  imageUrl: '/test-rotating.png',
  tier: 'moderate',
  annualFee: 0,
  minCreditScore: 'good',
  foreignTransactionFee: false,
  pros: ['5% rotating'],
  cons: ['Must activate quarterly'],
  rewards: [
    {
      category: 'rotating',
      rewardRate: 5,
      rewardType: 'cashback',
      cap: 1500,
      capPeriod: 'quarterly',
      isRotating: true,
      rotatingCategories: ['groceries', 'gas', 'dining', 'online-shopping', 'travel'],
    },
    { category: 'travel', rewardRate: 5, rewardType: 'cashback' },
    { category: 'all', rewardRate: 1, rewardType: 'cashback' },
  ],
};

/**
 * Default user preferences for testing
 */
const defaultPreferences: RecommendationPreferences = {
  simplicityPreference: 'more-rewards',
  topCategories: ['dining', 'groceries', 'gas'] as SpendingCategory[],
  rewardPreference: 'either',
  creditScoreRange: 'excellent',
};

// ============================================
// SIGNUP BONUS VALUE TESTS
// ============================================

describe('calculateSignupBonusValue', () => {
  test('returns 0 for card with no signup bonus', () => {
    const cardNoBonus: RecommendableCard = {
      ...mockCashbackCard,
      signupBonus: undefined,
    };
    expect(calculateSignupBonusValue(cardNoBonus)).toBe(0);
  });

  test('calculates cashback bonus value correctly', () => {
    // $200 bonus should return 200
    expect(calculateSignupBonusValue(mockCashbackCard)).toBe(200);
  });

  test('calculates points bonus value using pointValue', () => {
    // 60,000 points at 2cpp = $1,200
    const bonusValue = calculateSignupBonusValue(mockPointsCard);
    expect(bonusValue).toBe(1200);
  });

  test('uses 1cpp for points cards without explicit pointValue', () => {
    const cardWithoutPointValue: RecommendableCard = {
      ...mockPointsCard,
      rewards: [
        { category: 'all', rewardRate: 2, rewardType: 'points' }, // No pointValue
      ],
    };
    // 60,000 points at 1cpp = $600
    expect(calculateSignupBonusValue(cardWithoutPointValue)).toBe(600);
  });
});

// ============================================
// SIGNUP BONUS ATTAINABILITY TESTS
// ============================================

describe('isSignupBonusAttainable', () => {
  test('returns attainable:true for card with no bonus', () => {
    const cardNoBonus: RecommendableCard = {
      ...mockCashbackCard,
      signupBonus: undefined,
    };
    const result = isSignupBonusAttainable(cardNoBonus, {});
    expect(result.attainable).toBe(true);
  });

  test('returns attainable:true when spending exceeds requirement', () => {
    // Low spend requirement ($500 in 3 months)
    // Default monthly spending is ~$1900, so 3 months = ~$5700
    const result = isSignupBonusAttainable(mockCashbackCard, {});
    expect(result.attainable).toBe(true);
  });

  test('returns attainable:false with explanation when spending is insufficient', () => {
    // Card requires $4000 in 3 months = ~$1333/month
    // Set very low spending
    const lowSpending: Record<SpendingCategory, number> = {
      'dining': 50,
      'groceries': 100,
      'gas': 30,
      'travel': 0,
      'online-shopping': 20,
      'streaming': 10,
      'utilities': 50,
      'transit': 10,
      'phone': 30,
      'entertainment': 10,
      'drugstores': 10,
    };

    const result = isSignupBonusAttainable(mockPointsCard, lowSpending);
    expect(result.attainable).toBe(false);
    expect(result.reason).toContain('$4,000');
    expect(result.reason).toContain('3 months');
  });

  test('uses default spending when no spending provided', () => {
    // Default spending totals ~$1900/month
    // mockCashbackCard requires $500 in 3 months - should be attainable
    const result = isSignupBonusAttainable(mockCashbackCard, {});
    expect(result.attainable).toBe(true);
  });
});

// ============================================
// FIRST YEAR VALUE TESTS
// ============================================

describe('calculateFirstYearValue', () => {
  test('includes signup bonus when attainable', () => {
    const firstYearValue = calculateFirstYearValue(mockCashbackCard, {});
    const annualReward = calculateAnnualReward(mockCashbackCard, {});

    // First year = annual reward + $200 bonus - $0 fee
    expect(firstYearValue).toBe(annualReward + 200);
  });

  test('excludes signup bonus when not attainable', () => {
    const lowSpending: Record<SpendingCategory, number> = {
      'dining': 10,
      'groceries': 20,
      'gas': 5,
      'travel': 0,
      'online-shopping': 5,
      'streaming': 5,
      'utilities': 10,
      'transit': 5,
      'phone': 10,
      'entertainment': 5,
      'drugstores': 5,
    };

    const firstYearValue = calculateFirstYearValue(mockPointsCard, lowSpending);
    const annualReward = calculateAnnualReward(mockPointsCard, lowSpending);

    // First year = annual reward - $250 fee (no bonus since unattainable)
    expect(firstYearValue).toBe(annualReward - 250);
  });

  test('subtracts annual fee', () => {
    const firstYearValue = calculateFirstYearValue(mockPointsCard, {});
    const annualReward = calculateAnnualReward(mockPointsCard, {});
    const bonusValue = calculateSignupBonusValue(mockPointsCard);

    // First year = annual reward + bonus - $250 fee
    expect(firstYearValue).toBe(annualReward + bonusValue - 250);
  });
});

// ============================================
// CAP PERIOD HANDLING TESTS
// ============================================

describe('calculateAnnualReward with caps', () => {
  test('applies monthly cap correctly (×12)', () => {
    // mockCappedCard has $500 monthly cap on 5% category
    // If user spends $600/month on groceries, only $500 counts
    // Expected: $500 * 12 months * 5% = $300/year on bonus category

    const highGrocerySpending: Record<SpendingCategory, number> = {
      ...Object.fromEntries(
        ['dining', 'gas', 'travel', 'online-shopping', 'streaming', 'utilities', 'transit', 'phone', 'entertainment', 'drugstores']
          .map(c => [c, 0])
      ),
      groceries: 600, // Over the $500/month cap
    } as Record<SpendingCategory, number>;

    const reward = calculateAnnualReward(mockCappedCard, highGrocerySpending);

    // Capped at $500/month * 12 = $6000/year, at 5% = $300
    // Plus any base rate on other categories (1% on $0 = $0)
    expect(reward).toBe(300);
  });

  test('does not apply cap when spending is under limit', () => {
    const lowGrocerySpending: Record<SpendingCategory, number> = {
      ...Object.fromEntries(
        ['dining', 'gas', 'travel', 'online-shopping', 'streaming', 'utilities', 'transit', 'phone', 'entertainment', 'drugstores']
          .map(c => [c, 0])
      ),
      groceries: 300, // Under the $500/month cap
    } as Record<SpendingCategory, number>;

    const reward = calculateAnnualReward(mockCappedCard, lowGrocerySpending);

    // $300/month * 12 = $3600/year at 5% = $180
    expect(reward).toBe(180);
  });
});

// ============================================
// ROTATING CATEGORY TESTS
// ============================================

describe('getBestRateForCategory with rotating categories', () => {
  test('returns 25% of rotating rate for eligible categories', () => {
    // mockRotatingCard has 5% rotating for groceries, gas, dining, etc.
    // Should return 5% * 0.25 = 1.25%
    const gasRate = getBestRateForCategory(mockRotatingCard, 'gas');
    expect(gasRate).toBe(1.25);
  });

  test('returns direct category rate when available (not rotating)', () => {
    // mockRotatingCard has direct 5% on travel
    const travelRate = getBestRateForCategory(mockRotatingCard, 'travel');
    expect(travelRate).toBe(5);
  });

  test('returns base rate for categories not in rotating list', () => {
    // utilities is not in rotatingCategories
    const utilitiesRate = getBestRateForCategory(mockRotatingCard, 'utilities');
    expect(utilitiesRate).toBe(1); // Falls back to 'all' rate
  });
});

// ============================================
// MATCH SCORE TESTS
// ============================================

describe('calculateMatchScore', () => {
  test('returns 0 for ineligible credit score', () => {
    const fairCreditPrefs: RecommendationPreferences = {
      ...defaultPreferences,
      creditScoreRange: 'fair',
    };

    // mockPointsCard requires 'excellent' credit
    const score = calculateMatchScore(mockPointsCard, fairCreditPrefs);
    expect(score).toBe(0);
  });

  test('includes signup bonus in score calculation', () => {
    const cardWithBonus = mockCashbackCard;
    const cardWithoutBonus: RecommendableCard = {
      ...mockCashbackCard,
      id: 'no-bonus-card',
      signupBonus: undefined,
    };

    const scoreWithBonus = calculateMatchScore(cardWithBonus, defaultPreferences);
    const scoreWithoutBonus = calculateMatchScore(cardWithoutBonus, defaultPreferences);

    // Card with bonus should score higher
    expect(scoreWithBonus).toBeGreaterThan(scoreWithoutBonus);
  });

  test('high-bonus cards score significantly higher', () => {
    // mockPointsCard has $1200 bonus value (60k points at 2cpp)
    // This should add close to max (10) bonus points
    const score = calculateMatchScore(mockPointsCard, defaultPreferences);

    // Should be relatively high (>60) since it matches categories and has huge bonus
    expect(score).toBeGreaterThan(60);
  });

  test('category match uses 6% divisor (not 5%)', () => {
    // Create a 6% card
    const sixPercentCard: RecommendableCard = {
      ...mockCashbackCard,
      rewards: [
        { category: 'groceries', rewardRate: 6, rewardType: 'cashback' },
        { category: 'all', rewardRate: 1, rewardType: 'cashback' },
      ],
    };

    const fivePercentCard: RecommendableCard = {
      ...mockCashbackCard,
      rewards: [
        { category: 'groceries', rewardRate: 5, rewardType: 'cashback' },
        { category: 'all', rewardRate: 1, rewardType: 'cashback' },
      ],
    };

    const groceryPrefs: RecommendationPreferences = {
      ...defaultPreferences,
      topCategories: ['groceries'],
    };

    const score6 = calculateMatchScore(sixPercentCard, groceryPrefs);
    const score5 = calculateMatchScore(fivePercentCard, groceryPrefs);

    // 6% card should score higher than 5% card
    expect(score6).toBeGreaterThan(score5);
  });
});

// ============================================
// CARD SELECTION TESTS
// ============================================

describe('generateRecommendations card selection', () => {
  test('respects score order - highest scoring card is first', () => {
    const result = generateRecommendations(defaultPreferences);

    if (result.recommendations.length >= 2) {
      // First recommendation should have highest or equal score
      expect(result.recommendations[0].matchScore)
        .toBeGreaterThanOrEqual(result.recommendations[1].matchScore);
    }
  });

  test('excludes cards below minimum score threshold', () => {
    const result = generateRecommendations(defaultPreferences);

    // All recommendations should have score >= 50 (MIN_SCORE_THRESHOLD)
    for (const rec of result.recommendations) {
      expect(rec.matchScore).toBeGreaterThanOrEqual(50);
    }
  });

  test('respects fewer-cards preference', () => {
    const fewerCardsPrefs: RecommendationPreferences = {
      ...defaultPreferences,
      simplicityPreference: 'fewer-cards',
    };

    const result = generateRecommendations(fewerCardsPrefs);

    // Should recommend at most 2 cards
    expect(result.recommendations.length).toBeLessThanOrEqual(2);
  });

  test('includes first-year value in recommendations', () => {
    const result = generateRecommendations(defaultPreferences);

    for (const rec of result.recommendations) {
      expect(rec.firstYearValue).toBeDefined();
      expect(typeof rec.firstYearValue).toBe('number');
    }
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('recommendation engine integration', () => {
  test('high-bonus card ranks above similar card without bonus', () => {
    // Use real preferences that would apply to both test cards
    const prefs: RecommendationPreferences = {
      simplicityPreference: 'more-rewards',
      topCategories: ['dining', 'groceries'],
      rewardPreference: 'cashback',
      creditScoreRange: 'good',
    };

    const scoreWithBonus = calculateMatchScore(mockCashbackCard, prefs);
    const scoreWithoutBonus = calculateMatchScore(
      { ...mockCashbackCard, signupBonus: undefined },
      prefs
    );

    expect(scoreWithBonus).toBeGreaterThan(scoreWithoutBonus);
  });

  test('spending strategy assigns best card per category', () => {
    const result = generateRecommendations(defaultPreferences);

    // Each category in strategy should have a reward rate
    for (const strategy of result.spendingStrategy) {
      expect(strategy.rewardRate).toBeGreaterThan(0);
      expect(strategy.recommendedCard).toBeTruthy();
    }
  });

  test('net annual benefit calculation is correct', () => {
    const result = generateRecommendations(defaultPreferences);

    const expectedNet = result.totalEstimatedAnnualReward - result.totalAnnualFees;
    expect(result.netAnnualBenefit).toBe(expectedNet);
  });
});
