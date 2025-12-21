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
import { ScenarioResult, calculatePaymentAdjustment } from '@/lib/scenarioCalculations';
import { ScenarioAlert } from './ScenarioAlert';
import { DollarSign } from 'lucide-react';

interface PaymentScenarioProps {
  cards: CreditCard[];
  onUpdate: (scenario: ScenarioResult) => void;
  baseline: ScenarioResult | null;
}

export function PaymentScenario({ cards, onUpdate, baseline }: PaymentScenarioProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number>(0);

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  useEffect(() => {
    if (selectedCard) {
      // Default to paying 70% of balance
      const defaultPayment = selectedCard.currentBalance * 0.7;
      setPaymentAmount(defaultPayment);
      setSliderValue(defaultPayment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCardId]);

  useEffect(() => {
    if (selectedCard) {
      const result = calculatePaymentAdjustment(
        cards,
        selectedCardId,
        paymentAmount,
        new Date()
      );
      onUpdate(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCardId, paymentAmount]);

  if (!selectedCard) {
    return <div>No cards available</div>;
  }

  const recommendedPayment = selectedCard.currentBalance * 0.95; // Pay to 5% util
  const minimumPayment = selectedCard.currentBalance * 0.02;

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    setPaymentAmount(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setPaymentAmount(Math.min(value, selectedCard.currentBalance));
    setSliderValue(Math.min(value, selectedCard.currentBalance));
  };

  const currentUtilization = (selectedCard.currentBalance / selectedCard.creditLimit) * 100;
  const newBalance = selectedCard.currentBalance - paymentAmount;
  const newUtilization = (newBalance / selectedCard.creditLimit) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Adjust Payment Amount</CardTitle>
              <CardDescription>
                See how different payment amounts affect your utilization and score
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
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.nickname} - ${card.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} balance
                  </SelectItem>
                ))}
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
              <span className="text-gray-600">Current Utilization:</span>
              <span className="font-semibold">
                {currentUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Minimum Payment:</span>
              <span className="font-semibold text-orange-600">
                ${minimumPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Recommended Payment:</span>
              <span className="font-semibold text-green-600">
                ${recommendedPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Amount Slider */}
          <div className="space-y-4">
            <Label>Payment Amount</Label>
            <div className="space-y-4">
              <Slider
                value={[sliderValue]}
                min={0}
                max={selectedCard.currentBalance}
                step={10}
                onValueChange={handleSliderChange}
                className="w-full"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={paymentAmount.toFixed(2)}
                    onChange={handleInputChange}
                    className="w-full"
                    step="10"
                    min="0"
                    max={selectedCard.currentBalance}
                  />
                </div>
                <button
                  onClick={() => {
                    setPaymentAmount(recommendedPayment);
                    setSliderValue(recommendedPayment);
                  }}
                  className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  Use Recommended
                </button>
              </div>
            </div>
          </div>

          {/* Results Preview */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-blue-900">After This Payment:</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">New Balance:</span>
                <span className="font-semibold text-blue-900">
                  ${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">New Utilization:</span>
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
                <span className="text-blue-700">Utilization Change:</span>
                <span
                  className={`font-semibold ${
                    currentUtilization - newUtilization > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {(currentUtilization - newUtilization).toFixed(1)}% improvement
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setPaymentAmount(minimumPayment);
                setSliderValue(minimumPayment);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Minimum
            </button>
            <button
              onClick={() => {
                const halfBalance = selectedCard.currentBalance * 0.5;
                setPaymentAmount(halfBalance);
                setSliderValue(halfBalance);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              50% Balance
            </button>
            <button
              onClick={() => {
                setPaymentAmount(selectedCard.currentBalance);
                setSliderValue(selectedCard.currentBalance);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Pay in Full
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
            <strong>Payment timing matters!</strong> The balance on your statement closing
            date is what gets reported to credit bureaus, not your payment due date.
          </p>
          <p>
            <strong>Target under 10% utilization</strong> for best credit scores. Even
            better: keep it between 1-9% to show you use credit but don't depend on it.
          </p>
          <p>
            <strong>Two-payment strategy:</strong> Pay most of your balance before the
            statement closes (optimization payment), then pay the remainder by the due date
            (avoid interest).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
