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
import { ScenarioResult, calculatePurchaseImpact } from '@/lib/scenarioCalculations';
import { ShoppingCart, Calendar, AlertCircle } from 'lucide-react';

interface PurchaseScenarioProps {
  cards: CreditCard[];
  onUpdate: (scenario: ScenarioResult) => void;
  baseline: ScenarioResult | null;
}

export function PurchaseScenario({ cards, onUpdate, baseline }: PurchaseScenarioProps) {
  // Use baseline cards if available (after applying a scenario), otherwise use original cards
  const workingCards = baseline ? baseline.cards : cards;

  const [selectedCardId, setSelectedCardId] = useState<string>(workingCards[0]?.id || '');
  const [purchaseAmount, setPurchaseAmount] = useState<number>(500);
  const [sliderValue, setSliderValue] = useState<number>(500);

  const selectedCard = workingCards.find((c) => c.id === selectedCardId);

  useEffect(() => {
    if (selectedCard) {
      const result = calculatePurchaseImpact(
        workingCards,
        selectedCardId,
        purchaseAmount,
        new Date()
      );
      onUpdate(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCardId, purchaseAmount]);

  if (!selectedCard) {
    return <div>No cards available</div>;
  }

  const maxPurchase = selectedCard.creditLimit - selectedCard.currentBalance;
  const currentUtilization = (selectedCard.currentBalance / selectedCard.creditLimit) * 100;
  const newBalance = selectedCard.currentBalance + purchaseAmount;
  const newUtilization = (newBalance / selectedCard.creditLimit) * 100;

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    setPurchaseAmount(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setPurchaseAmount(Math.min(value, maxPurchase));
    setSliderValue(Math.min(value, maxPurchase));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center text-white">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Test Large Purchase</CardTitle>
              <CardDescription>
                See how a big expense affects your utilization and credit score
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
                {workingCards.map((card) => {
                  const available = card.creditLimit - card.currentBalance;
                  return (
                    <SelectItem key={card.id} value={card.id}>
                      {card.nickname} - ${available.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} available
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
              <span className="text-gray-600">Credit Limit:</span>
              <span className="font-semibold">
                ${selectedCard.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available Credit:</span>
              <span className="font-semibold text-green-600">
                ${maxPurchase.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Utilization:</span>
              <span className="font-semibold">
                {currentUtilization.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Purchase Amount Slider */}
          <div className="space-y-4">
            <Label>Purchase Amount</Label>
            <div className="space-y-4">
              <Slider
                value={[sliderValue]}
                min={0}
                max={maxPurchase}
                step={50}
                onValueChange={handleSliderChange}
                className="w-full"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={purchaseAmount.toFixed(2)}
                    onChange={handleInputChange}
                    className="w-full"
                    step="50"
                    min="0"
                    max={maxPurchase}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Preview */}
          <div className="bg-purple-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-purple-900">After This Purchase:</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">New Balance:</span>
                <span className="font-semibold text-purple-900">
                  ${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">New Utilization:</span>
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
                <span className="text-purple-700">Utilization Change:</span>
                <span
                  className={`font-semibold ${
                    newUtilization - currentUtilization > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {(newUtilization - currentUtilization > 0 ? '+' : '')}
                  {(newUtilization - currentUtilization).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">Available Credit Remaining:</span>
                <span className="font-semibold text-purple-900">
                  ${(maxPurchase - purchaseAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                const amount = 500;
                setPurchaseAmount(amount);
                setSliderValue(amount);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              $500
            </button>
            <button
              onClick={() => {
                const amount = 1000;
                setPurchaseAmount(amount);
                setSliderValue(amount);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              $1,000
            </button>
            <button
              onClick={() => {
                const amount = 2000;
                setPurchaseAmount(amount);
                setSliderValue(amount);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              $2,000
            </button>
          </div>

          {/* Warning if over limit */}
          {newBalance > selectedCard.creditLimit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <strong>Over Limit:</strong> This purchase would exceed your credit limit by $
                {(newBalance - selectedCard.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. The transaction will likely be declined.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Purchase Timing Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Time your large purchases wisely!</strong> The balance reported to credit bureaus
            is what&apos;s on your account when your statement closes, not when you make the purchase.
          </p>
          <p>
            <strong>Best strategy for big purchases:</strong> Make the purchase right after your
            statement closes. This gives you ~30 days to pay it down before it&apos;s reported to bureaus.
          </p>
          <p>
            <strong>Utilization impact:</strong> A large purchase can temporarily spike your utilization.
            Keep overall utilization under 30% (ideally under 10%) for the best credit score impact.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-blue-800">
              <strong>Pro Tip:</strong> If you need to make a large purchase, consider splitting it across
              multiple cards to keep individual card utilization low, or request a credit limit increase first.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
