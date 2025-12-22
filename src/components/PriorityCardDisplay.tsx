'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PriorityBadge } from './PriorityBadge';
import { CardAllocation, PriorityScore } from '@/lib/priorityRanking';
import { ChevronDown, ChevronUp, Edit, SkipForward } from 'lucide-react';

interface PriorityCardDisplayProps {
  allocation: CardAllocation;
  priorityScore: PriorityScore;
  currentBalance: number;
  creditLimit: number;
  apr: number;
  statementDate: number;
  onAdjustAmount?: (cardId: string) => void;
  onSkipCard?: (cardId: string) => void;
}

export function PriorityCardDisplay({
  allocation,
  priorityScore,
  currentBalance,
  creditLimit,
  apr,
  statementDate,
  onAdjustAmount,
  onSkipCard,
}: PriorityCardDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  const currentUtilization = (currentBalance / creditLimit) * 100;
  const utilizationChange = currentUtilization - allocation.newUtilization;

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <PriorityBadge rank={allocation.priorityRank} />
              <div>
                <h3 className="font-bold text-lg">{allocation.cardName}</h3>
                <p className="text-sm text-muted-foreground">
                  Priority Score: {priorityScore.totalScore}/100
                </p>
              </div>
            </div>
          </div>

          {/* Current Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Current Balance</p>
              <p className="font-semibold">
                ${currentBalance.toLocaleString()} / ${creditLimit.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">{currentUtilization.toFixed(1)}% utilization</p>
            </div>
            <div>
              <p className="text-muted-foreground">APR</p>
              <p className="font-semibold">{apr.toFixed(2)}%</p>
              <p className="text-xs text-gray-600">Statement day {statementDate}</p>
            </div>
          </div>

          {/* Recommended Payment */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Recommended Payment</p>
            <p className="text-2xl font-bold text-primary">${allocation.amount.toLocaleString()}</p>
          </div>

          {/* After Payment Preview */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">After Payment</span>
              <span className="font-medium">
                ${allocation.newBalance.toLocaleString()} ({allocation.newUtilization.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={allocation.newUtilization} className="flex-1" />
              {utilizationChange > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  -{utilizationChange.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Why This Card */}
          <div className="border-t pt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-sm font-medium"
            >
              <span>Why This Card?</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {expanded && (
              <div className="mt-3 space-y-2">
                <ul className="space-y-1">
                  {priorityScore.reasoning.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  <p className="font-medium mb-2">Score Breakdown:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-600">Utilization Impact:</span>
                      <span className="ml-2 font-semibold">
                        {priorityScore.breakdown.utilizationImpact}/40
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">APR Weight:</span>
                      <span className="ml-2 font-semibold">
                        {priorityScore.breakdown.aprWeight}/25
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time Urgency:</span>
                      <span className="ml-2 font-semibold">
                        {priorityScore.breakdown.timeUrgency}/20
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Limit Weight:</span>
                      <span className="ml-2 font-semibold">
                        {priorityScore.breakdown.creditLimitWeight}/15
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(onAdjustAmount || onSkipCard) && (
            <div className="flex gap-2 pt-2">
              {onAdjustAmount && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onAdjustAmount(allocation.cardId)}
                >
                  <Edit className="h-3 w-3" />
                  Adjust Amount
                </Button>
              )}
              {onSkipCard && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => onSkipCard(allocation.cardId)}
                >
                  <SkipForward className="h-3 w-3" />
                  Skip This Card
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
