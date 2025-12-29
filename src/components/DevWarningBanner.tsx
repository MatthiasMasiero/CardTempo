'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X, Key, Database, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DevWarningBanner() {
  // Hooks must be called unconditionally at the top
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Early return for E2E tests
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      if (
        userAgent.includes('Playwright') ||
        userAgent.includes('HeadlessChrome') ||
        userAgent.includes('compatible; Playwright')
      ) {
        return;
      }
    }

    // Check if running in development
    const isDev = process.env.NODE_ENV === 'development';

    // Check for missing API keys
    const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasResend = !!process.env.RESEND_API_KEY;

    // Check if user has dismissed the warning
    const dismissed = localStorage.getItem('dev-warning-dismissed') === 'true';

    // Show banner if in dev and missing keys and not dismissed
    if (isDev && (!hasSupabase || !hasResend) && !dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('dev-warning-dismissed', 'true');
  };

  // Early return for test environment
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b-4 border-yellow-400 shadow-lg">
      <div className="container mx-auto">
        <Alert className="border-yellow-400 bg-white/90 backdrop-blur-sm">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <AlertTitle className="text-lg font-bold text-yellow-900 mb-3 flex items-center justify-between">
            <span>⚠️ DEVELOPMENT MODE - API Keys Not Configured</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription className="text-yellow-800 space-y-3">
            <p className="font-medium text-base">
              🔒 <strong>SECURITY REMINDER:</strong> Add API keys AFTER deploying to production to prevent bot abuse!
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {/* Supabase */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900 text-sm">Supabase</span>
                </div>
                <p className="text-xs text-blue-700">
                  Database & Authentication
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-2 block">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 block">
                  SUPABASE_SERVICE_ROLE_KEY
                </code>
              </div>

              {/* Resend */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-purple-900 text-sm">Resend</span>
                </div>
                <p className="text-xs text-purple-700">
                  Email Reminders
                </p>
                <code className="text-xs bg-purple-100 px-2 py-1 rounded mt-2 block">
                  RESEND_API_KEY
                </code>
              </div>

              {/* Cron Secret */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-900 text-sm">Security</span>
                </div>
                <p className="text-xs text-green-700">
                  Cron Authentication
                </p>
                <code className="text-xs bg-green-100 px-2 py-1 rounded mt-2 block">
                  CRON_SECRET
                </code>
              </div>
            </div>

            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-3">
              <p className="text-sm font-semibold text-yellow-900 mb-1">
                📋 Deployment Checklist:
              </p>
              <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Deploy app to Vercel (without API keys)</li>
                <li>Set up rate limiting & bot protection</li>
                <li>Add API keys to Vercel environment variables</li>
                <li>Run database migrations in Supabase</li>
                <li>Test email reminders feature</li>
              </ol>
            </div>

            <p className="text-xs text-yellow-700 mt-3">
              See <code className="bg-yellow-100 px-1 rounded">.env.example</code> for required variables.
              This warning only shows in development.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
