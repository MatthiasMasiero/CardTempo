'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Utensils,
  ShoppingCart,
  Car,
  Plane,
  Globe,
  ArrowRight,
  Tv,
  Zap,
  Train,
  Smartphone,
  Film,
  Pill,
} from 'lucide-react';
import { SpendingStrategy, SpendingCategory } from '@/types';

interface SpendingStrategyCardProps {
  strategies: SpendingStrategy[];
}

export function SpendingStrategyCard({ strategies }: SpendingStrategyCardProps) {
  const getCategoryIcon = (category: SpendingCategory) => {
    switch (category) {
      case 'dining':
        return <Utensils className="h-4 w-4" />;
      case 'groceries':
        return <ShoppingCart className="h-4 w-4" />;
      case 'gas':
        return <Car className="h-4 w-4" />;
      case 'travel':
        return <Plane className="h-4 w-4" />;
      case 'online-shopping':
        return <Globe className="h-4 w-4" />;
      case 'streaming':
        return <Tv className="h-4 w-4" />;
      case 'utilities':
        return <Zap className="h-4 w-4" />;
      case 'transit':
        return <Train className="h-4 w-4" />;
      case 'phone':
        return <Smartphone className="h-4 w-4" />;
      case 'entertainment':
        return <Film className="h-4 w-4" />;
      case 'drugstores':
        return <Pill className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: SpendingCategory) => {
    const labels: Record<SpendingCategory, string> = {
      'dining': 'Dining',
      'groceries': 'Groceries',
      'gas': 'Gas',
      'travel': 'Travel',
      'online-shopping': 'Online Shopping',
      'streaming': 'Streaming',
      'utilities': 'Utilities',
      'transit': 'Transit',
      'phone': 'Phone',
      'entertainment': 'Entertainment',
      'drugstores': 'Drugstores',
    };
    return labels[category] || category;
  };

  const getRewardBadgeColor = (rate: number) => {
    if (rate >= 4) return 'bg-green-100 text-green-700 border-green-200';
    if (rate >= 2) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Your Spending Strategy
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Use the right card for each category to maximize rewards
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {strategies.map((strategy, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
            >
              {/* Category */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center">
                  {getCategoryIcon(strategy.category)}
                </div>
                <div>
                  <p className="font-medium">{getCategoryLabel(strategy.category)}</p>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />

              {/* Card & Reward */}
              <div className="text-right">
                <p className="text-sm font-medium truncate max-w-[150px]">
                  {strategy.recommendedCard}
                </p>
                <Badge variant="outline" className={`text-xs ${getRewardBadgeColor(strategy.rewardRate)}`}>
                  {strategy.rewardRate}% back
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Pro Tip:</strong> Set up autopay on all cards and use mobile wallet shortcuts to quickly select the right card at checkout.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
