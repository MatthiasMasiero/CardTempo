import { createEvents, EventAttributes, DateArray } from 'ics';
import { format } from 'date-fns';

export interface PaymentEvent {
  cardName: string;
  amount: number;
  date: Date;
  type: 'optimization' | 'balance' | 'statement';
  currentBalance?: number;
  newBalance?: number;
  utilization?: number;
  scoreImpact?: string;
}

export interface CalendarPreferences {
  includeStatementDates?: boolean;
  reminderDays?: number;
  eventDuration?: number; // minutes
  timezone?: string;
  recurring?: boolean;
}

/**
 * Generate .ics file content from payment events
 */
export function generateICSFile(
  events: PaymentEvent[],
  preferences: CalendarPreferences = {}
): { error: Error | undefined; value: string | undefined } {
  const {
    includeStatementDates = false,
    reminderDays = 1,
    eventDuration = 30,
  } = preferences;

  const icsEvents: EventAttributes[] = events
    .filter(event => includeStatementDates || event.type !== 'statement')
    .map(event => {
      const startDate = new Date(event.date);
      const endDate = new Date(startDate.getTime() + eventDuration * 60 * 1000);

      // Convert to date array format [year, month, day, hour, minute]
      const start: DateArray = [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ];

      const end: DateArray = [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes(),
      ];

      let title = '';
      let description = '';

      switch (event.type) {
        case 'optimization':
          title = `Pay $${event.amount.toLocaleString()} to ${event.cardName} (Credit Optimization)`;
          description = `Credit Card Payment Reminder\n\n` +
            `Card: ${event.cardName}\n` +
            `Amount to Pay: $${event.amount.toLocaleString()}\n` +
            `Purpose: Reduce reported utilization to optimize credit score\n\n` +
            `Why this timing?\n` +
            `Paying before your statement closes ensures a low balance gets reported to credit bureaus, maximizing your credit score.\n\n` +
            (event.newBalance !== undefined ? `After this payment:\n- New balance: $${event.newBalance.toLocaleString()}\n` : '') +
            (event.utilization !== undefined ? `- Utilization: ${event.utilization.toFixed(1)}%\n` : '') +
            (event.scoreImpact ? `- Estimated score impact: ${event.scoreImpact}\n\n` : '\n') +
            `View your full payment plan: ${typeof window !== 'undefined' ? window.location.origin : 'https://creditoptimizer.com'}/dashboard`;
          break;

        case 'balance':
          title = `Pay $${event.amount.toLocaleString()} to ${event.cardName} (Avoid Interest)`;
          description = `Final Balance Payment\n\n` +
            `Card: ${event.cardName}\n` +
            `Amount to Pay: $${event.amount.toLocaleString()}\n` +
            `Purpose: Pay remaining balance by due date to avoid interest charges\n\n` +
            `This is your due date. Paying the remaining balance ensures:\n` +
            `- Zero interest charges\n` +
            `- Maintains good payment history\n` +
            `- Keeps account in good standing\n\n` +
            `View dashboard: ${typeof window !== 'undefined' ? window.location.origin : 'https://creditoptimizer.com'}/dashboard`;
          break;

        case 'statement':
          title = `Statement Closes - ${event.cardName}`;
          description = `Your balance will be reported to credit bureaus today.\n\n` +
            `Current balance: $${event.currentBalance?.toLocaleString() || 'N/A'}\n` +
            `This is a reference event to help you track your credit reporting dates.`;
          break;
      }

      return {
        start,
        end,
        title,
        description,
        location: 'Online Payment',
        status: 'CONFIRMED' as const,
        busyStatus: 'FREE' as const,
        categories: ['Finance', 'Credit Card Payment'],
        alarms: [
          {
            action: 'display' as const,
            description: 'Payment reminder',
            trigger: { days: reminderDays, before: true },
          },
        ],
      };
    });

  return createEvents(icsEvents) as { error: Error | undefined; value: string | undefined };
}

/**
 * Download .ics file
 */
export function downloadICSFile(icsContent: string, filename: string = 'creditoptimizer-payments.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Add event to Google Calendar (opens in new tab)
 */
export function addToGoogleCalendar(event: PaymentEvent) {
  const baseUrl = 'https://calendar.google.com/calendar/render';

  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min duration

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let title = '';
  let description = '';

  switch (event.type) {
    case 'optimization':
      title = `Pay $${event.amount.toLocaleString()} to ${event.cardName} (Credit Optimization)`;
      description = `Card: ${event.cardName}\nAmount: $${event.amount.toLocaleString()}\nPurpose: Reduce utilization before statement closes\n\nView plan: ${typeof window !== 'undefined' ? window.location.origin : 'https://creditoptimizer.com'}/dashboard`;
      break;
    case 'balance':
      title = `Pay $${event.amount.toLocaleString()} to ${event.cardName} (Avoid Interest)`;
      description = `Final payment to avoid interest charges.\n\nView dashboard: ${typeof window !== 'undefined' ? window.location.origin : 'https://creditoptimizer.com'}/dashboard`;
      break;
    case 'statement':
      title = `Statement Closes - ${event.cardName}`;
      description = `Balance gets reported to credit bureaus today.`;
      break;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: description,
    location: 'Online Payment',
    sf: 'true',
    output: 'xml',
  });

  window.open(`${baseUrl}?${params.toString()}`, '_blank');
}

/**
 * Add event to Outlook Calendar (opens in new tab)
 */
export function addToOutlook(event: PaymentEvent) {
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';

  const startDate = event.date;
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  let title = '';
  let description = '';

  switch (event.type) {
    case 'optimization':
      title = `Pay $${event.amount.toLocaleString()} to ${event.cardName} (Credit Optimization)`;
      description = `Card: ${event.cardName}\nAmount: $${event.amount.toLocaleString()}\nPurpose: Reduce utilization\n\nView plan: ${typeof window !== 'undefined' ? window.location.origin : 'https://creditoptimizer.com'}/dashboard`;
      break;
    case 'balance':
      title = `Pay $${event.amount.toLocaleString()} to ${event.cardName} (Avoid Interest)`;
      description = `Final payment due.\n\nView dashboard: ${typeof window !== 'undefined' ? window.location.origin : 'https://creditoptimizer.com'}/dashboard`;
      break;
    case 'statement':
      title = `Statement Closes - ${event.cardName}`;
      description = `Balance reported to credit bureaus.`;
      break;
  }

  const params = new URLSearchParams({
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: description,
    location: 'Online Payment',
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  window.open(`${baseUrl}?${params.toString()}`, '_blank');
}

/**
 * Add event to Apple Calendar (triggers download for iOS/macOS)
 */
export function addToAppleCalendar(event: PaymentEvent, preferences: CalendarPreferences = {}) {
  const { error, value } = generateICSFile([event], preferences);

  if (error || !value) {
    console.error('Failed to generate ICS file:', error);
    return;
  }

  // Create blob and download
  const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // On iOS/macOS, this will open the Calendar app
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.cardName.replace(/\s+/g, '-')}-payment.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for filename
 */
export function getCalendarFilename(prefix: string = 'creditoptimizer-payments'): string {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM');
  return `${prefix}-${dateStr}.ics`;
}
