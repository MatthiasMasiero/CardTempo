'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { CreditCard, Loader2, CheckCircle2, Mail } from 'lucide-react';

// Detect email provider from email address and return appropriate inbox URL
function getEmailProviderUrl(email: string): { provider: string; url: string } {
  const domain = email.split('@')[1]?.toLowerCase();

  // Common email providers with direct inbox links
  const providers: Record<string, { name: string; url: string }> = {
    'gmail.com': { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' },
    'googlemail.com': { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' },
    'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
    'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
    'live.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
    'yahoo.com': { name: 'Yahoo', url: 'https://mail.yahoo.com/' },
    'icloud.com': { name: 'iCloud', url: 'https://www.icloud.com/mail' },
    'me.com': { name: 'iCloud', url: 'https://www.icloud.com/mail' },
  };

  if (domain && providers[domain]) {
    return { provider: providers[domain].name, url: providers[domain].url };
  }

  // Default: generic mailto link for other providers
  return { provider: 'Email', url: `mailto:${email}` };
}

/**
 * Validates password strength for financial application security
 * Returns error message if invalid, null if valid
 */
function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Password must be at least 12 characters long';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&* etc.)';
  }

  // Check against common weak passwords
  const commonPasswords = [
    'password', '123456', 'qwerty', 'abc123', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'sunshine',
    'princess', 'login', 'admin', 'iloveyou', 'passw0rd'
  ];

  const lowerPassword = password.toLowerCase();
  for (const common of commonPasswords) {
    if (lowerPassword.includes(common)) {
      return 'Password contains common patterns. Please choose a stronger password.';
    }
  }

  return null; // Password is valid
}

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // SECURITY: Enforce strong password requirements for financial application
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const result = await signup(email, password);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.needsConfirmation) {
      // Show confirmation message instead of redirecting
      setConfirmationSent(true);
    } else {
      // Email confirmation disabled - go straight to dashboard
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 bg-[#FAFAF8]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-stone-900">CardTempo</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {confirmationSent ? (
            <Card className="border-stone-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="font-display text-2xl text-stone-900">Check Your Email</CardTitle>
                <CardDescription className="text-base text-stone-600">
                  We sent a confirmation link to <strong className="text-stone-900">{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-sm text-stone-600">
                  Click the link in the email to activate your account.
                  The link will expire in 24 hours.
                </p>
                <div className="pt-2 space-y-3">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      const { url } = getEmailProviderUrl(email);
                      window.open(url, '_blank');
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Open {getEmailProviderUrl(email).provider}
                  </Button>

                  <p className="text-center text-sm text-stone-500">
                    Didn&apos;t receive the email? Check your spam folder.
                  </p>

                  <Button
                    variant="outline"
                    className="w-full border-stone-300 text-stone-700 hover:bg-stone-100"
                    onClick={() => setConfirmationSent(false)}
                  >
                    Try a different email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-stone-200">
                <CardHeader className="text-center">
                  <CardTitle className="font-display text-2xl text-stone-900">Create Your Account</CardTitle>
                  <CardDescription className="text-stone-600">
                    Save your cards and get payment reminders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-stone-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="border-stone-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-stone-700">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="border-stone-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-stone-700">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="border-stone-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>

                    <p className="text-center text-sm text-stone-600">
                      Already have an account?{' '}
                      <Link href="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium">
                        Sign in
                      </Link>
                    </p>
                  </form>

                </CardContent>
              </Card>

              {/* Benefits */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-center text-stone-700">What you get:</h3>
                <div className="grid gap-2">
                  {[
                    'Save all your credit cards securely',
                    'Get email reminders before payment dates',
                    'Track your utilization over time',
                    'Access your dashboard from any device',
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
