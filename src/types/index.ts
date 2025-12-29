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
