'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { RecommendationResult, RecommendationPreferences } from '@/types';
import { RecommendedCardDisplay } from './RecommendedCardDisplay';
import { RecommendationTimeline } from './RecommendationTimeline';
import { SpendingStrategyCard } from './SpendingStrategyCard';
import { generateRecommendationTimeline } from '@/lib/recommendationEngine';

interface RecommendationResultsProps {
  results: RecommendationResult;
  preferences?: RecommendationPreferences;
  onStartOver: () => void;
}

export function RecommendationResults({
  results,
  onStartOver,
}: RecommendationResultsProps) {
  const timelineEvents = generateRecommendationTimeline(results.recommendations);

  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Your Personalized Card Strategy</h2>
          <p className="text-white/80">
            Based on your preferences, we recommend {results.recommendations.length} card{results.recommendations.length > 1 ? 's' : ''}
          </p>
        </div>
        <CardContent className="p-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Cards Recommended */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{results.recommendations.length}</p>
              <p className="text-xs text-muted-foreground">Cards Recommended</p>
            </div>

            {/* Estimated Annual Rewards */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${results.totalEstimatedAnnualReward.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Est. Annual Rewards</p>
            </div>

            {/* Net Benefit */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ${results.netAnnualBenefit.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Net Annual Benefit</p>
            </div>

            {/* Score Impact */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm text-red-500 flex items-center">
                  <TrendingDown className="h-3 w-3" />
                  {results.projectedScoreImpact.shortTerm}
                </span>
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3" />
                  +{results.projectedScoreImpact.longTerm}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Score Impact (short → long)</p>
            </div>
          </div>

          {/* Score Impact Explanation */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
            <p className="text-sm text-gray-700">
              <strong>About Score Impact:</strong> Opening new cards temporarily lowers your score due to hard inquiries.
              After 6+ months, your score typically improves as you have more available credit and lower utilization.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Cards */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Recommended Cards
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {results.recommendations.map((rec) => (
            <RecommendedCardDisplay key={rec.card.id} recommendation={rec} />
          ))}
        </div>
      </div>

      {/* Spending Strategy */}
      {results.spendingStrategy.length > 0 && (
        <SpendingStrategyCard strategies={results.spendingStrategy} />
      )}

      {/* Timeline */}
      <RecommendationTimeline events={timelineEvents} />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button variant="outline" onClick={onStartOver} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Start Over with Different Preferences
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground p-4 border-t">
        <p>
          These recommendations are based on publicly available information and general spending patterns.
          Actual rewards and approval odds may vary. This is not financial advice.
        </p>
      </div>
    </div>
  );
}
