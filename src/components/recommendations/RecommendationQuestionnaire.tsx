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
  DollarSign,
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

// Spending level presets for dropdown selection
const SPENDING_LEVELS = [
  { value: 'light', label: 'Light', description: 'Under $150/mo', amount: 100 },
  { value: 'moderate', label: 'Moderate', description: '$150-400/mo', amount: 275 },
  { value: 'heavy', label: 'Heavy', description: '$400-800/mo', amount: 600 },
  { value: 'very-heavy', label: 'Very Heavy', description: '$800+/mo', amount: 1000 },
];

export function RecommendationQuestionnaire({ onComplete }: RecommendationQuestionnaireProps) {
  // Form state
  const [creditScore, setCreditScore] = useState<CreditScoreRange | ''>('');
  const [simplicityPreference, setSimplicityPreference] = useState<'fewer-cards' | 'more-rewards' | ''>('');
  const [selectedCategories, setSelectedCategories] = useState<SpendingCategory[]>([]);
  const [rewardPreference, setRewardPreference] = useState<RewardPreference | ''>('');
  const [monthlySpending, setMonthlySpending] = useState<{ [key in SpendingCategory]?: number }>({});

  // Validation state
  const [errors, setErrors] = useState<{
    creditScore?: string;
    simplicityPreference?: string;
    categories?: string;
    rewardPreference?: string;
    spending?: string;
  }>({});

  const handleCategoryToggle = (category: SpendingCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Also remove spending for this category
        setMonthlySpending(spending => {
          const updated = { ...spending };
          delete updated[category];
          return updated;
        });
        return prev.filter(c => c !== category);
      }
      if (prev.length >= 3) {
        // Replace the oldest selection and its spending
        const removed = prev[0];
        setMonthlySpending(spending => {
          const updated = { ...spending };
          delete updated[removed];
          return updated;
        });
        return [...prev.slice(1), category];
      }
      return [...prev, category];
    });
    // Clear error when user makes a selection
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: undefined }));
    }
  };

  const handleSpendingLevelChange = (category: SpendingCategory, levelValue: string) => {
    const level = SPENDING_LEVELS.find(l => l.value === levelValue);
    if (level) {
      setMonthlySpending(prev => ({
        ...prev,
        [category]: level.amount
      }));
    }
    if (errors.spending) {
      setErrors(prev => ({ ...prev, spending: undefined }));
    }
  };

  const getSpendingLevelValue = (category: SpendingCategory): string => {
    const amount = monthlySpending[category];
    if (!amount) return '';
    const level = SPENDING_LEVELS.find(l => l.amount === amount);
    return level?.value || '';
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

    // Check that all selected categories have spending levels
    const missingSpending = selectedCategories.some(cat => !monthlySpending[cat]);
    if (selectedCategories.length > 0 && missingSpending) {
      newErrors.spending = 'Please select spending levels for all categories';
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
      monthlySpending: monthlySpending,
    };

    onComplete(preferences);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl text-stone-900 mb-2">Tell us about yourself</h2>
        <p className="text-stone-600">
          Answer a few questions to get personalized card recommendations
        </p>
      </div>

      {/* Question 1: Credit Score */}
      <Card className="border-l-4 border-l-emerald-500 border-stone-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-stone-900">What&apos;s your credit score range?</CardTitle>
              <CardDescription className="text-stone-500">This helps us show cards you&apos;re likely to be approved for</CardDescription>
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
      <Card className="border-l-4 border-l-blue-500 border-stone-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-stone-900">What&apos;s your priority?</CardTitle>
              <CardDescription className="text-stone-500">Choose between simplicity or maximizing rewards</CardDescription>
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
      <Card className="border-l-4 border-l-amber-500 border-stone-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-stone-900">Where do you spend the most?</CardTitle>
              <CardDescription className="text-stone-500">Select 1-3 categories (we&apos;ll prioritize cards for these)</CardDescription>
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

      {/* Question 4: Spending Amounts (conditional) */}
      {selectedCategories.length > 0 && (
        <Card className="border-l-4 border-l-purple-500 border-stone-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-stone-900">How much do you spend monthly?</CardTitle>
                <CardDescription className="text-stone-500">This helps us recommend cards that are worth any annual fees</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCategories.map(categoryId => {
              const category = SPENDING_CATEGORIES.find(c => c.id === categoryId);
              return (
                <div key={categoryId} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      {category?.icon}
                    </div>
                    <span className="text-sm font-medium">{category?.label}</span>
                  </div>
                  <Select
                    value={getSpendingLevelValue(categoryId)}
                    onValueChange={(value) => handleSpendingLevelChange(categoryId, value)}
                  >
                    <SelectTrigger className={`flex-1 ${errors.spending && !monthlySpending[categoryId] ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select spending level" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPENDING_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{level.label}</span>
                            <span className="text-xs text-muted-foreground">{level.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            {errors.spending && (
              <p className="text-sm text-destructive">{errors.spending}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question 5: Reward Type */}
      <Card className="border-l-4 border-l-emerald-500 border-stone-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-stone-900">Cash back or points?</CardTitle>
              <CardDescription className="text-stone-500">How do you prefer to earn rewards?</CardDescription>
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
        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
        onClick={handleSubmit}
      >
        Get My Recommendations
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
