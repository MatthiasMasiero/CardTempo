'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store/auth-store';
import { useCalculatorStore } from '@/store/calculator-store';
import {
  CreditCard as CreditCardIcon,
  ArrowLeft,
  Bell,
  Target,
  User,
  Trash2,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, updatePreferences, logout } = useAuthStore();
  const { targetUtilization, setTargetUtilization, clearCards } = useCalculatorStore();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local state for form
  const [emailNotifications, setEmailNotifications] = useState(
    user?.preferences.emailNotifications ?? true
  );
  const [reminderDays, setReminderDays] = useState(
    user?.preferences.reminderDaysBefore?.toString() ?? '3'
  );
  const [targetUtil, setTargetUtil] = useState(
    ((targetUtilization || 0.05) * 100).toString()
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleSave = () => {
    updatePreferences({
      emailNotifications,
      reminderDaysBefore: parseInt(reminderDays),
    });
    setTargetUtilization(parseFloat(targetUtil) / 100);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = () => {
    clearCards();
    logout();
    router.push('/');
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-body">
        <div className="animate-pulse p-8">
          <div className="h-8 bg-stone-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-stone-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      {/* Header */}
      <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <CreditCardIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-stone-900">CardTempo</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-stone-600 hover:text-stone-900">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-stone-900 mb-2">Settings</h1>
            <p className="text-stone-600">
              Manage your account preferences and notification settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Settings */}
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="font-display text-lg text-stone-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Account
                </CardTitle>
                <CardDescription className="text-stone-600">Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-stone-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-stone-50 border-stone-300"
                  />
                  <p className="text-xs text-stone-500">
                    Contact support to change your email address
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="font-display text-lg text-stone-900 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-stone-600">
                  Configure how and when you receive payment reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-stone-700">Email Notifications</Label>
                    <p className="text-sm text-stone-500">
                      Receive payment reminders via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator className="bg-stone-200" />

                <div className="space-y-2">
                  <Label htmlFor="reminder-days" className="text-stone-700">Reminder Timing</Label>
                  <Select value={reminderDays} onValueChange={setReminderDays}>
                    <SelectTrigger id="reminder-days" className="border-stone-300">
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before payment</SelectItem>
                      <SelectItem value="2">2 days before payment</SelectItem>
                      <SelectItem value="3">3 days before payment</SelectItem>
                      <SelectItem value="5">5 days before payment</SelectItem>
                      <SelectItem value="7">1 week before payment</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-stone-500">
                    When to receive reminders before each payment date
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Settings */}
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="font-display text-lg text-stone-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Optimization Preferences
                </CardTitle>
                <CardDescription className="text-stone-600">
                  Customize your credit optimization strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target-utilization" className="text-stone-700">Target Utilization (%)</Label>
                  <Select value={targetUtil} onValueChange={setTargetUtil}>
                    <SelectTrigger id="target-utilization" className="border-stone-300">
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1% (Minimal)</SelectItem>
                      <SelectItem value="3">3% (Low)</SelectItem>
                      <SelectItem value="5">5% (Recommended)</SelectItem>
                      <SelectItem value="7">7% (Moderate)</SelectItem>
                      <SelectItem value="9">9% (Maximum Optimal)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-stone-500">
                    The ideal utilization rate to target. 1-9% is the optimal range, with 5% being the sweet spot.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center justify-between">
              <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="font-display text-lg text-red-600 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-stone-600">
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your saved credit cards and data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-stone-500">
                  Once you delete your account, all your data will be permanently removed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
