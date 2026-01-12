'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CreditCard as CreditCardIcon, Trash2, Edit2 } from 'lucide-react';
import { CreditCard } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/calculator';
import {
  calculateUtilization,
  getUtilizationColor,
  getUtilizationBadge,
  getUtilizationGradient,
} from '@/lib/utilization';
import Image from 'next/image';

interface CardDisplayProps {
  card: CreditCard;
  onRemove: () => void;
  onEdit?: () => void;
}

export function CardDisplay({ card, onRemove, onEdit }: CardDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const utilization = calculateUtilization(card.currentBalance, card.creditLimit);
  const badge = getUtilizationBadge(utilization);

  return (
    <Card className="relative overflow-hidden">
      {/* Card Header with gradient based on utilization */}
      <div className={`h-2 ${getUtilizationGradient(utilization)}`} />
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
              {card.imageUrl && !imageError ? (
                <Image
                  src={card.imageUrl}
                  alt={card.nickname}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                  onError={() => setImageError(true)}
                />
              ) : (
                <CreditCardIcon className="h-6 w-6 text-gray-400" />
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
        </div>
      </CardContent>
    </Card>
  );
}
