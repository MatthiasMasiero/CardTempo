'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard } from '@/types';
import { ScenarioResult, calculateCardClosure } from '@/lib/scenarioCalculations';
import { XCircle, AlertTriangle } from 'lucide-react';

interface CloseCardScenarioProps {
  cards: CreditCard[];
  onUpdate: (scenario: ScenarioResult) => void;
  baseline: ScenarioResult | null;
}

export function CloseCardScenario({ cards, onUpdate, baseline }: CloseCardScenarioProps) {
  // Use baseline cards if available (after applying a scenario), otherwise use original cards
  const workingCards = baseline ? baseline.cards : cards;

  const [selectedCardId, setSelectedCardId] = useState<string>(workingCards[0]?.id || '');

  const selectedCard = workingCards.find((c) => c.id === selectedCardId);

  useEffect(() => {
    if (selectedCard) {
      const result = calculateCardClosure(workingCards, selectedCardId);
      onUpdate(result);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCardId]);

  if (!selectedCard) {
    return <div>No cards available</div>;
  }

  const hasBalance = selectedCard.currentBalance > 0;

  const currentTotalLimit = workingCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const currentTotalBalance = workingCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const currentUtilization = currentTotalLimit > 0 ? (currentTotalBalance / currentTotalLimit) * 100 : 0;

  const newTotalLimit = currentTotalLimit - selectedCard.creditLimit;
  const newTotalBalance = currentTotalBalance - selectedCard.currentBalance;
  const newUtilization = newTotalLimit > 0 ? (newTotalBalance / newTotalLimit) * 100 : 0;

  const utilizationIncrease = newUtilization - currentUtilization;
  const selectedCardUtilization = (selectedCard.currentBalance / selectedCard.creditLimit) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center text-white">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Close a Credit Card</CardTitle>
              <CardDescription>
                Discover why closing cards usually hurts your credit score
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Card Selection */}
          <div className="space-y-2">
            <Label htmlFor="card-select">Select Card to Close</Label>
            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger id="card-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workingCards.map((card) => {
                  const balance = card.currentBalance;
                  return (
                    <SelectItem key={card.id} value={card.id}>
                      {card.nickname} - ${card.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} limit
                      {balance > 0 ? ` ($${balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} balance)` : ' (paid off)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Cannot Close Warning */}
          {hasBalance && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Cannot Close This Card</h4>
                <p className="text-sm text-red-700">
                  This card has an outstanding balance of ${selectedCard.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                  You must pay off the entire balance before closing the account.
                </p>
              </div>
            </div>
          )}

          {/* Current State */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Card Credit Limit:</span>
              <span className="font-semibold">
                ${selectedCard.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Card Balance:</span>
              <span className={`font-semibold ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
                ${selectedCard.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Card Utilization:</span>
              <span className="font-semibold">
                {selectedCardUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Current Total Credit:</span>
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
          </div>

          {/* Results Preview */}
          <div className={`rounded-lg p-4 space-y-3 ${hasBalance ? 'bg-gray-100 opacity-60' : 'bg-red-50'}`}>
            <h4 className={`font-semibold ${hasBalance ? 'text-gray-700' : 'text-red-900'}`}>
              After Closing This Card:
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={hasBalance ? 'text-gray-600' : 'text-red-700'}>New Total Credit Limit:</span>
                <span className={`font-semibold ${hasBalance ? 'text-gray-800' : 'text-red-900'}`}>
                  ${newTotalLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={hasBalance ? 'text-gray-600' : 'text-red-700'}>Credit Limit Lost:</span>
                <span className={`font-semibold ${hasBalance ? 'text-gray-800' : 'text-red-600'}`}>
                  -${selectedCard.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={hasBalance ? 'text-gray-600' : 'text-red-700'}>New Overall Utilization:</span>
                <span
                  className={`font-semibold ${
                    hasBalance
                      ? 'text-gray-800'
                      : newUtilization < 10
                      ? 'text-green-600'
                      : newUtilization < 30
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {newUtilization > 0 ? `${newUtilization.toFixed(1)}%` : 'N/A (no cards)'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={hasBalance ? 'text-gray-600' : 'text-red-700'}>Utilization Change:</span>
                <span className={`font-semibold ${hasBalance ? 'text-gray-800' : 'text-red-600'}`}>
                  {utilizationIncrease > 0 ? '+' : ''}{utilizationIncrease.toFixed(1)}% {utilizationIncrease > 0 ? 'worse' : 'better'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={hasBalance ? 'text-gray-600' : 'text-red-700'}>Remaining Cards:</span>
                <span className={`font-semibold ${hasBalance ? 'text-gray-800' : 'text-red-900'}`}>
                  {cards.length - 1}
                </span>
              </div>
            </div>
          </div>

          {/* Major Warnings */}
          {!hasBalance && (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <strong>Credit Limit Loss:</strong> Closing this card removes ${selectedCard.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} in available credit,
                  which increases your overall utilization ratio.
                </div>
              </div>

              {cards.indexOf(selectedCard) === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Oldest Card Warning:</strong> This appears to be one of your oldest cards.
                    Closing it may reduce your average account age and hurt your score by an additional 10-20 points.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Why Closing Cards Usually Hurts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Utilization increase:</strong> Closing a card removes its credit limit from your total available
            credit, which automatically increases your utilization ratio even if you don&apos;t change your spending.
          </p>
          <p>
            <strong>Credit history impact:</strong> Closed accounts stay on your credit report for 10 years,
            but eventually fall off, potentially reducing your average account age.
          </p>
          <p>
            <strong>Credit mix reduction:</strong> Having fewer credit accounts can hurt your credit mix,
            which accounts for 10% of your FICO score.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <h4 className="font-semibold text-green-900 mb-2">Better Alternatives:</h4>
            <ul className="space-y-1 text-green-800">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>Keep it open with $0 balance:</strong> Set up a small recurring charge with autopay</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>Product change:</strong> Ask issuer to convert to a no-annual-fee version</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span><strong>Negotiate:</strong> Call and ask for annual fee waiver before closing</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-blue-800">
              <strong>Pro Tip:</strong> Only close cards if you absolutely must (e.g., can&apos;t manage the temptation to overspend,
              or annual fee can&apos;t be waived/converted). The impact on your score usually outweighs the benefits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
