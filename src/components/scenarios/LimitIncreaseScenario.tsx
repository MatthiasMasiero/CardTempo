'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { CreditCard } from '@/types';
import { ScenarioResult, calculateLimitIncrease } from '@/lib/scenarioCalculations';
import { TrendingUp } from 'lucide-react';

interface LimitIncreaseScenarioProps {
  cards: CreditCard[];
  onUpdate: (scenario: ScenarioResult) => void;
  baseline: ScenarioResult | null;
}

export function LimitIncreaseScenario({ cards, onUpdate, baseline }: LimitIncreaseScenarioProps) {
  // Use baseline cards if available (after applying a scenario), otherwise use original cards
  const workingCards = baseline ? baseline.cards : cards;

  const [selectedCardId, setSelectedCardId] = useState<string>(workingCards[0]?.id || '');
  const [newLimit, setNewLimit] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number>(0);

  const selectedCard = workingCards.find((c) => c.id === selectedCardId);

  useEffect(() => {
    if (selectedCard) {
      // Default to 50% increase
      const defaultIncrease = selectedCard.creditLimit * 1.5;
      setNewLimit(defaultIncrease);
      setSliderValue(defaultIncrease);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCardId]);

  useEffect(() => {
    if (selectedCard) {
      const result = calculateLimitIncrease(
        workingCards,
        selectedCardId,
        newLimit
      );
      onUpdate(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCardId, newLimit]);

  if (!selectedCard) {
    return <div>No cards available</div>;
  }

  const currentUtilization = (selectedCard.currentBalance / selectedCard.creditLimit) * 100;
  const newUtilization = (selectedCard.currentBalance / newLimit) * 100;
  const increaseAmount = newLimit - selectedCard.creditLimit;
  const increasePercent = (increaseAmount / selectedCard.creditLimit) * 100;

  // Common increase amounts
  const increase25 = selectedCard.creditLimit * 1.25;
  const increase50 = selectedCard.creditLimit * 1.5;
  const increase100 = selectedCard.creditLimit * 2;

  const maxLimit = selectedCard.creditLimit * 3; // Allow up to 3x current limit

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    setNewLimit(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || selectedCard.creditLimit;
    const clampedValue = Math.max(selectedCard.currentBalance, Math.min(value, maxLimit));
    setNewLimit(clampedValue);
    setSliderValue(clampedValue);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Request Credit Limit Increase</CardTitle>
              <CardDescription>
                See how a higher credit limit improves your utilization and score
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Card Selection */}
          <div className="space-y-2">
            <Label htmlFor="card-select">Select Card</Label>
            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger id="card-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => {
                  const util = (card.currentBalance / card.creditLimit) * 100;
                  return (
                    <SelectItem key={card.id} value={card.id}>
                      {card.nickname} - ${card.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} limit ({util.toFixed(1)}% util)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Current State */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Balance:</span>
              <span className="font-semibold">
                ${selectedCard.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Credit Limit:</span>
              <span className="font-semibold">
                ${selectedCard.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Utilization:</span>
              <span className="font-semibold">
                {currentUtilization.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* New Limit Slider */}
          <div className="space-y-4">
            <Label>New Credit Limit</Label>
            <div className="space-y-4">
              <Slider
                value={[sliderValue]}
                min={selectedCard.currentBalance}
                max={maxLimit}
                step={100}
                onValueChange={handleSliderChange}
                className="w-full"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={newLimit.toFixed(0)}
                    onChange={handleInputChange}
                    className="w-full"
                    step="100"
                    min={selectedCard.currentBalance}
                    max={maxLimit}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Preview */}
          <div className="bg-green-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-green-900">After Limit Increase:</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">New Credit Limit:</span>
                <span className="font-semibold text-green-900">
                  ${newLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Increase Amount:</span>
                <span className="font-semibold text-green-900">
                  ${increaseAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (+{increasePercent.toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">New Utilization:</span>
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
                <span className="text-green-700">Utilization Improvement:</span>
                <span className="font-semibold text-green-600">
                  {(currentUtilization - newUtilization).toFixed(1)}% decrease
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setNewLimit(increase25);
                setSliderValue(increase25);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              +25%
            </button>
            <button
              onClick={() => {
                setNewLimit(increase50);
                setSliderValue(increase50);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              +50%
            </button>
            <button
              onClick={() => {
                setNewLimit(increase100);
                setSliderValue(increase100);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Double (+100%)
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How This Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Instant utilization improvement!</strong> A credit limit increase lowers your
            utilization ratio without requiring you to pay down balances, which can boost your score.
          </p>
          <p>
            <strong>When to request:</strong> Most issuers allow limit increase requests every 6-12
            months. Best chances: after income increase, perfect payment history, or account age 6+ months.
          </p>
          <p>
            <strong>Hard vs soft inquiry:</strong> Many issuers do soft pulls that won&apos;t hurt your score.
            Call and ask before applying online to ensure it&apos;s a soft inquiry.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-blue-800">
              <strong>Pro Tip:</strong> Request increases on all cards annually to maximize available credit.
              Many issuers approve 10-30% increases automatically without hard inquiries.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
