'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { format } from 'date-fns';
import { useAuthStore } from '@/store/auth-store';
import { useCalculatorStore } from '@/store/calculator-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import {
  CreditCard as CreditCardIcon,
  ArrowLeft,
  Bell,
  Target,
  User,
  Trash2,
  Save,
  CheckCircle2,
  Crown,
  Sparkles,
  Loader2,
  ExternalLink,
  Shield,
  Check,
  Zap,
  Calendar,
  FileText,
  Mail,
  BarChart3,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, updatePreferences, logout } = useAuthStore();
  const { targetUtilization, setTargetUtilization, clearCards } = useCalculatorStore();
  const { subscription, isPremium, isGrandfathered } = useSubscriptionStore();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

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

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
    }
    setIsLoadingPortal(false);
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

  // Premium features list for display
  const premiumFeatures = [
    { icon: CreditCardIcon, label: 'Unlimited cards' },
    { icon: Zap, label: 'What-If scenarios' },
    { icon: FileText, label: 'PDF export' },
    { icon: Calendar, label: 'Calendar export' },
    { icon: Sparkles, label: 'Card recommendations' },
    { icon: Mail, label: 'Email reminders' },
    { icon: BarChart3, label: 'Advanced analytics' },
  ];

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

            {/* Subscription Settings - Premium Design */}
            <Card className="border-stone-200 overflow-hidden">
              {/* Header with gradient for premium users */}
              {isPremium && (
                <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400" />
              )}
              <CardHeader>
                <CardTitle className="font-display text-lg text-stone-900 flex items-center gap-2">
                  <Crown className={`h-5 w-5 ${isPremium ? 'text-emerald-600' : 'text-stone-400'}`} />
                  Subscription
                </CardTitle>
                <CardDescription className="text-stone-600">Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan Display */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-stone-700">Current Plan</Label>
                    <div className="flex items-center gap-2">
                      {isPremium ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-3 py-1">
                            <Crown className="mr-1.5 h-3 w-3" />
                            Premium
                          </Badge>
                          {isGrandfathered && (
                            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                              Early Adopter
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                          Free
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Premium Member View */}
                {isPremium && subscription && !isGrandfathered && (
                  <>
                    <Separator className="bg-stone-200" />

                    {/* Premium benefits mini-list */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-emerald-900">All Premium features unlocked</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {premiumFeatures.slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                            <feature.icon className="h-3.5 w-3.5" />
                            <span>{feature.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Billing details */}
                    <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Billing cycle</span>
                        <span className="text-stone-900 font-medium capitalize">
                          {subscription.billingInterval || 'Monthly'}
                        </span>
                      </div>
                      {subscription.currentPeriodEnd && (
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-600">Next billing date</span>
                          <span className="text-stone-900 font-medium">
                            {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200"
                        >
                          <p className="text-sm text-amber-800 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Premium access until {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full gap-2 border-stone-300 hover:bg-stone-100"
                      onClick={handleManageSubscription}
                      disabled={isLoadingPortal}
                    >
                      {isLoadingPortal ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      Manage Subscription
                    </Button>
                  </>
                )}

                {/* Grandfathered User View */}
                {isGrandfathered && subscription?.grandfatheredUntil && (
                  <>
                    <Separator className="bg-stone-200" />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-display text-blue-900">Early Adopter Benefits</p>
                          <p className="text-sm text-blue-700">Thank you for being an early user!</p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-800 bg-blue-100/50 rounded-lg px-3 py-2">
                        You have complimentary Premium access until{' '}
                        <span className="font-semibold">
                          {format(new Date(subscription.grandfatheredUntil), 'MMMM d, yyyy')}
                        </span>
                      </p>
                    </motion.div>
                  </>
                )}

                {/* Free User Upgrade CTA */}
                {!isPremium && (
                  <>
                    <Separator className="bg-stone-200" />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden p-6 rounded-xl bg-gradient-to-br from-stone-900 to-stone-800"
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                            backgroundSize: '16px 16px',
                          }}
                        />
                      </div>

                      <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Crown className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-display text-lg text-white">Upgrade to Premium</h3>
                            <p className="text-sm text-stone-400">Unlock all features</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-5">
                          {premiumFeatures.map((feature, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-2 text-sm text-stone-300"
                            >
                              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-emerald-400" />
                              </div>
                              <span>{feature.label}</span>
                            </motion.div>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <Link href="/pricing" className="flex-1">
                            <Button className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 rounded-lg">
                              <Sparkles className="mr-2 h-4 w-4" />
                              View Plans
                            </Button>
                          </Link>
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-stone-500">
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            <span>Secure via Stripe</span>
                          </div>
                          <span>Cancel anytime</span>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
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

            {/* Need Help? */}
            <Card className="border-stone-200 bg-stone-50/50">
              <CardHeader>
                <CardTitle className="font-display text-lg text-stone-900 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-stone-500" />
                  Need Help?
                </CardTitle>
                <CardDescription className="text-stone-600">
                  Questions or feedback? We are here to help.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="mailto:cardtempohelp@gmail.com"
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                >
                  <span>cardtempohelp@gmail.com</span>
                </a>
                <p className="text-sm text-stone-500 mt-2">
                  We typically respond within 24-48 hours.
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handleSave}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
              >
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
