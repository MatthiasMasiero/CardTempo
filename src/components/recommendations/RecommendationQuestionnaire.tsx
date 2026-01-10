'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Target,
  Wallet,
  TrendingUp,
  ShoppingCart,
  Utensils,
  Car,
  Plane,
  Globe,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  RecommendationPreferences,
  SpendingCategory,
  CreditScoreRange,
  RewardPreference,
} from '@/types';

interface RecommendationQuestionnaireProps {
  onComplete: (preferences: RecommendationPreferences) => void;
}

// Category display config
const SPENDING_CATEGORIES: { id: SpendingCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'dining', label: 'Dining', icon: <Utensils className="h-4 w-4" /> },
  { id: 'groceries', label: 'Groceries', icon: <ShoppingCart className="h-4 w-4" /> },
  { id: 'gas', label: 'Gas', icon: <Car className="h-4 w-4" /> },
  { id: 'travel', label: 'Travel', icon: <Plane className="h-4 w-4" /> },
  { id: 'online-shopping', label: 'Online Shopping', icon: <Globe className="h-4 w-4" /> },
];

// Credit score descriptions
const CREDIT_SCORE_OPTIONS: { value: CreditScoreRange; label: string; description: string }[] = [
  { value: 'excellent', label: 'Excellent (750+)', description: 'Top-tier approval odds' },
  { value: 'good', label: 'Good (700-749)', description: 'Most cards available' },
  { value: 'fair', label: 'Fair (650-699)', description: 'Some premium cards may be harder' },
  { value: 'building', label: 'Building (<650)', description: 'Focus on starter cards' },
];

export function RecommendationQuestionnaire({ onComplete }: RecommendationQuestionnaireProps) {
  // Form state
  const [creditScore, setCreditScore] = useState<CreditScoreRange | ''>('');
  const [simplicityPreference, setSimplicityPreference] = useState<'fewer-cards' | 'more-rewards' | ''>('');
  const [selectedCategories, setSelectedCategories] = useState<SpendingCategory[]>([]);
  const [rewardPreference, setRewardPreference] = useState<RewardPreference | ''>('');

  // Validation state
  const [errors, setErrors] = useState<{
    creditScore?: string;
    simplicityPreference?: string;
    categories?: string;
    rewardPreference?: string;
  }>({});

  const handleCategoryToggle = (category: SpendingCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      if (prev.length >= 3) {
        // Replace the oldest selection
        return [...prev.slice(1), category];
      }
      return [...prev, category];
    });
    // Clear error when user makes a selection
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!creditScore) {
      newErrors.creditScore = 'Please select your credit score range';
    }

    if (!simplicityPreference) {
      newErrors.simplicityPreference = 'Please choose your preference';
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = 'Please select at least one spending category';
    }

    if (!rewardPreference) {
      newErrors.rewardPreference = 'Please choose your reward preference';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const preferences: RecommendationPreferences = {
      creditScoreRange: creditScore as CreditScoreRange,
      simplicityPreference: simplicityPreference as 'fewer-cards' | 'more-rewards',
      topCategories: selectedCategories,
      rewardPreference: rewardPreference as RewardPreference,
    };

    onComplete(preferences);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
        <p className="text-muted-foreground">
          Answer a few questions to get personalized card recommendations
        </p>
      </div>

      {/* Question 1: Credit Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">What&apos;s your credit score range?</CardTitle>
              <CardDescription>This helps us show cards you&apos;re likely to be approved for</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select
            value={creditScore}
            onValueChange={(value) => {
              setCreditScore(value as CreditScoreRange);
              if (errors.creditScore) setErrors(prev => ({ ...prev, creditScore: undefined }));
            }}
          >
            <SelectTrigger className={errors.creditScore ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select your credit score range" />
            </SelectTrigger>
            <SelectContent>
              {CREDIT_SCORE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.creditScore && (
            <p className="text-sm text-destructive mt-2">{errors.creditScore}</p>
          )}
        </CardContent>
      </Card>

      {/* Question 2: Simplicity vs Rewards */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">What&apos;s your priority?</CardTitle>
              <CardDescription>Choose between simplicity or maximizing rewards</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            onClick={() => {
              setSimplicityPreference('fewer-cards');
              if (errors.simplicityPreference) setErrors(prev => ({ ...prev, simplicityPreference: undefined }));
            }}
            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
              simplicityPreference === 'fewer-cards'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            } ${errors.simplicityPreference ? 'border-destructive' : ''}`}
          >
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Keep it simple (1-2 cards)</p>
                <p className="text-sm text-muted-foreground">
                  One or two cards that work well for everything. Easy to manage.
                </p>
              </div>
              {simplicityPreference === 'fewer-cards' && (
                <Check className="h-5 w-5 text-primary absolute top-4 right-4" />
              )}
            </div>
          </div>

          <div
            onClick={() => {
              setSimplicityPreference('more-rewards');
              if (errors.simplicityPreference) setErrors(prev => ({ ...prev, simplicityPreference: undefined }));
            }}
            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
              simplicityPreference === 'more-rewards'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            } ${errors.simplicityPreference ? 'border-destructive' : ''}`}
          >
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Maximize rewards (3-4 cards)</p>
                <p className="text-sm text-muted-foreground">
                  Multiple specialized cards to earn more. Worth the extra effort.
                </p>
              </div>
              {simplicityPreference === 'more-rewards' && (
                <Check className="h-5 w-5 text-primary absolute top-4 right-4" />
              )}
            </div>
          </div>
          {errors.simplicityPreference && (
            <p className="text-sm text-destructive">{errors.simplicityPreference}</p>
          )}
        </CardContent>
      </Card>

      {/* Question 3: Spending Categories */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Where do you spend the most?</CardTitle>
              <CardDescription>Select 1-3 categories (we&apos;ll prioritize cards for these)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SPENDING_CATEGORIES.map(category => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`relative p-3 border-2 rounded-lg transition-all flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${errors.categories ? 'border-destructive' : ''}`}
                >
                  <div className={`p-2 rounded-full ${isSelected ? 'bg-primary/20' : 'bg-gray-100'}`}>
                    {category.icon}
                  </div>
                  <span className="text-sm font-medium">{category.label}</span>
                  {isSelected && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                      {selectedCategories.indexOf(category.id) + 1}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
          {selectedCategories.length > 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Selected: {selectedCategories.map(c =>
                SPENDING_CATEGORIES.find(sc => sc.id === c)?.label
              ).join(', ')}
            </p>
          )}
          {errors.categories && (
            <p className="text-sm text-destructive mt-2">{errors.categories}</p>
          )}
        </CardContent>
      </Card>

      {/* Question 4: Reward Type */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Cash back or points?</CardTitle>
              <CardDescription>How do you prefer to earn rewards?</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => {
                setRewardPreference('cashback');
                if (errors.rewardPreference) setErrors(prev => ({ ...prev, rewardPreference: undefined }));
              }}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                rewardPreference === 'cashback'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              } ${errors.rewardPreference ? 'border-destructive' : ''}`}
            >
              <p className="font-medium">Cash Back</p>
              <p className="text-xs text-muted-foreground">Simple & straightforward</p>
            </div>

            <div
              onClick={() => {
                setRewardPreference('points');
                if (errors.rewardPreference) setErrors(prev => ({ ...prev, rewardPreference: undefined }));
              }}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                rewardPreference === 'points'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              } ${errors.rewardPreference ? 'border-destructive' : ''}`}
            >
              <p className="font-medium">Points</p>
              <p className="text-xs text-muted-foreground">Higher value for travel</p>
            </div>

            <div
              onClick={() => {
                setRewardPreference('either');
                if (errors.rewardPreference) setErrors(prev => ({ ...prev, rewardPreference: undefined }));
              }}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                rewardPreference === 'either'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              } ${errors.rewardPreference ? 'border-destructive' : ''}`}
            >
              <p className="font-medium">Either</p>
              <p className="text-xs text-muted-foreground">Show me the best</p>
            </div>
          </div>
          {errors.rewardPreference && (
            <p className="text-sm text-destructive">{errors.rewardPreference}</p>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleSubmit}
      >
        Get My Recommendations
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
