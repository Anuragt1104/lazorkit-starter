'use client';

/**
 * Subscription Hook
 *
 * Manages subscription state and provides methods for creating,
 * cancelling, and processing subscription payments.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getWalletSubscriptions,
  createSubscription,
  cancelSubscription,
  recordPayment,
  buildPaymentInstruction,
  isPaymentDue,
  getDaysUntilBilling,
  DEMO_PLANS,
  type Subscription,
  type SubscriptionPlan,
  type BillingCycle,
} from '@/lib/subscription';
import { env } from '@/config/env';
import { toast } from 'sonner';

export interface UseSubscriptionReturn {
  subscriptions: Subscription[];
  plans: SubscriptionPlan[];
  isLoading: boolean;
  subscribe: (planId: string, merchantAddress: string) => Promise<string | null>;
  cancel: (subscriptionId: string) => Promise<boolean>;
  processPayment: (subscriptionId: string) => Promise<string | null>;
  refresh: () => void;
  getSubscriptionStatus: (subscription: Subscription) => {
    isDue: boolean;
    daysUntil: number;
  };
}

export function useSubscription(): UseSubscriptionReturn {
  const { smartWalletPubkey, isConnected, signAndSendTransaction } = useWallet();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load subscriptions on mount and when wallet changes
  const refresh = useCallback(() => {
    if (smartWalletPubkey) {
      const subs = getWalletSubscriptions(smartWalletPubkey.toBase58());
      setSubscriptions(subs);
    } else {
      setSubscriptions([]);
    }
  }, [smartWalletPubkey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to a plan
  const subscribe = useCallback(
    async (planId: string, merchantAddress: string): Promise<string | null> => {
      if (!smartWalletPubkey || !isConnected) {
        toast.error('Please connect your wallet first');
        return null;
      }

      const plan = DEMO_PLANS.find((p) => p.id === planId);
      if (!plan) {
        toast.error('Plan not found');
        return null;
      }

      setIsLoading(true);

      try {
        // Build payment instruction
        const connection = new Connection(env.RPC_URL);
        const merchantPubkey = new PublicKey(merchantAddress);

        const { instruction } = await buildPaymentInstruction({
          senderPubkey: smartWalletPubkey,
          merchantPubkey,
          amount: plan.amount,
          connection,
        });

        // Execute payment via LazorKit (gasless!)
        const signature = await signAndSendTransaction(instruction);

        // Create subscription record
        const subscription = createSubscription(
          planId,
          smartWalletPubkey.toBase58(),
          merchantAddress,
          plan.amount,
          plan.billingCycle,
          signature
        );

        // Refresh subscriptions list
        refresh();

        toast.success(`Subscribed to ${plan.name} plan!`);
        return subscription.id;
      } catch (error) {
        console.error('Subscription error:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to create subscription'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [smartWalletPubkey, isConnected, signAndSendTransaction, refresh]
  );

  // Cancel a subscription
  const cancel = useCallback(
    async (subscriptionId: string): Promise<boolean> => {
      setIsLoading(true);

      try {
        const success = cancelSubscription(subscriptionId);

        if (success) {
          refresh();
          toast.success('Subscription cancelled');
          return true;
        } else {
          toast.error('Subscription not found');
          return false;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [refresh]
  );

  // Process a recurring payment
  const processPayment = useCallback(
    async (subscriptionId: string): Promise<string | null> => {
      if (!smartWalletPubkey || !isConnected) {
        toast.error('Please connect your wallet first');
        return null;
      }

      const subscription = subscriptions.find((s) => s.id === subscriptionId);
      if (!subscription) {
        toast.error('Subscription not found');
        return null;
      }

      if (subscription.status !== 'active') {
        toast.error('Subscription is not active');
        return null;
      }

      setIsLoading(true);

      try {
        // Build payment instruction
        const connection = new Connection(env.RPC_URL);
        const merchantPubkey = new PublicKey(subscription.merchantAddress);

        const { instruction } = await buildPaymentInstruction({
          senderPubkey: smartWalletPubkey,
          merchantPubkey,
          amount: subscription.amount,
          connection,
        });

        // Execute payment via LazorKit (gasless!)
        const signature = await signAndSendTransaction(instruction);

        // Update subscription record
        recordPayment(subscriptionId, signature);

        // Refresh subscriptions list
        refresh();

        toast.success('Payment processed successfully!');
        return signature;
      } catch (error) {
        console.error('Payment error:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to process payment'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [smartWalletPubkey, isConnected, signAndSendTransaction, subscriptions, refresh]
  );

  // Get subscription status
  const getSubscriptionStatus = useCallback((subscription: Subscription) => {
    return {
      isDue: isPaymentDue(subscription),
      daysUntil: getDaysUntilBilling(subscription),
    };
  }, []);

  return {
    subscriptions,
    plans: DEMO_PLANS,
    isLoading,
    subscribe,
    cancel,
    processPayment,
    refresh,
    getSubscriptionStatus,
  };
}
