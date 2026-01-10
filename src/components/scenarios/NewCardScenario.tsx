'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { CreditCard } from '@/types';
import { ScenarioResult, calculateNewCard } from '@/lib/scenarioCalculations';
import { CreditCardIcon, AlertTriangle } from 'lucide-react';

interface NewCardScenarioProps {
  cards: CreditCard[];
  onUpdate: (scenario: ScenarioResult) => void;
  baseline: ScenarioResult | null;
}

export function NewCardScenario({ cards, onUpdate, baseline }: NewCardScenarioProps) {
  // Use baseline cards if available (after applying a scenario), otherwise use original cards
  const workingCards = baseline ? baseline.cards : cards;

  const [newCardLimit, setNewCardLimit] = useState<number>(5000);
  const [startingBalance, setStartingBalance] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number>(5000);
  const [balanceSliderValue, setBalanceSliderValue] = useState<number>(0);

  useEffect(() => {
    const result = calculateNewCard(
      workingCards,
      newCardLimit,
      startingBalance,
      true // Include hard inquiry
    );
    onUpdate(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCardLimit, startingBalance]);

  const currentTotalLimit = workingCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const currentTotalBalance = workingCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const currentUtilization = currentTotalLimit > 0 ? (currentTotalBalance / currentTotalLimit) * 100 : 0;

  const newTotalLimit = currentTotalLimit + newCardLimit;
  const newTotalBalance = currentTotalBalance + startingBalance;
  const newUtilization = newTotalLimit > 0 ? (newTotalBalance / newTotalLimit) * 100 : 0;

  const utilizationImprovement = currentUtilization - newUtilization;

  const handleLimitSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    setNewCardLimit(value[0]);
  };

  const handleLimitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setNewCardLimit(Math.max(0, value));
    setSliderValue(Math.max(0, value));
  };

  const handleBalanceSliderChange = (value: number[]) => {
    setBalanceSliderValue(value[0]);
    setStartingBalance(value[0]);
  };

  const handleBalanceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    const clampedValue = Math.min(value, newCardLimit);
    setStartingBalance(clampedValue);
    setBalanceSliderValue(clampedValue);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
              <CreditCardIcon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Add New Credit Card</CardTitle>
              <CardDescription>
                Understand the short and long-term impact of opening a new card
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current State */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Total Credit Limit:</span>
              <span className="font-semibold">
                ${currentTotalLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Total Balance:</span>
              <span className="font-semibold">
                ${currentTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Overall Utilization:</span>
              <span className="font-semibold">
                {currentUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Number of Cards:</span>
              <span className="font-semibold">
                {cards.length}
              </span>
            </div>
          </div>

          {/* New Card Limit Slider */}
          <div className="space-y-4">
            <Label>New Card Credit Limit</Label>
            <div className="space-y-4">
              <Slider
                value={[sliderValue]}
                min={1000}
                max={50000}
                step={500}
                onValueChange={handleLimitSliderChange}
                className="w-full"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={newCardLimit.toFixed(0)}
                    onChange={handleLimitInputChange}
                    className="w-full"
                    step="500"
                    min="1000"
                    max="50000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Starting Balance Slider */}
          <div className="space-y-4">
            <Label>Starting Balance (if using for purchase)</Label>
            <div className="space-y-4">
              <Slider
                value={[balanceSliderValue]}
                min={0}
                max={newCardLimit}
                step={100}
                onValueChange={handleBalanceSliderChange}
                className="w-full"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={startingBalance.toFixed(0)}
                    onChange={handleBalanceInputChange}
                    className="w-full"
                    step="100"
                    min="0"
                    max={newCardLimit}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hard Inquiry Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Hard Inquiry Impact:</strong> Opening a new card triggers a hard inquiry,
              temporarily reducing your score by 5-10 points for up to 12 months.
            </div>
          </div>

          {/* Results Preview */}
          <div className="bg-indigo-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-indigo-900">After Adding New Card:</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">New Total Credit Limit:</span>
                <span className="font-semibold text-indigo-900">
                  ${newTotalLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">New Total Balance:</span>
                <span className="font-semibold text-indigo-900">
                  ${newTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">New Overall Utilization:</span>
                <span
                  className={`font-semibold ${
                    newUtilization < 10
                      ? 'text-green-600'
                      : newUtilization < 30
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {newUtilization.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Utilization Improvement:</span>
                <span className="font-semibold text-green-600">
                  {utilizationImprovement.toFixed(1)}% decrease
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Total Number of Cards:</span>
                <span className="font-semibold text-indigo-900">
                  {cards.length + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setNewCardLimit(3000);
                setSliderValue(3000);
                setStartingBalance(0);
                setBalanceSliderValue(0);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              $3,000 limit
            </button>
            <button
              onClick={() => {
                setNewCardLimit(5000);
                setSliderValue(5000);
                setStartingBalance(0);
                setBalanceSliderValue(0);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              $5,000 limit
            </button>
            <button
              onClick={() => {
                setNewCardLimit(10000);
                setSliderValue(10000);
                setStartingBalance(0);
                setBalanceSliderValue(0);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              $10,000 limit
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Short-Term vs Long-Term Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800">
              <strong>Short-Term (0-6 months):</strong> Hard inquiry drops score by 5-10 points.
              Lower average account age may reduce score by another 5-15 points.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800">
              <strong>Long-Term (6+ months):</strong> Increased available credit lowers utilization,
              potentially boosting score by 20-50+ points. Better credit mix also helps.
            </p>
          </div>
          <p>
            <strong>Best strategy:</strong> Open new cards when you have 6+ months before a major
            credit application (mortgage, car loan). This allows time to recover from hard inquiry.
          </p>
          <p>
            <strong>Credit mix benefit:</strong> Having multiple cards shows lenders you can manage
            diverse credit responsibly, which can improve your score over time.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-blue-800">
              <strong>Pro Tip:</strong> If approved for a lower limit than expected, use the card
              responsibly for 6-12 months, then request a limit increase to maximize utilization benefits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
