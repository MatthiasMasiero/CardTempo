'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  Wallet,
  Clock,
} from 'lucide-react';
import { RecommendationTimelineEvent } from '@/types';

interface RecommendationTimelineProps {
  events: RecommendationTimelineEvent[];
}

export function RecommendationTimeline({ events }: RecommendationTimelineProps) {
  const getEventIcon = (type: RecommendationTimelineEvent['type']) => {
    switch (type) {
      case 'application':
        return <CreditCard className="h-4 w-4" />;
      case 'bonus-deadline':
        return <Calendar className="h-4 w-4" />;
      case 'score-recovery':
        return <TrendingUp className="h-4 w-4" />;
      case 'strategy-start':
        return <Wallet className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: RecommendationTimelineEvent['type']) => {
    switch (type) {
      case 'application':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'bonus-deadline':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'score-recovery':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'strategy-start':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getBadgeVariant = (type: RecommendationTimelineEvent['type']) => {
    switch (type) {
      case 'application':
        return 'default';
      case 'bonus-deadline':
        return 'secondary';
      case 'score-recovery':
        return 'outline';
      case 'strategy-start':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getEventLabel = (type: RecommendationTimelineEvent['type']) => {
    switch (type) {
      case 'application':
        return 'Apply';
      case 'bonus-deadline':
        return 'Bonus Deadline';
      case 'score-recovery':
        return 'Milestone';
      case 'strategy-start':
        return 'Start';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Your Card Journey Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          {events.length > 1 && (
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/50 via-blue-300 to-green-300" />
          )}

          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={index} className="relative flex gap-4">
                {/* Icon circle */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${getEventColor(event.type)}`}
                >
                  {getEventIcon(event.type)}
                </div>

                {/* Event content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={getBadgeVariant(event.type) as 'default' | 'secondary' | 'outline'}>
                      {getEventLabel(event.type)}
                    </Badge>
                    {event.cardName && (
                      <span className="text-sm font-medium text-gray-700">
                        {event.cardName}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-1">
                    {event.description}
                  </p>

                  <p className="text-xs text-gray-500">
                    {format(event.date, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Timeline Legend:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200" />
              <span>Card Application</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200" />
              <span>Bonus Deadline</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200" />
              <span>Score Recovery</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-200" />
              <span>Strategy Start</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
