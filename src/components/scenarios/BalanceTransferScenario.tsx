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
import { ScenarioResult, calculateBalanceTransfer } from '@/lib/scenarioCalculations';
import { ArrowRightLeft, Info } from 'lucide-react';

interface BalanceTransferScenarioProps {
  cards: CreditCard[];
  onUpdate: (scenario: ScenarioResult) => void;
  baseline: ScenarioResult | null;
}

export function BalanceTransferScenario({ cards, onUpdate, baseline }: BalanceTransferScenarioProps) {
  // Use baseline cards if available (after applying a scenario), otherwise use original cards
  const workingCards = baseline ? baseline.cards : cards;

  const [fromCardId, setFromCardId] = useState<string>(workingCards[0]?.id || '');
  const [toCardId, setToCardId] = useState<string>(workingCards[1]?.id || workingCards[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferFee, setTransferFee] = useState<number>(3);
  const [sliderValue, setSliderValue] = useState<number>(0);

  const fromCard = workingCards.find((c) => c.id === fromCardId);
  const toCard = workingCards.find((c) => c.id === toCardId);

  useEffect(() => {
    if (fromCard) {
      // Default to transferring 50% of balance
      const defaultTransfer = fromCard.currentBalance * 0.5;
      setTransferAmount(defaultTransfer);
      setSliderValue(defaultTransfer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCardId]);

  useEffect(() => {
    if (fromCard && toCard) {
      const result = calculateBalanceTransfer(
        workingCards,
        fromCardId,
        toCardId,
        transferAmount,
        transferFee
      );
      onUpdate(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCardId, toCardId, transferAmount, transferFee]);

  if (!fromCard || !toCard) {
    return <div>Need at least 2 cards for balance transfer</div>;
  }

  const fee = transferAmount * (transferFee / 100);
  const totalToTransfer = transferAmount + fee;

  const fromCardCurrentUtil = (fromCard.currentBalance / fromCard.creditLimit) * 100;
  const fromCardNewUtil = ((fromCard.currentBalance - transferAmount) / fromCard.creditLimit) * 100;

  const toCardCurrentUtil = (toCard.currentBalance / toCard.creditLimit) * 100;
  const toCardNewUtil = ((toCard.currentBalance + totalToTransfer) / toCard.creditLimit) * 100;

  const toCardAvailableCredit = toCard.creditLimit - toCard.currentBalance;
  const maxTransferAmount = Math.min(
    fromCard.currentBalance,
    (toCardAvailableCredit / (1 + transferFee / 100))
  );

  // Interest savings calculation (20% APR on source card, 0% intro on destination)
  const monthlyInterest = (transferAmount * 0.20) / 12;
  const yearlyInterest = monthlyInterest * 12;
  const netSavings = yearlyInterest - fee;

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    setTransferAmount(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    const clampedValue = Math.min(value, maxTransferAmount);
    setTransferAmount(clampedValue);
    setSliderValue(clampedValue);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setTransferFee(Math.max(0, Math.min(value, 5))); // 0-5%
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-cyan-500 flex items-center justify-center text-white">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Balance Transfer</CardTitle>
              <CardDescription>
                Calculate transfer fees vs interest savings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Card Selection */}
          <div className="space-y-2">
            <Label htmlFor="from-card-select">Transfer FROM (High Interest Card)</Label>
            <Select value={fromCardId} onValueChange={setFromCardId}>
              <SelectTrigger id="from-card-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workingCards.map((card) => {
                  const util = (card.currentBalance / card.creditLimit) * 100;
                  return (
                    <SelectItem key={card.id} value={card.id}>
                      {card.nickname} - ${card.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} balance ({util.toFixed(1)}% util)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* To Card Selection */}
          <div className="space-y-2">
            <Label htmlFor="to-card-select">Transfer TO (0% Intro APR Card)</Label>
            <Select value={toCardId} onValueChange={setToCardId}>
              <SelectTrigger id="to-card-select">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-red-900 text-sm">From: {fromCard.nickname}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-red-700">Balance:</span>
                  <span className="font-semibold">${fromCard.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Limit:</span>
                  <span className="font-semibold">${fromCard.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700">Utilization:</span>
                  <span className="font-semibold">{fromCardCurrentUtil.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <h4 className="font-semibold text-blue-900 text-sm">To: {toCard.nickname}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-700">Balance:</span>
                  <span className="font-semibold">${toCard.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Available:</span>
                  <span className="font-semibold text-green-600">${toCardAvailableCredit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Utilization:</span>
                  <span className="font-semibold">{toCardCurrentUtil.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Amount Slider */}
          <div className="space-y-4">
            <Label>Transfer Amount</Label>
            <div className="space-y-4">
              <Slider
                value={[sliderValue]}
                min={0}
                max={maxTransferAmount}
                step={50}
                onValueChange={handleSliderChange}
                className="w-full"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={transferAmount.toFixed(2)}
                    onChange={handleInputChange}
                    className="w-full"
                    step="50"
                    min="0"
                    max={maxTransferAmount}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Maximum transferable: ${maxTransferAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (based on available credit and fee)
              </div>
            </div>
          </div>

          {/* Transfer Fee Input */}
          <div className="space-y-2">
            <Label htmlFor="fee-input">Transfer Fee Percentage</Label>
            <div className="flex gap-2">
              <Input
                id="fee-input"
                type="number"
                value={transferFee.toFixed(1)}
                onChange={handleFeeChange}
                className="w-32"
                step="0.5"
                min="0"
                max="5"
              />
              <span className="text-sm text-gray-600 flex items-center">
                % (typical: 3-5%)
              </span>
            </div>
          </div>

          {/* Fee and Savings Calculation */}
          <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-yellow-900">Cost vs Savings Analysis:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-700">Transfer Fee ({transferFee}%):</span>
                <span className="font-semibold text-red-600">
                  -${fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Interest Saved (1st year @ 20% APR):</span>
                <span className="font-semibold text-green-600">
                  +${yearlyInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-yellow-200 my-2"></div>
              <div className="flex justify-between">
                <span className="text-yellow-700 font-semibold">Net Benefit (Year 1):</span>
                <span className={`font-bold ${netSavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netSavings > 0 ? '+' : ''}${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Results Preview */}
          <div className="bg-cyan-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-cyan-900">After Transfer:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-cyan-800">{fromCard.nickname}:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-cyan-700">New Balance:</span>
                    <span className="font-semibold">
                      ${(fromCard.currentBalance - transferAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-700">New Utilization:</span>
                    <span
                      className={`font-semibold ${
                        fromCardNewUtil < 10
                          ? 'text-green-600'
                          : fromCardNewUtil < 30
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {fromCardNewUtil.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-700">Change:</span>
                    <span className="font-semibold text-green-600">
                      {(fromCardCurrentUtil - fromCardNewUtil).toFixed(1)}% improvement
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-cyan-800">{toCard.nickname}:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-cyan-700">New Balance:</span>
                    <span className="font-semibold">
                      ${(toCard.currentBalance + totalToTransfer).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-700">New Utilization:</span>
                    <span
                      className={`font-semibold ${
                        toCardNewUtil < 10
                          ? 'text-green-600'
                          : toCardNewUtil < 30
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {toCardNewUtil.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyan-700">Change:</span>
                    <span className={`font-semibold ${toCardNewUtil - toCardCurrentUtil > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {toCardNewUtil - toCardCurrentUtil > 0 ? '+' : ''}{(toCardNewUtil - toCardCurrentUtil).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                const amount = fromCard.currentBalance * 0.25;
                setTransferAmount(Math.min(amount, maxTransferAmount));
                setSliderValue(Math.min(amount, maxTransferAmount));
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              25% Balance
            </button>
            <button
              onClick={() => {
                const amount = fromCard.currentBalance * 0.5;
                setTransferAmount(Math.min(amount, maxTransferAmount));
                setSliderValue(Math.min(amount, maxTransferAmount));
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              50% Balance
            </button>
            <button
              onClick={() => {
                setTransferAmount(maxTransferAmount);
                setSliderValue(maxTransferAmount);
              }}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Maximum
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5" />
            When Balance Transfers Make Sense
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Ideal scenario:</strong> You have high-interest debt and a 0% APR balance transfer
            offer. The interest saved over 12-18 months significantly exceeds the transfer fee.
          </p>
          <p>
            <strong>Watch out for:</strong> The destination card&apos;s utilization shouldn&apos;t exceed 30%
            after the transfer, or it may hurt your credit score despite saving on interest.
          </p>
          <p>
            <strong>Pay it off during 0% period:</strong> Calculate monthly payment needed to pay
            off the balance before the intro rate ends, or you&apos;ll be charged retroactive interest.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <h4 className="font-semibold text-green-900 mb-2">Best Practices:</h4>
            <ul className="space-y-1 text-green-800">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Only transfer if net savings exceeds $200+ after fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Keep destination card utilization under 30% (ideally under 10%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Set up autopay to avoid missing payments and losing 0% APR</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>Don&apos;t close the source card - keep it open with $0 balance</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-blue-800">
              <strong>Pro Tip:</strong> Calculate the monthly payment needed: Transfer Amount ÷ Intro Period Months.
              For a $3,000 transfer with 15 months 0% APR, you need to pay $200/month to avoid interest.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
