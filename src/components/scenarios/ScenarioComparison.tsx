'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScenarioResult, compareScenarios } from '@/lib/scenarioCalculations';
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react';

interface ScenarioComparisonProps {
  baseline: ScenarioResult;
  scenario: ScenarioResult;
  onApply: () => void;
  onReset: () => void;
  showActions?: boolean;
}

export function ScenarioComparison({
  baseline,
  scenario,
  onApply,
  onReset,
  showActions = false,
}: ScenarioComparisonProps) {
  const comparison = compareScenarios(baseline, scenario);
  const isDifferent =
    JSON.stringify(baseline.cards) !== JSON.stringify(scenario.cards);

  const formatChange = (value: number) => {
    if (value === 0) return '0';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };

  const getChangeIcon = (isImprovement: boolean) => {
    if (isImprovement) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getChangeColor = (value: number, invertLogic: boolean = false) => {
    if (value === 0) return 'text-gray-600';
    const isPositive = invertLogic ? value < 0 : value > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          {isDifferent ? (
            <>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span>Scenario Comparison</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Current State</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Metrics Comparison */}
        <div className="space-y-4 mb-6">
          {/* Overall Utilization */}
          <div className="border-b pb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Overall Utilization</span>
              {isDifferent && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(scenario.utilizationChange < 0)}
                </div>
              )}
            </div>
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {scenario.overallUtilization.toFixed(1)}%
                </span>
              </div>
              {isDifferent && (
                <span
                  className={`text-sm font-medium ${getChangeColor(
                    scenario.utilizationChange,
                    true
                  )}`}
                >
                  {formatChange(scenario.utilizationChange)} pts
                </span>
              )}
            </div>
            {!isDifferent && (
              <p className="text-xs text-gray-500 mt-1">
                From {baseline.overallUtilization.toFixed(1)}%
              </p>
            )}
          </div>

          {/* Score Impact */}
          <div className="border-b pb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Est. Score Impact</span>
              {isDifferent &&
                (scenario.scoreChange.min !== 0 ||
                  scenario.scoreChange.max !== 0) && (
                  <div className="flex items-center gap-1">
                    {getChangeIcon(scenario.scoreChange.max > 0)}
                  </div>
                )}
            </div>
            <div className="flex justify-between items-baseline">
              <div>
                <span
                  className={`text-2xl font-bold ${
                    scenario.estimatedScoreImpact.max < 0
                      ? 'text-red-600'
                      : scenario.estimatedScoreImpact.max > 0
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  {scenario.estimatedScoreImpact.max < 0 ? (
                    // For negative impacts, show smaller absolute value first (e.g., "-5 to -15")
                    <>
                      {scenario.estimatedScoreImpact.max} to {scenario.estimatedScoreImpact.min} pts
                    </>
                  ) : scenario.estimatedScoreImpact.max > 0 ? (
                    // For positive impacts, show smaller positive first (e.g., "+5 to +20")
                    <>
                      +{scenario.estimatedScoreImpact.min} to +{scenario.estimatedScoreImpact.max} pts
                    </>
                  ) : (
                    // Zero impact
                    <>0 pts</>
                  )}
                </span>
              </div>
            </div>
            {isDifferent && (
              <p className="text-xs text-gray-500 mt-1">
                {scenario.scoreChange.max > 0
                  ? `Improvement from baseline`
                  : scenario.scoreChange.max < 0
                  ? `Decline from baseline`
                  : 'No change from baseline'}
              </p>
            )}
          </div>

          {/* Cards Over 30% */}
          <div className="border-b pb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Cards Over 30%</span>
              {isDifferent &&
                scenario.metrics.cardsOver30Percent !==
                  baseline.metrics.cardsOver30Percent && (
                  <div className="flex items-center gap-1">
                    {getChangeIcon(
                      scenario.metrics.cardsOver30Percent <
                        baseline.metrics.cardsOver30Percent
                    )}
                  </div>
                )}
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                {scenario.metrics.cardsOver30Percent}
              </span>
              {isDifferent &&
                scenario.metrics.cardsOver30Percent !==
                  baseline.metrics.cardsOver30Percent && (
                  <span
                    className={`text-sm font-medium ${getChangeColor(
                      scenario.metrics.cardsOver30Percent -
                        baseline.metrics.cardsOver30Percent,
                      true
                    )}`}
                  >
                    {formatChange(
                      scenario.metrics.cardsOver30Percent -
                        baseline.metrics.cardsOver30Percent
                    )}
                  </span>
                )}
            </div>
          </div>

          {/* Total Available Credit */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Available Credit</span>
              {isDifferent &&
                scenario.metrics.totalCreditLimit !==
                  baseline.metrics.totalCreditLimit && (
                  <div className="flex items-center gap-1">
                    {getChangeIcon(
                      scenario.metrics.totalCreditLimit >
                        baseline.metrics.totalCreditLimit
                    )}
                  </div>
                )}
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                ${scenario.metrics.totalCreditLimit.toLocaleString()}
              </span>
              {isDifferent &&
                scenario.metrics.totalCreditLimit !==
                  baseline.metrics.totalCreditLimit && (
                  <span
                    className={`text-sm font-medium ${getChangeColor(
                      scenario.metrics.totalCreditLimit -
                        baseline.metrics.totalCreditLimit
                    )}`}
                  >
                    $
                    {(
                      scenario.metrics.totalCreditLimit -
                      baseline.metrics.totalCreditLimit
                    ).toLocaleString()}
                  </span>
                )}
            </div>
          </div>
        </div>

        {/* Improvements & Declines */}
        {isDifferent && (
          <div className="mb-6 space-y-3">
            {comparison.improvements.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Improvements
                </h4>
                <ul className="space-y-1">
                  {comparison.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-xs text-green-700">
                      • {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {comparison.declines.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Concerns
                </h4>
                <ul className="space-y-1">
                  {comparison.declines.map((decline, idx) => (
                    <li key={idx} className="text-xs text-red-700">
                      • {decline}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && isDifferent && (
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={onApply}
              disabled={comparison.netChange === 'negative'}
            >
              {comparison.netChange === 'negative'
                ? 'Not Recommended'
                : 'Apply This Scenario'}
            </Button>
            <Button variant="outline" className="w-full" onClick={onReset}>
              Reset to Baseline
            </Button>
          </div>
        )}

        {!isDifferent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-800">
              This is your current state. Test a scenario to see potential changes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
