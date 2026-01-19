'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardPaymentPlan } from '@/types';
import { formatCurrency } from '@/lib/calculator';
import { format } from 'date-fns';
import { Bell, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface EmailReminderModalProps {
  cardPlans: CardPaymentPlan[];
  userEmail?: string;
  trigger?: React.ReactNode;
}

export function EmailReminderModal({
  cardPlans,
  userEmail = '',
  trigger,
}: EmailReminderModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(userEmail);
  const [daysBefore, setDaysBefore] = useState('2');
  const [selectedCards, setSelectedCards] = useState<string[]>(
    cardPlans.map((plan) => plan.card.id)
  );
  const [sendTips, setSendTips] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);

  const toggleCard = (cardId: string) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Filter card plans to only include selected cards
      const selectedCardPlans = cardPlans.filter((plan) =>
        selectedCards.includes(plan.card.id)
      );

      const response = await fetch('/api/reminders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          cardPlans: selectedCardPlans,
          daysBefore: parseInt(daysBefore),
          sendTips,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set reminders');
      }

      setSuccess(true);
      setScheduledDates(data.scheduledDates || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set reminders');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError('');
    setScheduledDates([]);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 300); // Reset after modal closes
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Bell className="h-4 w-4" />
            Set Email Reminders
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Payment Reminders
          </DialogTitle>
          <DialogDescription>
            Get notified before your optimal payment dates so you never miss the window
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Reminders Set!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;ll email you at <strong>{email}</strong>
              </p>
              {scheduledDates.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 text-left">
                  <p className="text-sm font-medium mb-2">Scheduled reminders:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {scheduledDates.map((date, i) => (
                      <li key={i}>• {date}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Reminder Timing */}
            <div className="space-y-2">
              <Label htmlFor="days-before">Remind me before payment</Label>
              <Select value={daysBefore} onValueChange={setDaysBefore} disabled={loading}>
                <SelectTrigger id="days-before">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day before</SelectItem>
                  <SelectItem value="2">2 days before</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="5">5 days before</SelectItem>
                  <SelectItem value="7">1 week before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card Selection */}
            <div className="space-y-2">
              <Label>Select cards to set reminders for</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {cardPlans.map((plan) => (
                  <div
                    key={plan.card.id}
                    className="flex items-start space-x-3 p-3 rounded hover:bg-slate-50"
                  >
                    <Checkbox
                      id={`card-${plan.card.id}`}
                      checked={selectedCards.includes(plan.card.id)}
                      onCheckedChange={() => toggleCard(plan.card.id)}
                      disabled={loading}
                    />
                    <div className="flex-1 leading-none">
                      <label
                        htmlFor={`card-${plan.card.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {plan.card.nickname}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.payments.length} payment{plan.payments.length > 1 ? 's' : ''} •{' '}
                        {plan.payments[0] && format(plan.payments[0].date, 'MMM d')}
                        {plan.payments[1] && ` & ${format(plan.payments[1].date, 'MMM d')}`}
                      </p>
                    </div>
                    <div className="text-xs text-right">
                      <span className="font-medium">
                        {formatCurrency(plan.payments.reduce((sum, p) => sum + p.amount, 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {selectedCards.length === 0 && (
                <p className="text-sm text-destructive">Select at least one card</p>
              )}
            </div>

            {/* Monthly Tips Checkbox */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="send-tips"
                checked={sendTips}
                onCheckedChange={(checked) => setSendTips(checked as boolean)}
                disabled={loading}
              />
              <label
                htmlFor="send-tips"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Send me monthly credit optimization tips
              </label>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={loading || selectedCards.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting Reminders...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Set Reminders
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
