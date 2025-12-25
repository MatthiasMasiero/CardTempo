'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CreditCard } from '@/types';

interface PaymentEvent {
  date: Date;
  cardName: string;
  amount: number;
  type: 'payment' | 'statement' | 'due';
}

interface CalendarViewProps {
  cards: CreditCard[];
}

export function CalendarView({ cards }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate payment events from cards
  const generateEvents = (): PaymentEvent[] => {
    const events: PaymentEvent[] = [];
    const today = new Date();

    cards.forEach((card) => {
      // Statement date event
      const statementDate = new Date(today);
      statementDate.setDate(card.statementDate);
      if (statementDate < today) {
        statementDate.setMonth(statementDate.getMonth() + 1);
      }
      events.push({
        date: statementDate,
        cardName: card.nickname,
        amount: 0,
        type: 'statement',
      });

      // Due date event
      const dueDate = new Date(today);
      dueDate.setDate(card.dueDate);
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      events.push({
        date: dueDate,
        cardName: card.nickname,
        amount: card.minimumPayment || card.currentBalance * 0.02,
        type: 'due',
      });

      // Optimization payment (3 days before statement)
      const optimizationDate = new Date(statementDate);
      optimizationDate.setDate(optimizationDate.getDate() - 3);
      events.push({
        date: optimizationDate,
        cardName: card.nickname,
        amount: card.currentBalance * 0.95, // Pay down to 5%
        type: 'payment',
      });
    });

    return events;
  };

  const events = generateEvents();

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      return (
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear() &&
        event.date.getDate() === day
      );
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-24 bg-slate-50 border border-slate-200" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday =
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`min-h-24 border border-slate-200 p-2 ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.map((event, idx) => (
              <div
                key={idx}
                className={`text-xs p-1 rounded truncate ${
                  event.type === 'payment'
                    ? 'bg-green-100 text-green-800'
                    : event.type === 'statement'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
                title={`${event.cardName} - ${event.type}`}
              >
                {event.type === 'payment' && '💰 '}
                {event.type === 'statement' && '📊 '}
                {event.type === 'due' && '⚠️ '}
                {event.cardName}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <Button variant="outline" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0 border-t border-l border-slate-200">
          {renderCalendar()}
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span>💰 Optimization Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
              <span>📊 Statement Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
              <span>⚠️ Due Date</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
