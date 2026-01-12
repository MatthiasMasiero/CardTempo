'use client';

import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import {
  CreditCard as CreditCardIcon,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { CardPaymentPlan } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/calculator';

interface PaymentTimelineProps {
  plan: CardPaymentPlan;
}

export function PaymentTimeline({ plan }: PaymentTimelineProps) {
  const { card, payments, currentUtilization, newUtilization, utilizationStatus } = plan;
  const [imageError, setImageError] = useState(false);

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'overlimit':
        return 'border-l-red-600';
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-amber-500';
      case 'good':
        return 'border-l-emerald-500';
      default:
        return 'border-l-stone-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overlimit':
        return { label: 'Over Limit', variant: 'destructive' as const };
      case 'high':
        return { label: 'High Utilization', variant: 'destructive' as const };
      case 'medium':
        return { label: 'Medium Utilization', variant: 'secondary' as const };
      case 'good':
        return { label: 'Optimal', variant: 'default' as const };
      default:
        return { label: 'Unknown', variant: 'secondary' as const };
    }
  };

  const statusBadge = getStatusBadge(utilizationStatus);

  return (
    <Card className={`border-l-4 ${getStatusBorderColor(utilizationStatus)} border-stone-200`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-3">
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
            {card.nickname}
          </CardTitle>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Limit: {formatCurrency(card.creditLimit)} | Balance: {formatCurrency(card.currentBalance)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Utilization Comparison */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Utilization Improvement</span>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                {formatPercentage(currentUtilization - newUtilization)} reduction
              </span>
            </div>
          </div>

          {/* Before */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Current</span>
              <span className="font-medium">{formatPercentage(currentUtilization)}</span>
            </div>
            <Progress
              value={Math.min(currentUtilization, 100)}
              className={`h-2 ${
                currentUtilization > 30 ? 'bg-red-200' : currentUtilization > 10 ? 'bg-yellow-200' : 'bg-green-200'
              }`}
            />
          </div>

          {/* After */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">After Optimization</span>
              <span className="font-medium text-green-600">{formatPercentage(newUtilization)}</span>
            </div>
            <Progress value={Math.min(newUtilization, 100)} className="h-2 bg-green-500" />
          </div>
        </div>

        {/* Important Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border border-stone-200 border-l-4 border-l-amber-400 rounded-lg bg-white">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-stone-500">Statement Date</span>
            </div>
            <p className="font-semibold text-stone-900">{format(plan.nextStatementDate, 'MMM d, yyyy')}</p>
            <p className="text-xs text-stone-500">
              {differenceInDays(plan.nextStatementDate, new Date())} days away
            </p>
          </div>
          <div className="p-3 border border-stone-200 border-l-4 border-l-blue-400 rounded-lg bg-white">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-stone-500">Due Date</span>
            </div>
            <p className="font-semibold text-stone-900">{format(plan.nextDueDate, 'MMM d, yyyy')}</p>
            <p className="text-xs text-stone-500">
              {differenceInDays(plan.nextDueDate, new Date())} days away
            </p>
          </div>
        </div>

        {/* Payment Timeline */}
        <div>
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payment Plan
          </h4>

          {plan.isAlreadyOptimal && payments.length <= 1 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-700">Already Optimized!</p>
                <p className="text-sm text-green-600">
                  Your utilization is already in the optimal range. Just pay by the due date.
                </p>
              </div>
            </div>
          ) : plan.isOverLimit ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-700">Over Credit Limit!</p>
                <p className="text-sm text-red-600">
                  Immediate action required to get under your credit limit.
                </p>
              </div>
            </div>
          ) : null}

          <div className="relative">
            {/* Timeline line */}
            {payments.length > 1 && (
              <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-slate-200" />
            )}

            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div key={index} className="relative flex gap-4">
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      payment.purpose === 'optimization'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {payment.purpose === 'optimization' ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {payment.purpose === 'optimization' ? 'Optimization Payment' : 'Balance Payment'}
                      </span>
                      <Badge
                        variant={payment.purpose === 'optimization' ? 'default' : 'secondary'}
                      >
                        {formatCurrency(payment.amount)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {format(payment.date, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explanation */}
        {plan.needsOptimization && (
          <div className="p-4 bg-white rounded-lg border border-stone-200 border-l-4 border-l-blue-500">
            <p className="text-sm text-stone-700">
              <strong className="text-stone-900">How it works:</strong> This payment will be reported to credit bureaus at{' '}
              <span className="font-semibold text-emerald-600">{formatPercentage(newUtilization)}</span> utilization
              instead of <span className="font-semibold text-stone-600">{formatPercentage(currentUtilization)}</span>.
              Lower reported utilization = higher credit score.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
