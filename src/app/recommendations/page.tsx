'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CreditCard as CreditCardIcon,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { RecommendationQuestionnaire } from '@/components/recommendations/RecommendationQuestionnaire';
import { RecommendationResults } from '@/components/recommendations/RecommendationResults';
import { RecommendationPreferences, RecommendationResult } from '@/types';
import { generateRecommendations } from '@/lib/recommendationEngine';

type PageState = 'questionnaire' | 'results';

export default function RecommendationsPage() {
  const [pageState, setPageState] = useState<PageState>('questionnaire');
  const [, setPreferences] = useState<RecommendationPreferences | null>(null);
  const [results, setResults] = useState<RecommendationResult | null>(null);

  const handleQuestionnaireComplete = (prefs: RecommendationPreferences) => {
    setPreferences(prefs);
    const recommendationResults = generateRecommendations(prefs);
    setResults(recommendationResults);
    setPageState('results');

    // Scroll to top when showing results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartOver = () => {
    setPageState('questionnaire');
    setPreferences(null);
    setResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CreditCardIcon className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Credit Optimizer</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/calculator">
              <Button variant="outline" size="sm">
                Calculator
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/5 via-blue-50 to-purple-50 border-b">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Card Recommendations</h1>
          </div>
          <p className="text-muted-foreground ml-13">
            {pageState === 'questionnaire'
              ? 'Answer a few questions to find the perfect credit cards for your spending habits'
              : 'Your personalized card recommendations based on your preferences'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {pageState === 'questionnaire' && (
          <RecommendationQuestionnaire onComplete={handleQuestionnaireComplete} />
        )}

        {pageState === 'results' && results && (
          <RecommendationResults
            results={results}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 mt-8 border-t bg-white">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            Recommendations are for educational purposes only. Always research cards thoroughly before applying.
          </p>
        </div>
      </footer>
    </div>
  );
}
