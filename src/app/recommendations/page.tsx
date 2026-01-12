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
              <Button variant="outline" size="sm" className="gap-2 border-stone-300">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <h1 className="font-display text-3xl text-stone-900">Card Recommendations</h1>
          </div>
          <p className="text-stone-600 ml-13">
            {pageState === 'questionnaire'
              ? 'Answer a few questions to find the perfect credit cards for your spending habits'
              : 'Your personalized card recommendations based on your preferences'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
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
      <footer className="py-8 mt-8 border-t border-stone-200 bg-white">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-stone-500">
            Recommendations are for educational purposes only. Always research cards thoroughly before applying.
          </p>
        </div>
      </footer>
    </div>
  );
}
