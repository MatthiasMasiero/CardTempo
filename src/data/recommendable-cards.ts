import { RecommendableCard, SpendingCategory, RewardTier, CreditScoreRange } from '@/types';

/**
 * Recommendable Cards Database
 *
 * Cards are organized into three tiers:
 * - BASIC: Simple flat-rate cards (~2% on everything)
 * - MODERATE: Category bonus cards (3-4% in specific categories)
 * - AGGRESSIVE: High-reward specialized cards (5%+ or high-value points)
 */

export const recommendableCards: RecommendableCard[] = [
  // ============================================
  // BASIC TIER - Simple flat-rate cards (~2%)
  // ============================================
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash Card',
    issuer: 'Citi',
    imageUrl: '/cards/default-card.svg',
    tier: 'basic',
    annualFee: 0,
    rewards: [
      { category: 'all', rewardRate: 2, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['2% on everything', 'No annual fee', 'Simple to use'],
    cons: ['Foreign transaction fees', 'No signup bonus']
  },
  {
    id: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash Card',
    issuer: 'Wells Fargo',
    imageUrl: '/cards/default-card.svg',
    tier: 'basic',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 1000, timeframeDays: 90 },
    rewards: [
      { category: 'all', rewardRate: 2, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['2% on everything', 'No annual fee', '$200 signup bonus'],
    cons: ['Foreign transaction fees']
  },
  {
    id: 'apple-card',
    name: 'Apple Card',
    issuer: 'Goldman Sachs',
    imageUrl: '/cards/apple-card.png',
    tier: 'basic',
    annualFee: 0,
    rewards: [
      { category: 'all', rewardRate: 2, rewardType: 'cashback' } // with Apple Pay
    ],
    minCreditScore: 'fair',
    foreignTransactionFee: false,
    pros: ['No fees at all', 'Daily Cash rewards', 'Easy approval', 'Great for Apple ecosystem'],
    cons: ['Only 2% with Apple Pay', '1% with physical card']
  },
  {
    id: 'capital-one-quicksilver',
    name: 'Capital One Quicksilver',
    issuer: 'Capital One',
    imageUrl: '/cards/default-card.svg',
    tier: 'basic',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'all', rewardRate: 1.5, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['No foreign transaction fees', '$200 bonus', 'Simple rewards'],
    cons: ['Only 1.5% cashback']
  },
  {
    id: 'fidelity-visa',
    name: 'Fidelity Rewards Visa',
    issuer: 'Fidelity',
    imageUrl: '/cards/default-card.svg',
    tier: 'basic',
    annualFee: 0,
    rewards: [
      { category: 'all', rewardRate: 2, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['2% on everything', 'No annual fee', 'Direct deposit to Fidelity account'],
    cons: ['Requires Fidelity account', 'Foreign transaction fees']
  },

  // ============================================
  // MODERATE TIER - Category bonus cards (3-4%)
  // ============================================
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    imageUrl: '/cards/chase-freedom-flex.png',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'rotating', rewardRate: 5, rewardType: 'points', cap: 1500, isRotating: true },
      { category: 'dining', rewardRate: 3, rewardType: 'points' },
      { category: 'travel', rewardRate: 3, rewardType: 'points' },
      { category: 'all', rewardRate: 1, rewardType: 'points' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['5% rotating categories', '3% on dining', 'No annual fee', 'Points transfer to travel partners'],
    cons: ['Must activate quarterly', 'Foreign transaction fees']
  },
  {
    id: 'discover-it-cash-back',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    imageUrl: '/cards/discover-it-cash-back.png',
    tier: 'moderate',
    annualFee: 0,
    rewards: [
      { category: 'rotating', rewardRate: 5, rewardType: 'cashback', cap: 1500, isRotating: true },
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'fair',
    foreignTransactionFee: false,
    pros: ['Cashback Match doubles first year rewards', 'No foreign fees', 'Easy approval'],
    cons: ['Must activate quarterly', 'Not accepted everywhere']
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred from Amex',
    issuer: 'American Express',
    imageUrl: '/cards/amex-blue-cash-preferred.png',
    tier: 'moderate',
    annualFee: 95,
    signupBonus: { amount: 350, spendRequirement: 3000, timeframeDays: 180 },
    rewards: [
      { category: 'groceries', rewardRate: 6, rewardType: 'cashback', cap: 6000 },
      { category: 'online-shopping', rewardRate: 6, rewardType: 'cashback', cap: 6000 },
      { category: 'gas', rewardRate: 3, rewardType: 'cashback' },
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['6% on groceries', '6% on streaming', '$350 signup bonus'],
    cons: ['$95 annual fee', 'Category caps', 'Foreign transaction fees']
  },
  {
    id: 'capital-one-savor-one',
    name: 'Capital One SavorOne',
    issuer: 'Capital One',
    imageUrl: '/cards/default-card.svg',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'dining', rewardRate: 3, rewardType: 'cashback' },
      { category: 'online-shopping', rewardRate: 3, rewardType: 'cashback' },
      { category: 'groceries', rewardRate: 3, rewardType: 'cashback' },
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['3% on dining, entertainment, groceries', 'No annual fee', 'No foreign fees'],
    cons: ['Lower rates than premium cards']
  },
  {
    id: 'citi-custom-cash',
    name: 'Citi Custom Cash Card',
    issuer: 'Citi',
    imageUrl: '/cards/default-card.svg',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 1500, timeframeDays: 180 },
    rewards: [
      { category: 'all', rewardRate: 5, rewardType: 'cashback', cap: 500 }, // Auto-detects top category
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['5% on top spending category automatically', 'No annual fee', 'Flexible'],
    cons: ['$500 cap on 5% rewards', 'Foreign transaction fees']
  },

  // ============================================
  // AGGRESSIVE TIER - High-reward specialized cards
  // TODO(human): Add 2-3 more aggressive tier cards
  // ============================================
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    imageUrl: '/cards/amex-gold.png',
    tier: 'aggressive',
    annualFee: 250,
    signupBonus: { amount: 60000, spendRequirement: 6000, timeframeDays: 180 },
    rewards: [
      { category: 'dining', rewardRate: 4, rewardType: 'points', pointValue: 2 },
      { category: 'groceries', rewardRate: 4, rewardType: 'points', pointValue: 2, cap: 25000 },
      { category: 'travel', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['4x on dining & groceries', '$120 dining credits', '$120 Uber credits', 'Transfer partners'],
    cons: ['$250 annual fee', 'Must pay in full (charge card)']
  },
  {
    id: 'capital-one-savor',
    name: 'Capital One Savor',
    issuer: 'Capital One',
    imageUrl: '/cards/default-card.svg',
    tier: 'aggressive',
    annualFee: 95,
    signupBonus: { amount: 300, spendRequirement: 3000, timeframeDays: 90 },
    rewards: [
      { category: 'dining', rewardRate: 4, rewardType: 'cashback' },
      { category: 'online-shopping', rewardRate: 4, rewardType: 'cashback' },
      { category: 'groceries', rewardRate: 3, rewardType: 'cashback' },
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['4% on dining & entertainment', 'No foreign fees', 'Unlimited rewards'],
    cons: ['$95 annual fee']
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    imageUrl: '/cards/chase-freedom-unlimited.png',
    tier: 'aggressive',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'travel', rewardRate: 5, rewardType: 'points' },
      { category: 'dining', rewardRate: 3, rewardType: 'points' },
      { category: 'all', rewardRate: 1.5, rewardType: 'points' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['1.5x on everything', 'Points worth more with Sapphire', 'No annual fee'],
    cons: ['Best value requires Sapphire card', 'Foreign fees']
  },
  {
    id: 'us-bank-cash-plus',
    name: 'U.S. Bank Cash+ Visa',
    issuer: 'U.S. Bank',
    imageUrl: '/cards/default-card.svg',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 1000, timeframeDays: 120 },
    rewards: [
      // User selects 2 categories for 5% from: utilities, cell phone, TV/streaming, fast food, gyms, etc.
      // User selects 1 category for 2% from: gas, groceries, restaurants, etc.
      { category: 'gas', rewardRate: 2, rewardType: 'cashback' },
      { category: 'groceries', rewardRate: 2, rewardType: 'cashback' },
      { category: 'dining', rewardRate: 2, rewardType: 'cashback' }, // if chosen as 2% category
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    isSelectableCategories: true, // Flag to indicate user must choose categories
    pros: ['5% on 2 categories YOU choose (utilities, streaming, fast food, gyms, etc.)', '2% on gas/groceries/dining if selected', 'No annual fee'],
    cons: ['$2,000 quarterly cap on 5%', 'Must manually select categories each quarter', 'Foreign transaction fees', '5% categories are niche (not standard spending)']
  },
  {
    id: 'amex-blue-cash-everyday',
    name: 'Blue Cash Everyday from Amex',
    issuer: 'American Express',
    imageUrl: '/cards/default-card.svg',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 2000, timeframeDays: 180 },
    rewards: [
      { category: 'groceries', rewardRate: 3, rewardType: 'cashback', cap: 6000 },
      { category: 'gas', rewardRate: 3, rewardType: 'cashback' },
      { category: 'online-shopping', rewardRate: 3, rewardType: 'cashback' },
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['3% on groceries, gas, online shopping', 'No annual fee', '$200 bonus'],
    cons: ['Lower rates than Blue Cash Preferred', 'Foreign transaction fees']
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get cards filtered by tier
 */
export function getCardsByTier(tier: RewardTier): RecommendableCard[] {
  return recommendableCards.filter(card => card.tier === tier);
}

/**
 * Get cards that offer rewards in a specific category
 */
export function getCardsForCategory(category: SpendingCategory): RecommendableCard[] {
  return recommendableCards
    .filter(card =>
      card.rewards.some(r => r.category === category || r.category === 'all' || r.category === 'rotating')
    )
    .sort((a, b) => {
      const aRate = getBestRateForCategory(a, category);
      const bRate = getBestRateForCategory(b, category);
      return bRate - aRate;
    });
}

/**
 * Get the best reward rate a card offers for a specific category
 */
export function getBestRateForCategory(card: RecommendableCard, category: SpendingCategory): number {
  const categoryReward = card.rewards.find(r => r.category === category);
  if (categoryReward) return categoryReward.rewardRate;

  const allReward = card.rewards.find(r => r.category === 'all');
  return allReward?.rewardRate || 0;
}

/**
 * Get cards that match a minimum credit score
 */
export function getCardsForCreditScore(score: CreditScoreRange): RecommendableCard[] {
  const scoreOrder: CreditScoreRange[] = ['building', 'fair', 'good', 'excellent'];
  const userScoreIndex = scoreOrder.indexOf(score);

  return recommendableCards.filter(card => {
    const cardScoreIndex = scoreOrder.indexOf(card.minCreditScore);
    return userScoreIndex >= cardScoreIndex;
  });
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: SpendingCategory | 'all' | 'rotating'): string {
  const map: Record<string, string> = {
    'dining': 'Dining',
    'groceries': 'Groceries',
    'gas': 'Gas',
    'travel': 'Travel',
    'online-shopping': 'Online Shopping',
    'all': 'Everything',
    'rotating': 'Rotating Categories'
  };
  return map[category] || category;
}
