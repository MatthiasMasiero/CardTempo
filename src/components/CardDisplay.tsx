'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CreditCard as CreditCardIcon, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { CreditCard, Payment } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/calculator';
import {
  calculateUtilization,
  getUtilizationColor,
  getUtilizationBadge,
  getUtilizationGradient,
} from '@/lib/utilization';
import Image from 'next/image';
import { format } from 'date-fns';

interface CardDisplayProps {
  card: CreditCard;
  onRemove: () => void;
  onEdit?: () => void;
  payments?: Payment[]; // Optional payment schedule for this card
}

export function CardDisplay({ card, onRemove, onEdit, payments }: CardDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const utilization = calculateUtilization(card.currentBalance, card.creditLimit);
  const badge = getUtilizationBadge(utilization);

  return (
    <Card className="relative overflow-hidden transition-all">
      {/* Card Header with gradient based on utilization */}
      <div className={`h-2 ${getUtilizationGradient(utilization)}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-12 rounded-lg bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
              {card.imageUrl && !imageError ? (
                <Image
                  src={card.imageUrl}
                  alt={card.nickname}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                  onError={() => setImageError(true)}
                />
              ) : (
                <CreditCardIcon className="h-7 w-7 text-stone-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{card.nickname}</h3>
              <p className="text-xs text-muted-foreground">
                Statement: {card.statementDate} | Due: {card.dueDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-medium">{formatCurrency(card.currentBalance)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Limit</span>
            <span className="font-medium">{formatCurrency(card.creditLimit)}</span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Utilization</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatPercentage(utilization)}</span>
                <Badge variant={badge.variant} className="text-xs">
                  {badge.label}
                </Badge>
              </div>
            </div>
            <Progress
              value={Math.min(utilization, 100)}
              className={`h-2 ${getUtilizationColor(utilization)}`}
            />
          </div>

          {/* Expand/Collapse Toggle */}
          {payments && payments.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-3 pt-3 border-t border-stone-100 flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide schedule
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View payment schedule
                </>
              )}
            </button>
          )}
        </div>

        {/* Expanded Payment Schedule */}
        {isExpanded && payments && payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-200 space-y-2">
            <p className="text-xs font-medium text-stone-700 mb-2">Upcoming Payments</p>
            {payments.slice(0, 3).map((payment, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                  payment.purpose === 'optimization'
                    ? 'bg-blue-50'
                    : 'bg-emerald-50'
                }`}
              >
                <div>
                  <p className={`text-xs font-medium ${
                    payment.purpose === 'optimization' ? 'text-blue-700' : 'text-emerald-700'
                  }`}>
                    {payment.purpose === 'optimization' ? 'Optimization' : 'Balance'}
                  </p>
                  <p className="text-xs text-stone-500">
                    {format(payment.date, 'MMM d, yyyy')}
                  </p>
                </div>
                <p className={`font-medium ${
                  payment.purpose === 'optimization' ? 'text-blue-700' : 'text-emerald-700'
                }`}>
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
