import {
  calculateCardPaymentPlan,
  calculateOptimization,
  calculateScoreImpact,
  formatCurrency,
  formatPercentage,
} from '../calculator';
import { CreditCard } from '@/types';

describe('Calculator - Payment Plan Generation', () => {
  const baseCard: CreditCard = {
    id: 'test-1',
    nickname: 'Test Card',
    creditLimit: 10000,
    currentBalance: 5000,
    statementDate: 15,
    dueDate: 10,
  };

  describe('calculateCardPaymentPlan', () => {
    test('should calculate payment plan for card with 50% utilization', () => {
      const result = calculateCardPaymentPlan(baseCard, 0.05);

      // Should need optimization
      expect(result.needsOptimization).toBe(true);
      expect(result.isAlreadyOptimal).toBe(false);

      // Current utilization should be 50%
      expect(result.currentUtilization).toBe(50);

      // Target utilization should be 5%
      expect(result.targetUtilization).toBe(5);

      // Should have two payments
      expect(result.payments).toHaveLength(2);

      // First payment should be optimization payment
      expect(result.payments[0].purpose).toBe('optimization');
      expect(result.payments[0].amount).toBeCloseTo(4500); // $5000 - $500 (5% of $10000)

      // Second payment should be balance payment
      expect(result.payments[1].purpose).toBe('balance');
      expect(result.payments[1].amount).toBeCloseTo(500);
    });

    test('should handle card already at optimal utilization', () => {
      const optimalCard: CreditCard = {
        ...baseCard,
        currentBalance: 400, // 4% utilization
      };

      const result = calculateCardPaymentPlan(optimalCard, 0.05);

      expect(result.needsOptimization).toBe(false);
      expect(result.isAlreadyOptimal).toBe(true);

      // Should have one payment (due date payment)
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].purpose).toBe('balance');
      expect(result.payments[0].amount).toBe(400);
    });

    test('should handle card with zero balance', () => {
      const zeroCard: CreditCard = {
        ...baseCard,
        currentBalance: 0,
      };

      const result = calculateCardPaymentPlan(zeroCard, 0.05);

      expect(result.needsOptimization).toBe(false);
      expect(result.currentUtilization).toBe(0);
      expect(result.payments).toHaveLength(0); // No payments needed
    });

    test('should handle card over credit limit', () => {
      const overLimitCard: CreditCard = {
        ...baseCard,
        currentBalance: 12000, // 120% utilization
      };

      const result = calculateCardPaymentPlan(overLimitCard, 0.05);

      expect(result.isOverLimit).toBe(true);
      expect(result.needsOptimization).toBe(true);

      // Should have urgent payment
      expect(result.payments.length).toBeGreaterThan(0);
      expect(result.payments[0].description).toContain('URGENT');
    });

    test('should calculate correct dates', () => {
      const result = calculateCardPaymentPlan(baseCard, 0.05);

      // Next statement date should be in the future
      expect(result.nextStatementDate.getTime()).toBeGreaterThan(Date.now());

      // Next due date should be after statement date
      expect(result.nextDueDate.getTime()).toBeGreaterThan(result.nextStatementDate.getTime());
    });

    test('should handle different target utilization rates', () => {
      const result10 = calculateCardPaymentPlan(baseCard, 0.10); // 10%
      const result5 = calculateCardPaymentPlan(baseCard, 0.05); // 5%

      // Lower target should require larger optimization payment
      expect(result5.payments[0].amount).toBeGreaterThan(result10.payments[0].amount);
    });

    test('should calculate utilization status correctly', () => {
      const goodCard: CreditCard = { ...baseCard, currentBalance: 500 }; // 5%
      const mediumCard: CreditCard = { ...baseCard, currentBalance: 2000 }; // 20%
      const highCard: CreditCard = { ...baseCard, currentBalance: 4000 }; // 40%
      const overCard: CreditCard = { ...baseCard, currentBalance: 11000 }; // 110%

      expect(calculateCardPaymentPlan(goodCard, 0.05).utilizationStatus).toBe('good');
      expect(calculateCardPaymentPlan(mediumCard, 0.05).utilizationStatus).toBe('medium');
      expect(calculateCardPaymentPlan(highCard, 0.05).utilizationStatus).toBe('high');
      expect(calculateCardPaymentPlan(overCard, 0.05).utilizationStatus).toBe('overlimit');
    });
  });
});

describe('Calculator - Multiple Cards Optimization', () => {
  const cards: CreditCard[] = [
    {
      id: '1',
      nickname: 'Chase Sapphire',
      creditLimit: 10000,
      currentBalance: 5000,
      statementDate: 15,
      dueDate: 10,
    },
    {
      id: '2',
      nickname: 'Amex Platinum',
      creditLimit: 15000,
      currentBalance: 9000,
      statementDate: 20,
      dueDate: 15,
    },
    {
      id: '3',
      nickname: 'Capital One Venture',
      creditLimit: 8000,
      currentBalance: 1000,
      statementDate: 5,
      dueDate: 1,
    },
  ];

  describe('calculateOptimization', () => {
    test('should calculate optimization for multiple cards', () => {
      const result = calculateOptimization(cards, 0.05);

      expect(result.cards).toHaveLength(3);
      expect(result.totalCreditLimit).toBe(33000);
      expect(result.totalCurrentBalance).toBe(15000);
    });

    test('should calculate current overall utilization correctly', () => {
      const result = calculateOptimization(cards, 0.05);

      // (15000 / 33000) * 100 = 45.45%
      expect(result.currentOverallUtilization).toBeCloseTo(45.45, 1);
    });

    test('should calculate optimized utilization correctly', () => {
      const result = calculateOptimization(cards, 0.05);

      // After optimization, each card should be at ~5% or already optimal
      expect(result.optimizedOverallUtilization).toBeLessThan(result.currentOverallUtilization);
      expect(result.optimizedOverallUtilization).toBeCloseTo(5, 0);
    });

    test('should calculate utilization improvement', () => {
      const result = calculateOptimization(cards, 0.05);

      expect(result.utilizationImprovement).toBeGreaterThan(0);
      expect(result.utilizationImprovement).toBeCloseTo(
        result.currentOverallUtilization - result.optimizedOverallUtilization,
        1
      );
    });

    test('should estimate score impact', () => {
      const result = calculateOptimization(cards, 0.05);

      expect(result.estimatedScoreImpact.min).toBeGreaterThan(0);
      expect(result.estimatedScoreImpact.max).toBeGreaterThan(result.estimatedScoreImpact.min);
    });

    test('should sort cards by utilization (highest first)', () => {
      const result = calculateOptimization(cards, 0.05);

      // First card should have highest utilization
      // Amex: 60%, Chase: 50%, Capital One: 12.5%
      expect(result.cards[0].card.nickname).toBe('Amex Platinum');
      expect(result.cards[1].card.nickname).toBe('Chase Sapphire');
      expect(result.cards[2].card.nickname).toBe('Capital One Venture');
    });

    test('should handle empty card array', () => {
      const result = calculateOptimization([], 0.05);

      expect(result.cards).toHaveLength(0);
      expect(result.totalCreditLimit).toBe(0);
      expect(result.totalCurrentBalance).toBe(0);
      expect(result.currentOverallUtilization).toBe(0);
    });

    test('should handle single card', () => {
      const result = calculateOptimization([cards[0]], 0.05);

      expect(result.cards).toHaveLength(1);
      expect(result.totalCreditLimit).toBe(10000);
      expect(result.totalCurrentBalance).toBe(5000);
    });
  });
});

describe('Calculator - Score Impact Calculation', () => {
  describe('calculateScoreImpact', () => {
    test('should calculate positive impact for utilization decrease', () => {
      const impact = calculateScoreImpact(40, 60); // 40% drop from 60% utilization

      expect(impact.min).toBeGreaterThan(0);
      expect(impact.max).toBeGreaterThan(impact.min);
      // More conservative estimates now (40% drop from 60% = ~44-72 points)
      expect(impact.min).toBeGreaterThanOrEqual(40);
      expect(impact.max).toBeLessThanOrEqual(80);
    });

    test('should calculate larger impact for larger improvements', () => {
      const smallImprovement = calculateScoreImpact(10);
      const largeImprovement = calculateScoreImpact(40);

      expect(largeImprovement.min).toBeGreaterThan(smallImprovement.min);
      expect(largeImprovement.max).toBeGreaterThan(smallImprovement.max);
    });

    test('should return zero impact for no change', () => {
      const impact = calculateScoreImpact(0);

      expect(impact.min).toBe(0);
      expect(impact.max).toBe(0);
    });

    test('should calculate negative impact for utilization increase', () => {
      const impact = calculateScoreImpact(-20); // 20% worse

      expect(impact.min).toBeLessThan(0);
      expect(impact.max).toBeLessThan(0);
      expect(impact.max).toBeGreaterThan(impact.min); // max is less negative
    });

    test('should have tiered impact ranges', () => {
      const small = calculateScoreImpact(5, 50); // 5% improvement from 50%
      const medium = calculateScoreImpact(15, 50); // 15% improvement from 50%
      const large = calculateScoreImpact(25, 50); // 25% improvement from 50%
      const huge = calculateScoreImpact(45, 80); // 45% improvement from 80%

      // Each tier should have higher impact
      expect(small.min).toBeLessThan(medium.min);
      expect(medium.min).toBeLessThan(large.min);
      expect(large.min).toBeLessThan(huge.min);
    });

    test('should give bigger gains for higher starting utilization', () => {
      const lowStart = calculateScoreImpact(30, 35); // 30% drop from 35% (medium)
      const highStart = calculateScoreImpact(30, 80); // 30% drop from 80% (high)

      // Same improvement, but high start should have bigger gains
      expect(highStart.min).toBeGreaterThan(lowStart.min);
      expect(highStart.max).toBeGreaterThan(lowStart.max);
    });

    test('should cap extreme improvements appropriately', () => {
      const extreme = calculateScoreImpact(80, 90); // 80% improvement from 90%

      // Should have high impact but capped at 150
      expect(extreme.min).toBeGreaterThan(80);
      expect(extreme.max).toBeLessThanOrEqual(150);
      expect(extreme.max).toBeGreaterThan(extreme.min);
    });
  });
});

describe('Calculator - Utility Functions', () => {
  describe('formatCurrency', () => {
    test('should format whole dollars', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(10000)).toBe('$10,000');
    });

    test('should round to nearest dollar', () => {
      expect(formatCurrency(1000.49)).toBe('$1,000');
      expect(formatCurrency(1000.99)).toBe('$1,001');
    });

    test('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    test('should handle negative numbers', () => {
      expect(formatCurrency(-500)).toBe('-$500');
    });

    test('should add thousands separators', () => {
      expect(formatCurrency(1234567)).toBe('$1,234,567');
    });
  });

  describe('formatPercentage', () => {
    test('should format percentage with default decimal', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(33.33)).toBe('33.3%');
    });

    test('should format with custom decimals', () => {
      expect(formatPercentage(50, 0)).toBe('50%');
      expect(formatPercentage(33.333, 2)).toBe('33.33%');
    });

    test('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });

    test('should handle values over 100', () => {
      expect(formatPercentage(150)).toBe('150.0%');
    });
  });
});

describe('Calculator - Edge Cases', () => {
  test('should handle very small credit limits', () => {
    const card: CreditCard = {
      id: 'test',
      nickname: 'Small Limit',
      creditLimit: 500,
      currentBalance: 250,
      statementDate: 15,
      dueDate: 10,
    };

    const result = calculateCardPaymentPlan(card, 0.05);

    expect(result.needsOptimization).toBe(true);
    expect(result.payments.length).toBeGreaterThan(0);
  });

  test('should handle very large credit limits', () => {
    const card: CreditCard = {
      id: 'test',
      nickname: 'Large Limit',
      creditLimit: 100000,
      currentBalance: 50000,
      statementDate: 15,
      dueDate: 10,
    };

    const result = calculateCardPaymentPlan(card, 0.05);

    expect(result.currentUtilization).toBe(50);
    expect(result.payments[0].amount).toBeCloseTo(45000);
  });

  test('should handle statement date on last day of month', () => {
    const card: CreditCard = {
      id: 'test',
      nickname: 'End of Month',
      creditLimit: 10000,
      currentBalance: 5000,
      statementDate: 31, // Last day
      dueDate: 5,
    };

    const result = calculateCardPaymentPlan(card, 0.05);

    // Should handle month-end dates correctly
    expect(result.nextStatementDate).toBeDefined();
    expect(result.payments).toHaveLength(2);
  });

  test('should handle due date before statement date', () => {
    const card: CreditCard = {
      id: 'test',
      nickname: 'Due Before Statement',
      creditLimit: 10000,
      currentBalance: 5000,
      statementDate: 25,
      dueDate: 5, // Earlier in month
    };

    const result = calculateCardPaymentPlan(card, 0.05);

    // Due date should be in next month after statement
    expect(result.nextDueDate.getTime()).toBeGreaterThan(result.nextStatementDate.getTime());
  });

  test('should handle decimal balances correctly', () => {
    const card: CreditCard = {
      id: 'test',
      nickname: 'Decimal Balance',
      creditLimit: 10000,
      currentBalance: 5432.67,
      statementDate: 15,
      dueDate: 10,
    };

    const result = calculateCardPaymentPlan(card, 0.05);

    // Should handle decimals in calculations
    expect(result.currentUtilization).toBeCloseTo(54.33, 1);
  });
});
