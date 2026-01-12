'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard as CreditCardIcon,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Star,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { CardRecommendation } from '@/types';
import { formatCategoryName } from '@/data/recommendable-cards';

interface RecommendedCardDisplayProps {
  recommendation: CardRecommendation;
  isCurrentCard?: boolean;
}

export function RecommendedCardDisplay({ recommendation, isCurrentCard = false }: RecommendedCardDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { card, matchScore, primaryUse, reasoning, estimatedAnnualReward, applicationOrder, waitDays } = recommendation;

  // Match score badge color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  // Application order badge color
  const getOrderColor = (order: number) => {
    switch (order) {
      case 1: return 'bg-primary text-white';
      case 2: return 'bg-blue-500 text-white';
      case 3: return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className={`border-2 hover:shadow-lg transition-shadow overflow-hidden ${isCurrentCard ? 'border-green-300 bg-green-50/30' : ''}`}>
      <CardContent className="p-0">
        {/* Header with order badge */}
        <div className="relative">
          {/* Application Order Badge or Owned Badge */}
          {isCurrentCard ? (
            <div className="absolute top-4 left-4 z-10 px-2 py-1 rounded-full flex items-center gap-1 font-medium text-xs bg-green-600 text-white">
              <CheckCircle2 className="h-3 w-3" />
              Owned
            </div>
          ) : (
            <div className={`absolute top-4 left-4 z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getOrderColor(applicationOrder)}`}>
              #{applicationOrder}
            </div>
          )}

          {/* Match Score Badge */}
          <div className={`absolute top-4 right-4 z-10 px-2 py-1 rounded-full text-xs font-medium border ${isCurrentCard ? 'bg-green-100 text-green-700 border-green-200' : getScoreColor(matchScore)}`}>
            {isCurrentCard ? 'Your card' : `${matchScore}% match`}
          </div>

          {/* Card Image Header */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-6 pt-14 flex justify-center">
            <div className="relative w-48 h-32 rounded-xl bg-white border shadow-md flex items-center justify-center overflow-hidden">
              {card.imageUrl && !imageError ? (
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  sizes="192px"
                  className="object-contain p-2"
                  onError={() => setImageError(true)}
                />
              ) : (
                <CreditCardIcon className="h-16 w-16 text-gray-300" />
              )}
            </div>
          </div>
        </div>

        {/* Card Info */}
        <div className="p-6 space-y-4">
          {/* Name & Issuer */}
          <div>
            <h3 className="font-bold text-lg">{card.name}</h3>
            <p className="text-sm text-muted-foreground">{card.issuer}</p>
          </div>

          {/* Primary Use & Annual Fee */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              Best for: {formatCategoryName(primaryUse)}
            </Badge>
            {card.annualFee === 0 ? (
              <Badge variant="outline" className="text-green-600 border-green-200">
                No Annual Fee
              </Badge>
            ) : (
              <Badge variant="outline">
                ${card.annualFee}/year
              </Badge>
            )}
          </div>

          {/* Estimated Reward */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Est. Annual Reward</span>
              </div>
              <span className="text-xl font-bold text-primary">${estimatedAnnualReward.toLocaleString()}</span>
            </div>
          </div>

          {/* When to Apply */}
          {waitDays > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>Apply after ~{Math.round(waitDays / 30)} months (to protect credit score)</span>
            </div>
          )}

          {/* Selectable Categories Warning */}
          {card.isSelectableCategories && (
            <div className="flex items-center gap-2 text-sm bg-orange-50 border border-orange-200 rounded-lg p-3">
              <span className="text-orange-600 font-medium">⚙️ Note:</span>
              <span className="text-orange-700">You must manually select your bonus categories each quarter</span>
            </div>
          )}

          {/* Expandable Reasoning Section */}
          <div className="border-t pt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors"
            >
              <span>Why this card?</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {expanded && (
              <div className="mt-3 space-y-3">
                {/* Reasons */}
                <ul className="space-y-1">
                  {reasoning.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>

                {/* Pros */}
                {card.pros.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-1">Pros:</p>
                    <ul className="text-xs text-green-600 space-y-0.5">
                      {card.pros.slice(0, 3).map((pro, idx) => (
                        <li key={idx}>+ {pro}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cons */}
                {card.cons.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs font-medium text-red-700 mb-1">Cons:</p>
                    <ul className="text-xs text-red-600 space-y-0.5">
                      {card.cons.map((con, idx) => (
                        <li key={idx}>- {con}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Signup Bonus */}
                {card.signupBonus && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-700 mb-1">Signup Bonus:</p>
                    <p className="text-sm text-blue-600">
                      {card.rewards[0]?.rewardType === 'points'
                        ? `${card.signupBonus.amount.toLocaleString()} points`
                        : `$${card.signupBonus.amount}`}
                      {' '}after spending ${card.signupBonus.spendRequirement.toLocaleString()} in {Math.round(card.signupBonus.timeframeDays / 30)} months
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
