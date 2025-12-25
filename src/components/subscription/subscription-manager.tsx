'use client';

/**
 * Subscription Manager Component
 *
 * Displays and manages active subscriptions with options to
 * process payments and cancel subscriptions.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  CreditCard,
  ExternalLink,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  formatBillingCycle,
  DEMO_PLANS,
  type Subscription,
} from '@/lib/subscription';

interface SubscriptionManagerProps {
  subscriptions: Subscription[];
  onCancel: (subscriptionId: string) => Promise<boolean>;
  onProcessPayment: (subscriptionId: string) => Promise<string | null>;
  getStatus: (subscription: Subscription) => {
    isDue: boolean;
    daysUntil: number;
  };
  isLoading: boolean;
}

export function SubscriptionManager({
  subscriptions,
  onCancel,
  onProcessPayment,
  getStatus,
  isLoading,
}: SubscriptionManagerProps) {
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === 'active'
  );

  if (activeSubscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Your Subscriptions
          </CardTitle>
          <CardDescription>
            No active subscriptions. Choose a plan above to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Your Subscriptions
        </CardTitle>
        <CardDescription>
          Manage your active subscriptions and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeSubscriptions.map((subscription) => {
          const plan = DEMO_PLANS.find((p) => p.id === subscription.planId);
          const status = getStatus(subscription);

          return (
            <div
              key={subscription.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{plan?.name || 'Unknown Plan'}</h4>
                  <Badge
                    variant={
                      subscription.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {subscription.status}
                  </Badge>
                  {status.isDue && (
                    <Badge variant="destructive">Payment Due</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {status.daysUntil === 0
                      ? 'Due today'
                      : `${status.daysUntil} days until billing`}
                  </span>
                  <span>
                    ${subscription.amount}
                    {formatBillingCycle(subscription.billingCycle)}
                  </span>
                </div>

                {subscription.lastPaymentTx && (
                  <a
                    href={`https://explorer.solana.com/tx/${subscription.lastPaymentTx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    Last payment
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                {status.isDue && (
                  <Button
                    size="sm"
                    onClick={() => onProcessPayment(subscription.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Pay Now'
                    )}
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your {plan?.name} subscription?
                        You will lose access to all features at the end of your billing period.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onCancel(subscription.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Subscription
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
