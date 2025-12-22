'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  PaymentEvent,
  CalendarPreferences,
  generateICSFile,
  downloadICSFile,
  addToGoogleCalendar,
  addToOutlook,
  getCalendarFilename,
} from '@/lib/calendarUtils';

interface CalendarExportModalProps {
  open: boolean;
  onClose: () => void;
  events: PaymentEvent[];
}

type CalendarService = 'google' | 'apple' | 'outlook' | 'download';

export function CalendarExportModal({
  open,
  onClose,
  events,
}: CalendarExportModalProps) {
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(
    new Set(events.map((_, i) => i))
  );
  const [includeStatementDates, setIncludeStatementDates] = useState(false);
  const [reminderDays, setReminderDays] = useState('1');
  const [selectedService, setSelectedService] = useState<CalendarService>('download');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleEvent = (index: number) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEvents(newSelected);
  };

  const getSelectedEvents = () => {
    return events.filter((_, i) => selectedEvents.has(i));
  };

  const handleExport = () => {
    const eventsToExport = getSelectedEvents();

    if (eventsToExport.length === 0) {
      setError('Please select at least one event to add to your calendar');
      return;
    }

    const preferences: CalendarPreferences = {
      includeStatementDates,
      reminderDays: parseInt(reminderDays),
      eventDuration: 30,
    };

    try {
      setError(null);

      switch (selectedService) {
        case 'google':
          // For multiple events, we'll download ICS (Google doesn't support bulk add via URL)
          if (eventsToExport.length > 1) {
            const { error: icsError, value } = generateICSFile(eventsToExport, preferences);
            if (icsError || !value) {
              throw new Error('Failed to generate calendar file');
            }
            downloadICSFile(value, getCalendarFilename());
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              onClose();
            }, 2000);
          } else {
            addToGoogleCalendar(eventsToExport[0]);
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              onClose();
            }, 2000);
          }
          break;

        case 'apple':
          const { error: appleError, value: appleValue } = generateICSFile(eventsToExport, preferences);
          if (appleError || !appleValue) {
            throw new Error('Failed to generate calendar file');
          }
          downloadICSFile(appleValue, getCalendarFilename());
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 2000);
          break;

        case 'outlook':
          if (eventsToExport.length > 1) {
            const { error: outlookError, value: outlookValue } = generateICSFile(eventsToExport, preferences);
            if (outlookError || !outlookValue) {
              throw new Error('Failed to generate calendar file');
            }
            downloadICSFile(outlookValue, getCalendarFilename());
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              onClose();
            }, 2000);
          } else {
            addToOutlook(eventsToExport[0]);
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              onClose();
            }, 2000);
          }
          break;

        case 'download':
        default:
          const { error: downloadError, value: downloadValue } = generateICSFile(eventsToExport, preferences);
          if (downloadError || !downloadValue) {
            throw new Error('Failed to generate calendar file');
          }
          downloadICSFile(downloadValue, getCalendarFilename());
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 2000);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export calendar events');
    }
  };

  const optimizationEvents = events.filter(e => e.type === 'optimization');
  const balanceEvents = events.filter(e => e.type === 'balance');
  const statementEvents = events.filter(e => e.type === 'statement');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Add to Calendar
          </DialogTitle>
          <DialogDescription>
            Never miss an optimal payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select events to add:</Label>

            {optimizationEvents.map((event) => {
              const globalIndex = events.indexOf(event);
              return (
                <div key={globalIndex} className="flex items-start space-x-3">
                  <Checkbox
                    id={`event-${globalIndex}`}
                    checked={selectedEvents.has(globalIndex)}
                    onCheckedChange={() => handleToggleEvent(globalIndex)}
                  />
                  <label
                    htmlFor={`event-${globalIndex}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <div className="font-medium text-blue-600">
                      Optimization payment - {event.cardName}
                    </div>
                    <div className="text-gray-600">
                      ${event.amount.toLocaleString()} on {event.date.toLocaleDateString()}
                    </div>
                  </label>
                </div>
              );
            })}

            {balanceEvents.map((event) => {
              const globalIndex = events.indexOf(event);
              return (
                <div key={globalIndex} className="flex items-start space-x-3">
                  <Checkbox
                    id={`event-${globalIndex}`}
                    checked={selectedEvents.has(globalIndex)}
                    onCheckedChange={() => handleToggleEvent(globalIndex)}
                  />
                  <label
                    htmlFor={`event-${globalIndex}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <div className="font-medium text-green-600">
                      Balance payment - {event.cardName}
                    </div>
                    <div className="text-gray-600">
                      ${event.amount.toLocaleString()} on {event.date.toLocaleDateString()}
                    </div>
                  </label>
                </div>
              );
            })}

            {statementEvents.length > 0 && (
              <div className="flex items-start space-x-3 pt-2 border-t">
                <Checkbox
                  id="include-statements"
                  checked={includeStatementDates}
                  onCheckedChange={(checked) => setIncludeStatementDates(checked as boolean)}
                />
                <label htmlFor="include-statements" className="text-sm cursor-pointer flex-1">
                  <div className="font-medium text-gray-600">
                    Statement closing dates (reference only)
                  </div>
                  <div className="text-gray-500 text-xs">
                    {statementEvents.length} event{statementEvents.length > 1 ? 's' : ''}
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Reminder Settings */}
          <div className="space-y-2">
            <Label htmlFor="reminder" className="text-sm font-medium">
              Remind me:
            </Label>
            <Select value={reminderDays} onValueChange={setReminderDays}>
              <SelectTrigger id="reminder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="2">2 days before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calendar Service Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Calendar service:</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedService('google')}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  selectedService === 'google'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">Google Calendar</div>
                <div className="text-xs text-gray-500 mt-1">Opens in new tab</div>
              </button>

              <button
                onClick={() => setSelectedService('apple')}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  selectedService === 'apple'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">Apple Calendar</div>
                <div className="text-xs text-gray-500 mt-1">Download file</div>
              </button>

              <button
                onClick={() => setSelectedService('outlook')}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  selectedService === 'outlook'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">Outlook</div>
                <div className="text-xs text-gray-500 mt-1">Opens in new tab</div>
              </button>

              <button
                onClick={() => setSelectedService('download')}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  selectedService === 'download'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">Download .ics</div>
                <div className="text-xs text-gray-500 mt-1">Universal file</div>
              </button>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="text-sm text-green-800">
                Successfully added to calendar!
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleExport} className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center">
            {selectedService === 'download' && 'The .ics file works with all calendar apps'}
            {selectedService === 'google' && 'Opens Google Calendar in a new tab'}
            {selectedService === 'apple' && 'Opens in Calendar app on iOS/macOS'}
            {selectedService === 'outlook' && 'Opens Outlook Calendar in a new tab'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
