'use client';

/**
 * Subscription Plan Card Component
 *
 * Displays a subscription plan with pricing, features, and subscribe button.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { formatBillingCycle, type SubscriptionPlan } from '@/lib/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSubscribe: (planId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PlanCard({
  plan,
  isCurrentPlan = false,
  onSubscribe,
  isLoading = false,
  disabled = false,
}: PlanCardProps) {
  const isPopular = plan.id === 'pro';

  return (
    <Card
      className={`relative flex flex-col ${
        isPopular ? 'border-primary shadow-lg' : ''
      } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary">Most Popular</Badge>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className={isPopular ? 'pt-8' : ''}>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Pricing */}
        <div className="mb-6">
          <span className="text-4xl font-bold">${plan.amount}</span>
          <span className="text-muted-foreground">
            {formatBillingCycle(plan.billingCycle)}
          </span>
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          onClick={() => onSubscribe(plan.id)}
          disabled={disabled || isLoading || isCurrentPlan}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            'Subscribe'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
