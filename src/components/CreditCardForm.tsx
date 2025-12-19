'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CreditCard as CreditCardIcon, Trash2, AlertTriangle } from 'lucide-react';
import { CreditCardFormData } from '@/types';

interface CreditCardFormProps {
  index: number;
  onSubmit: (data: CreditCardFormData) => void;
  onRemove?: () => void;
  initialData?: CreditCardFormData;
  showRemove?: boolean;
}

export function CreditCardForm({
  index,
  onSubmit,
  onRemove,
  initialData,
  showRemove = false,
}: CreditCardFormProps) {
  const [formData, setFormData] = useState<CreditCardFormData>(
    initialData || {
      nickname: '',
      creditLimit: '',
      currentBalance: '',
      statementDate: '',
      dueDate: '',
      apr: '',
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof CreditCardFormData, string>>>({});

  const handleChange = (field: keyof CreditCardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreditCardFormData, string>> = {};

    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Card name is required';
    }

    const creditLimit = parseFloat(formData.creditLimit);
    if (isNaN(creditLimit) || creditLimit <= 0) {
      newErrors.creditLimit = 'Enter a valid credit limit';
    }

    const currentBalance = parseFloat(formData.currentBalance);
    if (isNaN(currentBalance) || currentBalance < 0) {
      newErrors.currentBalance = 'Enter a valid balance';
    }

    if (!formData.statementDate) {
      newErrors.statementDate = 'Select statement date';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Select due date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Calculate live utilization
  const creditLimit = parseFloat(formData.creditLimit) || 0;
  const currentBalance = parseFloat(formData.currentBalance) || 0;
  const utilization = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;

  const getUtilizationColor = (util: number) => {
    if (util > 100) return 'bg-red-500';
    if (util > 30) return 'bg-red-500';
    if (util > 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUtilizationBadge = (util: number) => {
    if (util > 100) return { label: 'Over Limit', variant: 'destructive' as const };
    if (util > 30) return { label: 'High', variant: 'destructive' as const };
    if (util > 10) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Good', variant: 'default' as const };
  };

  const badge = getUtilizationBadge(utilization);

  // Generate day options
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            Card {index + 1}
            {formData.nickname && (
              <span className="text-muted-foreground font-normal">
                - {formData.nickname}
              </span>
            )}
          </CardTitle>
          {showRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Card Nickname */}
        <div className="space-y-2">
          <Label htmlFor={`nickname-${index}`}>Card Name</Label>
          <Input
            id={`nickname-${index}`}
            placeholder="e.g., Chase Sapphire"
            value={formData.nickname}
            onChange={(e) => handleChange('nickname', e.target.value)}
            className={errors.nickname ? 'border-destructive' : ''}
          />
          {errors.nickname && (
            <p className="text-xs text-destructive">{errors.nickname}</p>
          )}
        </div>

        {/* Credit Limit & Current Balance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`creditLimit-${index}`}>Credit Limit ($)</Label>
            <Input
              id={`creditLimit-${index}`}
              type="number"
              placeholder="10000"
              value={formData.creditLimit}
              onChange={(e) => handleChange('creditLimit', e.target.value)}
              className={errors.creditLimit ? 'border-destructive' : ''}
            />
            {errors.creditLimit && (
              <p className="text-xs text-destructive">{errors.creditLimit}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`currentBalance-${index}`}>Current Balance ($)</Label>
            <Input
              id={`currentBalance-${index}`}
              type="number"
              placeholder="2500"
              value={formData.currentBalance}
              onChange={(e) => handleChange('currentBalance', e.target.value)}
              className={errors.currentBalance ? 'border-destructive' : ''}
            />
            {errors.currentBalance && (
              <p className="text-xs text-destructive">{errors.currentBalance}</p>
            )}
          </div>
        </div>

        {/* Live Utilization Display */}
        {creditLimit > 0 && (
          <div className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Utilization</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{utilization.toFixed(1)}%</span>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
            </div>
            <Progress
              value={Math.min(utilization, 100)}
              className={`h-2 ${getUtilizationColor(utilization)}`}
            />
            {utilization > 30 && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                <span>High utilization impacts your credit score</span>
              </div>
            )}
          </div>
        )}

        {/* Statement & Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`statementDate-${index}`}>Statement Date</Label>
            <Select
              value={formData.statementDate}
              onValueChange={(value) => handleChange('statementDate', value)}
            >
              <SelectTrigger
                id={`statementDate-${index}`}
                className={errors.statementDate ? 'border-destructive' : ''}
              >
                <SelectValue placeholder="Day of month" />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.statementDate && (
              <p className="text-xs text-destructive">{errors.statementDate}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`dueDate-${index}`}>Due Date</Label>
            <Select
              value={formData.dueDate}
              onValueChange={(value) => handleChange('dueDate', value)}
            >
              <SelectTrigger
                id={`dueDate-${index}`}
                className={errors.dueDate ? 'border-destructive' : ''}
              >
                <SelectValue placeholder="Day of month" />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate}</p>
            )}
          </div>
        </div>

        {/* APR (Optional) */}
        <div className="space-y-2">
          <Label htmlFor={`apr-${index}`}>APR % (Optional)</Label>
          <Input
            id={`apr-${index}`}
            type="number"
            placeholder="19.99"
            value={formData.apr}
            onChange={(e) => handleChange('apr', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            For future interest calculations
          </p>
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Add Card
        </Button>
      </CardContent>
    </Card>
  );
}
