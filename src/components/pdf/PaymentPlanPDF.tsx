import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { OptimizationResult } from '@/types';
import { format } from 'date-fns';
import { formatCurrency, formatPercentage } from '@/lib/calculator';

// Register fonts (optional - using default fonts for now)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },

  // Header
  header: {
    marginBottom: 30,
    borderBottom: 3,
    borderBottomColor: '#3b82f6',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  date: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 5,
  },

  // Summary Section
  summarySection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    marginRight: 10,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeft: 3,
  },
  statBoxBlue: {
    borderLeftColor: '#3b82f6',
  },
  statBoxPurple: {
    borderLeftColor: '#8b5cf6',
  },
  statBoxGreen: {
    borderLeftColor: '#10b981',
  },
  statBoxYellow: {
    borderLeftColor: '#f59e0b',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statValueGreen: {
    color: '#059669',
  },

  // Impact Box
  impactBox: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 6,
    borderLeft: 4,
    borderLeftColor: '#10b981',
    marginBottom: 25,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 6,
  },
  impactText: {
    fontSize: 10,
    color: '#047857',
    lineHeight: 1.5,
  },

  // Card Details
  cardSection: {
    marginBottom: 20,
    pageBreakInside: 'avoid',
  },
  cardHeader: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  cardStats: {
    fontSize: 9,
    color: '#3730a3',
  },

  // Payment Timeline
  timeline: {
    marginLeft: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  paymentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 2,
  },
  paymentDotBlue: {
    backgroundColor: '#3b82f6',
  },
  paymentDotGreen: {
    backgroundColor: '#10b981',
  },
  paymentContent: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 3,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 3,
  },
  paymentPurpose: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 9,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  // Tips Section
  tipsSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 10,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 6,
    fontSize: 9,
    color: '#78350f',
  },
  tipBullet: {
    marginRight: 6,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 7,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 4,
  },
});

interface PaymentPlanPDFProps {
  result: OptimizationResult;
  generatedDate: Date;
}

export const PaymentPlanPDF: React.FC<PaymentPlanPDFProps> = ({ result, generatedDate }) => {
  return (
    <Document>
      {/* Page 1: Summary & Overview */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Credit Optimizer</Text>
          <Text style={styles.title}>Your Credit Optimization Payment Plan</Text>
          <Text style={styles.subtitle}>
            Personalized strategy to boost your credit score
          </Text>
          <Text style={styles.date}>
            Generated: {format(generatedDate, 'MMMM d, yyyy')}
          </Text>
        </View>

        {/* Summary Statistics */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, styles.statBoxBlue]}>
              <Text style={styles.statLabel}>TOTAL CREDIT LIMIT</Text>
              <Text style={styles.statValue}>
                {formatCurrency(result.totalCreditLimit)}
              </Text>
            </View>
            <View style={[styles.statBox, styles.statBoxPurple]}>
              <Text style={styles.statLabel}>TOTAL BALANCE</Text>
              <Text style={styles.statValue}>
                {formatCurrency(result.totalCurrentBalance)}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, styles.statBoxGreen]}>
              <Text style={styles.statLabel}>UTILIZATION</Text>
              <Text style={styles.statValue}>
                {formatPercentage(result.currentOverallUtilization)} to {formatPercentage(result.optimizedOverallUtilization)}
              </Text>
            </View>
            <View style={[styles.statBox, styles.statBoxYellow]}>
              <Text style={styles.statLabel}>EST. SCORE IMPACT</Text>
              <Text style={[styles.statValue, styles.statValueGreen]}>
                +{result.estimatedScoreImpact.min} to +{result.estimatedScoreImpact.max} pts
              </Text>
            </View>
          </View>
        </View>

        {/* Impact Summary */}
        <View style={styles.impactBox}>
          <Text style={styles.impactTitle}>
            ✓ Potential Score Improvement: +{result.estimatedScoreImpact.min} to +{result.estimatedScoreImpact.max} points
          </Text>
          <Text style={styles.impactText}>
            By reducing your utilization from {formatPercentage(result.currentOverallUtilization)} to{' '}
            {formatPercentage(result.optimizedOverallUtilization)}, credit bureaus will report a healthier
            credit profile. Interest saved: $0 (you pay in full before due date).
          </Text>
        </View>

        {/* Card Payment Plans */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Card-by-Card Payment Plans</Text>

          {result.cards.map((cardPlan, index) => (
            <View key={index} style={styles.cardSection} wrap={false}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{cardPlan.card.nickname}</Text>
                <Text style={styles.cardStats}>
                  Limit: {formatCurrency(cardPlan.card.creditLimit)} •
                  Balance: {formatCurrency(cardPlan.card.currentBalance)} •
                  Utilization: {formatPercentage(cardPlan.currentUtilization)}
                </Text>
              </View>

              <View style={styles.timeline}>
                {cardPlan.payments.map((payment, pIndex) => (
                  <View key={pIndex} style={styles.paymentRow}>
                    <View
                      style={[
                        styles.paymentDot,
                        payment.purpose === 'optimization'
                          ? styles.paymentDotBlue
                          : styles.paymentDotGreen,
                      ]}
                    />
                    <View style={styles.paymentContent}>
                      <Text style={styles.paymentDate}>
                        {format(payment.date, 'MMMM d, yyyy')}
                      </Text>
                      <Text style={styles.paymentAmount}>
                        {formatCurrency(payment.amount)}
                      </Text>
                      <Text style={styles.paymentPurpose}>
                        {payment.purpose === 'optimization'
                          ? 'Optimization Payment'
                          : 'Balance Payment'}
                      </Text>
                      <Text style={styles.paymentDescription}>
                        {payment.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Next Steps:</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text>Set calendar reminders for each payment date</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text>Schedule payments in advance through your bank&apos;s website</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text>Check your credit score 1-2 weeks after statement dates</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text>Repeat this strategy every billing cycle for best results</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Credit Optimizer | CreditOptimizer.com
          </Text>
          <Text style={styles.disclaimer}>
            Estimated score impacts are based on general credit scoring principles and may vary.
            This is not financial advice. Consult a financial advisor for personalized guidance.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
