// Credit Card Types
export interface CreditCard {
  id: string;
  nickname: string;
  creditLimit: number;
  currentBalance: number;
  statementDate: number; // Day of month (1-31)
  dueDate: number; // Day of month (1-31)
  apr?: number;
  imageUrl?: string; // URL to card image (or default if not selected)
  createdAt?: Date;
  updatedAt?: Date;
}

// Payment Plan Types
export interface Payment {
  date: Date;
  amount: number;
  purpose: 'optimization' | 'balance';
  description: string;
}

export interface CardPaymentPlan {
  card: CreditCard;
  currentUtilization: number;
  targetUtilization: number;
  newUtilization: number;
  payments: Payment[];
  nextStatementDate: Date;
  nextDueDate: Date;
  needsOptimization: boolean;
  isOverLimit: boolean;
  isAlreadyOptimal: boolean;
  utilizationStatus: 'good' | 'medium' | 'high' | 'overlimit';
}

export interface OptimizationResult {
  cards: CardPaymentPlan[];
  totalCreditLimit: number;
  totalCurrentBalance: number;
  currentOverallUtilization: number;
  optimizedOverallUtilization: number;
  estimatedScoreImpact: {
    min: number;
    max: number;
  };
  utilizationImprovement: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  targetUtilization: number; // Default 5%
  reminderDaysBefore: number; // Days before payment to remind
  emailNotifications: boolean;
}

// Reminder Types
export interface PaymentReminder {
  id: string;
  userId: string;
  cardId: string;
  reminderDate: Date;
  amount: number;
  purpose: 'optimization' | 'balance';
  status: 'pending' | 'sent' | 'dismissed';
  createdAt: Date;
}

// Form Types
export interface CreditCardFormData {
  nickname: string;
  creditLimit: string;
  currentBalance: string;
  statementDate: string;
  dueDate: string;
  apr?: string;
  imageUrl?: string;
}

// ========== RECOMMENDATION TYPES ==========

// Spending categories for card recommendations
export type SpendingCategory =
  | 'dining'
  | 'groceries'
  | 'gas'
  | 'travel'
  | 'online-shopping'
  | 'streaming'
  | 'utilities'
  | 'transit'
  | 'phone'
  | 'entertainment'
  | 'drugstores';

// Reward tier (simplified classification)
export type RewardTier = 'basic' | 'moderate' | 'aggressive';

// Credit score range for eligibility
export type CreditScoreRange = 'excellent' | 'good' | 'fair' | 'building';

// User's reward type preference
export type RewardPreference = 'cashback' | 'points' | 'either';

// User questionnaire input
export interface RecommendationPreferences {
  simplicityPreference: 'fewer-cards' | 'more-rewards';
  topCategories: SpendingCategory[];
  rewardPreference: RewardPreference;
  creditScoreRange: CreditScoreRange;
  monthlySpending?: {
    [key in SpendingCategory]?: number;
  };
  includeCurrentCards?: boolean;
  currentCards?: CreditCard[];
}

// Reward rate structure for a card
export interface CategoryReward {
  category: SpendingCategory | 'all' | 'rotating';
  rewardRate: number;
  rewardType: 'cashback' | 'points';
  pointValue?: number;
  cap?: number;
  capPeriod?: 'monthly' | 'quarterly' | 'annual'; // How often cap resets
  isRotating?: boolean;
  rotatingCategories?: SpendingCategory[]; // Which categories rotate into this reward
}

// Extended card data for recommendations
export interface RecommendableCard {
  id: string;
  name: string;
  issuer: string;
  imageUrl: string;
  tier: RewardTier;
  annualFee: number;
  rewards: CategoryReward[];
  minCreditScore: CreditScoreRange;
  foreignTransactionFee: boolean;
  pros: string[];
  cons: string[];
  signupBonus?: {
    amount: number;
    spendRequirement: number;
    timeframeDays: number;
  };
  isSelectableCategories?: boolean; // User must manually choose categories (e.g., U.S. Bank Cash+)
  isAutoHighestCategory?: boolean; // Card automatically gives bonus on your highest spending category (e.g., Citi Custom Cash)
}

// Single card recommendation
export interface CardRecommendation {
  card: RecommendableCard;
  matchScore: number;
  primaryUse: SpendingCategory | 'all';
  reasoning: string[];
  estimatedAnnualReward: number;
  applicationOrder: number;
  waitDays: number;
  // First-year value metrics
  signupBonusValue?: number; // Dollar value of signup bonus
  firstYearValue?: number; // Total first-year value (rewards + bonus - fee)
  isSignupBonusAttainable?: boolean; // Can user meet spend requirement?
  signupBonusAttainabilityReason?: string; // Explanation if not attainable
}

// Spending strategy (which card to use for what)
export interface SpendingStrategy {
  category: SpendingCategory;
  recommendedCard: string;
  rewardRate: number;
  reasoning: string;
}

// Full recommendation result
export interface RecommendationResult {
  recommendations: CardRecommendation[];
  spendingStrategy: SpendingStrategy[];
  projectedScoreImpact: {
    shortTerm: number;
    longTerm: number;
  };
  totalEstimatedAnnualReward: number;
  totalAnnualFees: number;
  netAnnualBenefit: number;
  currentCardRecommendations?: CardRecommendation[]; // Matched current cards from user's dashboard
}

// Timeline event for visualization
export interface RecommendationTimelineEvent {
  date: Date;
  type: 'application' | 'bonus-deadline' | 'score-recovery' | 'strategy-start';
  cardName?: string;
  description: string;
  icon: 'card' | 'calendar' | 'trending-up' | 'wallet';
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionTier = 'free' | 'premium';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export type BillingInterval = 'monthly' | 'annual';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  grandfatheredUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Feature flags for each tier
export interface TierFeatures {
  maxCards: number;
  hasWhatIfScenarios: boolean;
  hasPdfExport: boolean;
  hasCalendarExport: boolean;
  hasRecommendations: boolean;
  hasEmailReminders: boolean;
  hasPriorityAllocation: boolean;
  hasAdvancedAnalytics: boolean;
}

// Feature definitions per tier
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  free: {
    maxCards: 2,
    hasWhatIfScenarios: false,
    hasPdfExport: true,  // PDF export available for all users
    hasCalendarExport: false,
    hasRecommendations: false,
    hasEmailReminders: false,
    hasPriorityAllocation: false,
    hasAdvancedAnalytics: false,
  },
  premium: {
    maxCards: Infinity,
    hasWhatIfScenarios: true,
    hasPdfExport: true,
    hasCalendarExport: true,
    hasRecommendations: true,
    hasEmailReminders: true,
    hasPriorityAllocation: true,
    hasAdvancedAnalytics: true,
  },
};

// Subscription plan info for pricing page
export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceMonthly: number;  // in cents
  priceAnnual: number;   // in cents
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  features: string[];
}

// Feature descriptions for UI
export const FEATURE_DESCRIPTIONS: Record<keyof TierFeatures, {
  title: string;
  description: string;
  icon: string;
}> = {
  maxCards: {
    title: 'Unlimited Cards',
    description: 'Track all your credit cards in one place',
    icon: 'credit-card',
  },
  hasWhatIfScenarios: {
    title: 'What-If Scenarios',
    description: 'Test financial decisions before making them',
    icon: 'git-branch',
  },
  hasPdfExport: {
    title: 'PDF Export',
    description: 'Download payment plans as professional PDFs',
    icon: 'file-text',
  },
  hasCalendarExport: {
    title: 'Calendar Sync',
    description: 'Export payment dates to your calendar',
    icon: 'calendar',
  },
  hasRecommendations: {
    title: 'Card Recommendations',
    description: 'Get personalized credit card suggestions',
    icon: 'sparkles',
  },
  hasEmailReminders: {
    title: 'Email Reminders',
    description: 'Never miss a payment with smart reminders',
    icon: 'bell',
  },
  hasPriorityAllocation: {
    title: 'Smart Allocation',
    description: 'Optimize payment distribution across cards',
    icon: 'trending-up',
  },
  hasAdvancedAnalytics: {
    title: 'Advanced Analytics',
    description: 'Deep insights into your credit health',
    icon: 'bar-chart',
  },
};
