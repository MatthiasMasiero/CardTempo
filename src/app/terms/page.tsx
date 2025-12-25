'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Credit Optimizer</span>
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
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  By accessing or using Credit Optimizer ("the Service"), you agree to be bound by these
                  Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the
                  Service. We reserve the right to modify these Terms at any time, and your continued use
                  of the Service constitutes acceptance of any changes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Credit Optimizer is an educational tool that helps users understand and optimize their
                  credit card payment strategies. The Service provides:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Credit utilization calculations and recommendations</li>
                  <li>Payment date optimization based on statement cycles</li>
                  <li>Estimated credit score impact projections</li>
                  <li>Payment reminders and calendar exports</li>
                  <li>What-if scenario analysis tools</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Educational Purpose Only</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">Important Disclaimer:</p>
                  <p className="text-sm text-yellow-700">
                    Credit Optimizer is provided for educational and informational purposes only. It is
                    NOT financial advice, and should not be considered as such.
                  </p>
                </div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                  <li>
                    The Service provides general information about credit management strategies
                  </li>
                  <li>
                    All calculations and projections are estimates based on general credit scoring
                    principles
                  </li>
                  <li>
                    Actual results may vary based on your individual credit profile, credit bureau
                    algorithms, and other factors
                  </li>
                  <li>
                    You should consult with a qualified financial advisor before making significant
                    financial decisions
                  </li>
                  <li>
                    We are not responsible for any financial decisions you make based on information
                    provided by the Service
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. User Accounts and Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  When you create an account, you agree to:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be responsible for all activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Not share your account with others</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  You are solely responsible for the accuracy of the credit card information you enter
                  into the Service. We do not verify this information with your actual credit card
                  issuers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Prohibited Uses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">You agree NOT to:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Use the Service for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Transmit viruses, malware, or other malicious code</li>
                  <li>Scrape, copy, or reverse engineer any part of the Service</li>
                  <li>Use the Service to spam or harass others</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Impersonate another person or entity</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The Service, including all content, features, and functionality, is owned by Credit
                  Optimizer and is protected by copyright, trademark, and other intellectual property
                  laws. You may not copy, modify, distribute, sell, or create derivative works from any
                  part of the Service without our explicit written permission.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-2">Important Legal Notice:</p>
                  <p className="text-sm text-red-700">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, CREDIT OPTIMIZER AND ITS AFFILIATES SHALL NOT
                    BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                    OR ANY LOSS OF PROFITS OR REVENUES.
                  </p>
                </div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                  <li>
                    The Service is provided "AS IS" and "AS AVAILABLE" without any warranties of any kind
                  </li>
                  <li>
                    We do not guarantee that the Service will be uninterrupted, secure, or error-free
                  </li>
                  <li>
                    We are not liable for any damages resulting from your use of or inability to use the
                    Service
                  </li>
                  <li>
                    We are not responsible for any financial losses, credit score changes, or other
                    consequences of following recommendations from the Service
                  </li>
                  <li>
                    You use the Service at your own risk and discretion
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Indemnification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless Credit Optimizer, its officers,
                  directors, employees, and agents from any claims, liabilities, damages, losses, or
                  expenses (including legal fees) arising from:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any third-party rights</li>
                  <li>Any content you submit through the Service</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Third-Party Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The Service may integrate with or link to third-party services (such as calendar
                  applications, email services, etc.). We are not responsible for these third-party
                  services and their use is subject to their own terms and conditions. We do not endorse
                  or make any representations about third-party services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Termination</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We reserve the right to suspend or terminate your access to the Service at any time,
                  for any reason, without notice. Reasons for termination may include:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Violation of these Terms</li>
                  <li>Fraudulent or illegal activity</li>
                  <li>Extended periods of inactivity</li>
                  <li>At our discretion for any other reason</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  You may terminate your account at any time through the account settings page. Upon
                  termination, your right to use the Service will immediately cease.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Governing Law</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with the laws of the United
                  States, without regard to its conflict of law provisions. Any disputes arising from
                  these Terms or your use of the Service shall be resolved in the courts located in the
                  United States.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>12. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We reserve the right to modify these Terms at any time. We will notify users of any
                  material changes by posting the updated Terms on this page and updating the "Last
                  updated" date. Your continued use of the Service after changes are posted constitutes
                  your acceptance of the modified Terms.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-800">
                  <strong>By using Credit Optimizer, you acknowledge that you have read, understood, and
                  agree to be bound by these Terms of Service.</strong>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
