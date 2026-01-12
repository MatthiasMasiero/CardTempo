'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">CardTempo</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Information You Provide</h3>
                  <p className="text-sm text-muted-foreground">
                    When you use CardTempo, you may provide us with:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Email address (for account creation and notifications)</li>
                    <li>Credit card information (nickname, balance, credit limit, statement dates)</li>
                    <li>Payment preferences and reminder settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Automatically Collected Information</h3>
                  <p className="text-sm text-muted-foreground">
                    We automatically collect certain information when you use our service:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Browser type and version</li>
                    <li>Device information</li>
                    <li>Usage data and analytics</li>
                    <li>IP address and location data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Calculate optimal payment strategies for your credit cards</li>
                  <li>Send payment reminders and notifications</li>
                  <li>Improve and personalize our service</li>
                  <li>Analyze usage patterns and optimize performance</li>
                  <li>Communicate with you about updates and new features</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Data Storage and Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Local Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Your credit card data is stored locally in your browser using localStorage. This data
                    never leaves your device unless you create an account.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Secure Database Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    If you create an account, your data is encrypted and stored securely in our database
                    (powered by Supabase). We use industry-standard security measures to protect your
                    information.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Important Note</h3>
                  <p className="text-sm text-muted-foreground">
                    We DO NOT store or have access to your actual credit card numbers, CVV codes, or any
                    information that could be used to make charges. We only store the information you
                    provide about your cards (nicknames, balances, limits, and dates).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Information Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share
                  your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    <strong>Service Providers:</strong> We use trusted third-party services (Supabase for
                    database, Resend for emails) that help us operate our service
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or to protect our rights
                  </li>
                  <li>
                    <strong>With Your Consent:</strong> When you explicitly authorize us to share your
                    information
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Your Rights and Choices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Access the personal information we hold about you</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                  <li>Object to or restrict certain processing of your data</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  To exercise any of these rights, please visit your account settings or contact us
                  directly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We use cookies and similar tracking technologies to improve your experience. These help
                  us remember your preferences and analyze how you use our service. You can control
                  cookies through your browser settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Children&apos;s Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  CardTempo is not intended for use by individuals under 18 years of age. We do
                  not knowingly collect personal information from children. If you believe we have
                  collected information from a child, please contact us immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any
                  significant changes by posting the new policy on this page and updating the &quot;Last
                  updated&quot; date. We encourage you to review this policy periodically.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
