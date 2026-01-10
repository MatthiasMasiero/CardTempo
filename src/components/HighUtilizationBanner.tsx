'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface HighUtilizationBannerProps {
  overallUtilization: number;
}

export function HighUtilizationBanner({ overallUtilization }: HighUtilizationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check conditions: utilization > 30%, not dismissed, not test env
    if (typeof window === 'undefined') return;

    const dismissed = localStorage.getItem('highUtilizationBannerDismissed') === 'true';
    if (dismissed) return;

    if (overallUtilization > 30) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [overallUtilization]);

  const handleDismiss = () => {
    localStorage.setItem('highUtilizationBannerDismissed', 'true');
    setIsVisible(false);
  };

  const handleNavigate = () => {
    router.push('/dashboard/priority');
  };

  if (!isVisible) return null;

  return (
    <div className="mb-6">
      <Alert className="bg-red-50 border-red-200 relative">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-900 pr-8">
          Can&apos;t Pay in Full? We Can Help
        </AlertTitle>
        <AlertDescription className="text-red-800">
          <p className="mb-3">
            Your overall credit utilization is <strong>{overallUtilization.toFixed(1)}%</strong>
            {' '}(above the recommended 30% threshold). This could be impacting your credit score.
          </p>
          <p className="mb-4 text-sm">
            Our Smart Payment Allocation tool helps you maximize your credit score
            improvement with whatever budget you have available.
          </p>
          <Button
            variant="destructive"
            onClick={handleNavigate}
            className="gap-2"
          >
            Optimize My Payments →
          </Button>
        </AlertDescription>

        {/* Dismiss button - positioned absolutely in top-right */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-red-600 hover:text-red-800 transition-colors"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}
