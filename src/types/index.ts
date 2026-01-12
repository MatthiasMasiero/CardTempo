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
export type SpendingCategory = 'dining' | 'groceries' | 'gas' | 'travel' | 'online-shopping';

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
}

// Reward rate structure for a card
export interface CategoryReward {
  category: SpendingCategory | 'all' | 'rotating';
  rewardRate: number;
  rewardType: 'cashback' | 'points';
  pointValue?: number;
  cap?: number;
  isRotating?: boolean;
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
}

// Timeline event for visualization
export interface RecommendationTimelineEvent {
  date: Date;
  type: 'application' | 'bonus-deadline' | 'score-recovery' | 'strategy-start';
  cardName?: string;
  description: string;
  icon: 'card' | 'calendar' | 'trending-up' | 'wallet';
}
