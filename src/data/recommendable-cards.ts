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
    imageUrl: '/cards/citi-double-cash.png',
    tier: 'basic',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 1500, timeframeDays: 180 },
    rewards: [
      { category: 'all', rewardRate: 2, rewardType: 'cashback' },
      { category: 'travel', rewardRate: 5, rewardType: 'cashback' } // via Citi Travel portal
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['2% on everything (1% when you buy, 1% when you pay)', '5% on hotels/rentals via Citi Travel', '$200 bonus after $1,500 spend', 'Points transfer to travel partners'],
    cons: ['3% foreign transaction fee', 'No 0% intro APR on purchases']
  },
  {
    id: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash Card',
    issuer: 'Wells Fargo',
    imageUrl: '/cards/wells-fargo-active-cash.png',
    tier: 'basic',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'all', rewardRate: 2, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['2% on everything', 'Easy $200 bonus (only $500 spend)', 'Cell phone protection up to $600', '0% intro APR for 12 months'],
    cons: ['3% foreign transaction fee']
  },
  {
    id: 'apple-card',
    name: 'Apple Card',
    issuer: 'Goldman Sachs (transitioning to Chase in 2026)',
    imageUrl: '/cards/apple-card.png',
    tier: 'basic',
    annualFee: 0,
    signupBonus: { amount: 75, spendRequirement: 1, timeframeDays: 30 }, // Referral bonus
    rewards: [
      { category: 'all', rewardRate: 2, rewardType: 'cashback' }, // with Apple Pay
      { category: 'dining', rewardRate: 3, rewardType: 'cashback' }, // Uber Eats
      { category: 'gas', rewardRate: 3, rewardType: 'cashback' }, // Exxon/Mobil
      { category: 'travel', rewardRate: 3, rewardType: 'cashback' } // Hertz
    ],
    minCreditScore: 'fair',
    foreignTransactionFee: false,
    pros: ['No fees at all', '3% at Apple, Nike, Uber, Walgreens, Exxon/Mobil, Hertz car rentals', '2% everywhere with Apple Pay', 'Daily Cash deposited instantly', 'High-yield savings account (3.65% APY)'],
    cons: ['Only 1% with physical card', 'Limited 3% partner merchants', 'Requires Apple device']
  },
  {
    id: 'capital-one-quicksilver',
    name: 'Capital One Quicksilver',
    issuer: 'Capital One',
    imageUrl: '/cards/capital-one-quicksilver.png',
    tier: 'basic',
    annualFee: 0,
    signupBonus: { amount: 300, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'all', rewardRate: 1.5, rewardType: 'cashback' },
      { category: 'travel', rewardRate: 5, rewardType: 'cashback' } // via Capital One Travel
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['No foreign transaction fees', '$300 bonus ($200 cash + $100 travel credit)', '5% on Capital One Travel bookings', '0% intro APR for 15 months'],
    cons: ['Only 1.5% base cashback (lower than 2% cards)']
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
    pros: ['2% on everything with no caps', 'No annual fee', 'Automatic deposit to Fidelity account'],
    cons: ['Requires Fidelity account for 2% (otherwise 1%)', '1% foreign transaction fee']
  },
  {
    id: 'bofa-travel-rewards',
    name: 'Bank of America Travel Rewards',
    issuer: 'Bank of America',
    imageUrl: '/cards/bank-of-america-travel-rewards.png',
    tier: 'basic',
    annualFee: 0,
    signupBonus: { amount: 250, spendRequirement: 1000, timeframeDays: 90 },
    rewards: [
      { category: 'all', rewardRate: 1.5, rewardType: 'points' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['1.5 points per $1 on everything', 'No annual fee', 'No foreign transaction fees', 'Preferred Rewards earn up to 2.62x', '0% intro APR for 15 cycles'],
    cons: ['Lower base rate than 2% cards', 'Best value requires BofA banking relationship']
  },
  {
    id: 'discover-it-miles',
    name: 'Discover it Miles',
    issuer: 'Discover',
    imageUrl: '/cards/discover-it-miles.png',
    tier: 'basic',
    annualFee: 0,
    rewards: [
      { category: 'all', rewardRate: 1.5, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['1.5x miles on ALL purchases', 'Miles Match DOUBLES first year earnings (effectively 3%)', 'No annual fee', 'No foreign transaction fees', '0% intro APR for 15 months'],
    cons: ['No transfer partners', 'Lower acceptance internationally', 'After first year, below 2% cards']
  },

  // ============================================
  // MODERATE TIER - Category bonus cards (3-4%)
  // ============================================
  {
    id: 'wells-fargo-autograph',
    name: 'Wells Fargo Autograph',
    issuer: 'Wells Fargo',
    imageUrl: '/cards/wells-fargo-autograph.png',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 1000, timeframeDays: 90 },
    rewards: [
      { category: 'dining', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'travel', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'gas', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'online-shopping', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['3x on dining, travel, gas, streaming & phone plans', 'No annual fee', 'Cell phone protection', 'Transfer to airline partners', 'No foreign transaction fees'],
    cons: ['Limited transfer partners', 'Must have Wells Fargo for best value']
  },
  {
    id: 'citi-strata-premier',
    name: 'Citi Strata Premier',
    issuer: 'Citi',
    imageUrl: '/cards/citi-premier.png',
    tier: 'moderate',
    annualFee: 95,
    signupBonus: { amount: 60000, spendRequirement: 4000, timeframeDays: 90 },
    rewards: [
      { category: 'travel', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'dining', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'groceries', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'gas', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['3x on restaurants, groceries, gas, air travel & hotels', '$100 annual hotel credit', 'Transfer to American Airlines & other partners', 'No foreign transaction fees'],
    cons: ['$95 annual fee', 'Hotel credit requires $500+ booking']
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    imageUrl: '/cards/chase-freedom-flex.png',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'rotating', rewardRate: 5, rewardType: 'points', pointValue: 2, cap: 1500, isRotating: true },
      { category: 'travel', rewardRate: 5, rewardType: 'points', pointValue: 2 }, // via Chase Travel
      { category: 'dining', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 } // drugstores also 3%
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['5% rotating categories (quarterly)', '5% on Chase Travel bookings', '3% on dining & drugstores', 'Cell phone protection up to $800', 'DashPass membership included'],
    cons: ['Must activate categories quarterly', '3% foreign transaction fee', '5% quarterly cap of $1,500']
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
    pros: ['Cashback Match DOUBLES all rewards first year', 'No foreign transaction fees', 'Easy approval for fair credit', '0% intro APR for 15 months', 'Free FICO score'],
    cons: ['Must activate categories quarterly', 'Not accepted everywhere (no Costco)', '$1,500 quarterly cap on 5%']
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred from Amex',
    issuer: 'American Express',
    imageUrl: '/cards/amex-blue-cash-preferred.png',
    tier: 'moderate',
    annualFee: 95,
    signupBonus: { amount: 250, spendRequirement: 3000, timeframeDays: 180 },
    rewards: [
      { category: 'groceries', rewardRate: 6, rewardType: 'cashback', cap: 6000 },
      { category: 'online-shopping', rewardRate: 6, rewardType: 'cashback' }, // streaming
      { category: 'gas', rewardRate: 3, rewardType: 'cashback' },
      { category: 'travel', rewardRate: 3, rewardType: 'cashback' }, // transit
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['6% on groceries (up to $6k/year)', '6% on streaming services', '3% on gas & transit', '$84 Disney Bundle credit', '$0 annual fee first year'],
    cons: ['$95 annual fee after year 1', 'Groceries excludes Walmart/Target/Costco', '2.7% foreign transaction fee']
  },
  {
    id: 'amex-green',
    name: 'American Express Green',
    issuer: 'American Express',
    imageUrl: '/cards/amex-green.png',
    tier: 'moderate',
    annualFee: 150,
    signupBonus: { amount: 40000, spendRequirement: 3000, timeframeDays: 180 },
    rewards: [
      { category: 'travel', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'dining', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['3x on travel, transit, and dining', '$189 CLEAR Plus credit', 'Transfer to airline/hotel partners', 'No foreign transaction fees'],
    cons: ['$150 annual fee', 'Lower earning than Gold card']
  },
  {
    id: 'capital-one-savor-one',
    name: 'Capital One SavorOne',
    issuer: 'Capital One',
    imageUrl: '/cards/capital-one-savor-one.png',
    tier: 'moderate',
    annualFee: 39,
    rewards: [
      { category: 'dining', rewardRate: 3, rewardType: 'cashback' },
      { category: 'online-shopping', rewardRate: 3, rewardType: 'cashback' }, // entertainment
      { category: 'groceries', rewardRate: 3, rewardType: 'cashback' },
      { category: 'travel', rewardRate: 5, rewardType: 'cashback' }, // via Capital One Travel
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'fair',
    foreignTransactionFee: false,
    pros: ['3% on dining, groceries, streaming, entertainment', '8% via Capital One Entertainment', '5% via Capital One Travel', 'No foreign transaction fees', 'Good for fair credit'],
    cons: ['$39 annual fee', 'No welcome bonus']
  },
  {
    id: 'citi-custom-cash',
    name: 'Citi Custom Cash Card',
    issuer: 'Citi',
    imageUrl: '/cards/citi-custom-cash.png',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 1500, timeframeDays: 180 },
    rewards: [
      { category: 'dining', rewardRate: 5, rewardType: 'cashback', cap: 500 },
      { category: 'groceries', rewardRate: 5, rewardType: 'cashback', cap: 500 },
      { category: 'gas', rewardRate: 5, rewardType: 'cashback', cap: 500 },
      { category: 'travel', rewardRate: 5, rewardType: 'cashback', cap: 500 },
      { category: 'online-shopping', rewardRate: 5, rewardType: 'cashback', cap: 500 },
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    isAutoHighestCategory: true, // Only ONE category earns 5% - whichever you spend most in
    pros: ['5% on your TOP spending category automatically each month', 'No need to choose categories', '4% via Citi Travel portal', '0% intro APR for 15 months'],
    cons: ['$500 monthly cap on 5% category', '3% foreign transaction fee', 'Only 1 category earns 5%']
  },
  {
    id: 'capital-one-venture',
    name: 'Capital One Venture Rewards',
    issuer: 'Capital One',
    imageUrl: '/cards/capital-one-venture.png',
    tier: 'moderate',
    annualFee: 95,
    signupBonus: { amount: 75000, spendRequirement: 4000, timeframeDays: 90 },
    rewards: [
      { category: 'travel', rewardRate: 5, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 2, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['2x miles on everything', '5x on hotels/rentals via Capital One Travel', '75,000 mile bonus', 'Global Entry/TSA PreCheck credit', 'No foreign transaction fees'],
    cons: ['$95 annual fee', 'Transfer partners less valuable than Chase/Amex']
  },
  {
    id: 'marriott-bonvoy-boundless',
    name: 'Marriott Bonvoy Boundless',
    issuer: 'Chase',
    imageUrl: '/cards/marriott-bonvoy-boundless.png',
    tier: 'moderate',
    annualFee: 95,
    signupBonus: { amount: 85000, spendRequirement: 3000, timeframeDays: 90 },
    rewards: [
      { category: 'travel', rewardRate: 6, rewardType: 'points', pointValue: 1 },
      { category: 'groceries', rewardRate: 3, rewardType: 'points', cap: 6000, pointValue: 1 },
      { category: 'gas', rewardRate: 3, rewardType: 'points', cap: 6000, pointValue: 1 },
      { category: 'dining', rewardRate: 3, rewardType: 'points', cap: 6000, pointValue: 1 },
      { category: 'all', rewardRate: 2, rewardType: 'points', pointValue: 1 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['Up to 17x at Marriott hotels', 'Free Night Award annually (up to 35K points)', 'Silver Elite status', '3x on groceries, gas & dining', 'No foreign transaction fees'],
    cons: ['$95 annual fee', 'Best for frequent Marriott guests', 'Subject to Chase 5/24 rule']
  },

  // ============================================
  // AGGRESSIVE TIER - High-reward specialized cards
  // ============================================
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    imageUrl: '/cards/amex-gold.png',
    tier: 'aggressive',
    annualFee: 325,
    signupBonus: { amount: 100000, spendRequirement: 6000, timeframeDays: 180 },
    rewards: [
      { category: 'dining', rewardRate: 4, rewardType: 'points', pointValue: 2 },
      { category: 'groceries', rewardRate: 4, rewardType: 'points', pointValue: 2, cap: 25000 },
      { category: 'travel', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['4x on dining (up to $50k/year) & groceries (up to $25k/year)', '$120 Uber Cash annually', '$120 dining credit (Grubhub, Cheesecake Factory, etc.)', '$100 Resy credit', '$84 Dunkin credit', 'Transfer to 17+ airline/hotel partners'],
    cons: ['$325 annual fee', 'Charge card (must pay in full)', 'Groceries excludes Walmart/Target', 'Dining category capped at $50k/year starting 2025']
  },
  {
    id: 'amex-platinum',
    name: 'American Express Platinum',
    issuer: 'American Express',
    imageUrl: '/cards/amex-platinum.png',
    tier: 'aggressive',
    annualFee: 695,
    signupBonus: { amount: 80000, spendRequirement: 8000, timeframeDays: 180 },
    rewards: [
      { category: 'travel', rewardRate: 5, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['5x on flights booked direct or via Amex Travel', '$200 Uber Cash annually', '$200 airline fee credit', '$100 Saks credit', 'Centurion Lounge access', 'Hilton/Marriott Gold status', 'Transfer to 17+ partners'],
    cons: ['$695 annual fee', 'Limited bonus categories', 'Charge card (pay in full)']
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    imageUrl: '/cards/capital-one-venture-x.png',
    tier: 'aggressive',
    annualFee: 395,
    signupBonus: { amount: 75000, spendRequirement: 4000, timeframeDays: 90 },
    rewards: [
      { category: 'travel', rewardRate: 10, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 2, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'excellent',
    foreignTransactionFee: false,
    pros: ['2x miles on everything', '10x on hotels/rentals via Capital One Travel', '$300 annual travel credit', '10,000 anniversary miles', 'Capital One Lounge access', 'Priority Pass lounges'],
    cons: ['$395 annual fee', 'Requires excellent credit']
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    imageUrl: '/cards/chase-sapphire-preferred.png',
    tier: 'aggressive',
    annualFee: 95,
    signupBonus: { amount: 75000, spendRequirement: 5000, timeframeDays: 90 },
    rewards: [
      { category: 'travel', rewardRate: 5, rewardType: 'points', pointValue: 2 },
      { category: 'dining', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'online-shopping', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'groceries', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['75,000 point bonus worth $750+ in travel', '5x on Chase Travel, 3x dining/streaming/groceries', '$50 annual hotel credit', 'Transfer to airline/hotel partners', 'No foreign transaction fees'],
    cons: ['$95 annual fee', 'Points less valuable than Reserve for redemption']
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    imageUrl: '/cards/chase-sapphire-reserve.png',
    tier: 'aggressive',
    annualFee: 550,
    signupBonus: { amount: 60000, spendRequirement: 4000, timeframeDays: 90 },
    rewards: [
      { category: 'travel', rewardRate: 10, rewardType: 'points', pointValue: 2 },
      { category: 'dining', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'excellent',
    foreignTransactionFee: false,
    pros: ['10x on Chase Travel, 3x dining', '$300 annual travel credit', 'Priority Pass lounge access', 'Chase Sapphire Lounge access', 'Transfer to airline/hotel partners'],
    cons: ['$550 annual fee', 'Requires excellent credit']
  },
  {
    id: 'capital-one-savor',
    name: 'Capital One Savor',
    issuer: 'Capital One',
    imageUrl: '/cards/capital-one-savor.png',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'dining', rewardRate: 4, rewardType: 'cashback' },
      { category: 'online-shopping', rewardRate: 4, rewardType: 'cashback' }, // entertainment
      { category: 'groceries', rewardRate: 3, rewardType: 'cashback' },
      { category: 'travel', rewardRate: 5, rewardType: 'cashback' }, // via Capital One Travel
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: false,
    pros: ['4% on dining & entertainment', '3% on groceries', '8% via Capital One Entertainment', '5% via Capital One Travel', 'No foreign transaction fees', 'No annual fee'],
    cons: ['Groceries excludes superstores']
  },
  {
    id: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    imageUrl: '/cards/chase-freedom-unlimited.png',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 300, spendRequirement: 500, timeframeDays: 90 },
    rewards: [
      { category: 'travel', rewardRate: 5, rewardType: 'points', pointValue: 2 }, // via Chase Travel
      { category: 'dining', rewardRate: 3, rewardType: 'points', pointValue: 2 },
      { category: 'all', rewardRate: 1.5, rewardType: 'points', pointValue: 2 }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    pros: ['1.5% on everything (best flat-rate for points)', '5% on Chase Travel bookings', '3% on dining & drugstores', 'Points worth 2x with Sapphire Reserve', 'DashPass membership', '0% intro APR for 15 months', '$300 bonus after $500 spend'],
    cons: ['Best value requires Sapphire Preferred/Reserve', '3% foreign transaction fee']
  },
  {
    id: 'us-bank-cash-plus',
    name: 'U.S. Bank Cash+ Visa Signature',
    issuer: 'U.S. Bank',
    imageUrl: '/cards/us-bank-cash-plus.png',
    tier: 'moderate',
    annualFee: 0,
    signupBonus: { amount: 200, spendRequirement: 1000, timeframeDays: 90 },
    rewards: [
      // User selects 2 categories for 5% from: utilities, cell phone, TV/streaming, fast food, gyms, etc.
      // User selects 1 category for 2% from: gas, groceries, restaurants, etc.
      { category: 'gas', rewardRate: 2, rewardType: 'cashback' },
      { category: 'groceries', rewardRate: 2, rewardType: 'cashback' },
      { category: 'dining', rewardRate: 2, rewardType: 'cashback' },
      { category: 'travel', rewardRate: 5, rewardType: 'cashback' }, // via Rewards Center
      { category: 'all', rewardRate: 1, rewardType: 'cashback' }
    ],
    minCreditScore: 'good',
    foreignTransactionFee: true,
    isSelectableCategories: true,
    pros: ['5% on 2 categories YOU choose (utilities, streaming, cell phone, fast food, gyms, etc.)', '2% on 1 category (gas, groceries, or restaurants)', '5% on prepaid travel via Rewards Center', 'No annual fee'],
    cons: ['$2,000 combined quarterly cap on 5%', 'Must select categories each quarter', '5% categories are niche (not standard spending)', 'Excludes Walmart/Target/Costco']
  },
  {
    id: 'amex-blue-cash-everyday',
    name: 'Blue Cash Everyday from Amex',
    issuer: 'American Express',
    imageUrl: '/cards/amex-blue-cash-everyday.png',
    tier: 'basic',
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
    pros: ['3% on groceries (up to $6k/year), gas & online shopping', 'No annual fee', '$200 bonus after $2k spend', '0% intro APR for 15 months', 'Amex Offers discounts'],
    cons: ['Lower rates than Blue Cash Preferred', '2.7% foreign transaction fee', 'Groceries excludes Walmart/Target/Costco']
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
