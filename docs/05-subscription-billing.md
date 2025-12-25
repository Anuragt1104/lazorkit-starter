# Tutorial 5: Subscription Billing

Learn how to implement recurring USDC payments for subscription-based services using LazorKit.

## What You'll Learn

- Designing a subscription system on Solana
- Processing recurring token payments
- Managing subscription state
- Building a subscription UI

## Prerequisites

- Completed previous tutorials
- Understanding of SPL tokens
- Familiarity with subscription models

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Subscription Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────────┐     │
│  │   User     │    │  Your App  │    │  Merchant      │     │
│  │   Wallet   │───>│  (State)   │───>│  Wallet        │     │
│  │   (PDA)    │    │            │    │                │     │
│  └────────────┘    └────────────┘    └────────────────┘     │
│                                                              │
│  Flow:                                                       │
│  1. User selects plan                                        │
│  2. User signs USDC transfer                                 │
│  3. Payment sent to merchant                                 │
│  4. Subscription state stored                                │
│  5. Next billing date set                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Define Subscription Types

```typescript
// src/lib/subscription.ts

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number; // In USDC
  billingCycle: BillingCycle;
  features: string[];
}

export interface Subscription {
  id: string;
  planId: string;
  walletAddress: string;
  merchantAddress: string;
  amount: number;
  billingCycle: BillingCycle;
  startDate: number;
  nextBillingDate: number;
  status: 'active' | 'cancelled' | 'expired';
  lastPaymentTx?: string;
}

// Example plans
export const PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for getting started',
    amount: 4.99,
    billingCycle: 'monthly',
    features: ['10 transactions/day', 'Basic support', 'API access'],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users',
    amount: 19.99,
    billingCycle: 'monthly',
    features: ['Unlimited transactions', 'Priority support', 'Advanced API'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    amount: 99.99,
    billingCycle: 'monthly',
    features: ['Everything in Pro', 'Dedicated support', 'Custom integrations'],
  },
];
```

## Step 2: Subscription Storage Utilities

```typescript
// src/lib/subscription.ts (continued)

const STORAGE_KEY = 'lazorkit-subscriptions';

/**
 * Calculate next billing date
 */
export function calculateNextBilling(cycle: BillingCycle): number {
  const now = new Date();

  switch (cycle) {
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      break;
  }

  return now.getTime();
}

/**
 * Load subscriptions from localStorage
 */
export function loadSubscriptions(): Subscription[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save subscriptions to localStorage
 */
export function saveSubscriptions(subscriptions: Subscription[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

/**
 * Get user's subscriptions
 */
export function getUserSubscriptions(walletAddress: string): Subscription[] {
  return loadSubscriptions().filter((s) => s.walletAddress === walletAddress);
}

/**
 * Create a subscription
 */
export function createSubscription(
  planId: string,
  walletAddress: string,
  merchantAddress: string,
  amount: number,
  billingCycle: BillingCycle,
  paymentTx: string
): Subscription {
  const subscription: Subscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    planId,
    walletAddress,
    merchantAddress,
    amount,
    billingCycle,
    startDate: Date.now(),
    nextBillingDate: calculateNextBilling(billingCycle),
    status: 'active',
    lastPaymentTx: paymentTx,
  };

  const subscriptions = loadSubscriptions();
  subscriptions.push(subscription);
  saveSubscriptions(subscriptions);

  return subscription;
}

/**
 * Cancel a subscription
 */
export function cancelSubscription(subscriptionId: string): boolean {
  const subscriptions = loadSubscriptions();
  const index = subscriptions.findIndex((s) => s.id === subscriptionId);

  if (index === -1) return false;

  subscriptions[index].status = 'cancelled';
  saveSubscriptions(subscriptions);
  return true;
}

/**
 * Check if payment is due
 */
export function isPaymentDue(subscription: Subscription): boolean {
  return subscription.status === 'active' && Date.now() >= subscription.nextBillingDate;
}
```

## Step 3: Build Payment Instruction

```typescript
// src/lib/subscription.ts (continued)

import { PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from '@solana/spl-token';

const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const USDC_DECIMALS = 6;

/**
 * Build subscription payment instruction
 */
export async function buildPaymentInstruction(
  senderPubkey: PublicKey,
  merchantPubkey: PublicKey,
  amount: number
) {
  // Get sender's ATA (CRITICAL: allowOwnerOffCurve = true for PDAs!)
  const senderATA = await getAssociatedTokenAddress(
    USDC_MINT,
    senderPubkey,
    true // Essential for PDA wallets
  );

  // Get merchant's ATA
  const merchantATA = await getAssociatedTokenAddress(
    USDC_MINT,
    merchantPubkey,
    false
  );

  // Create transfer instruction (amount in smallest unit)
  const amountInSmallest = Math.floor(amount * Math.pow(10, USDC_DECIMALS));

  return createTransferInstruction(
    senderATA,
    merchantATA,
    senderPubkey,
    amountInSmallest
  );
}
```

## Step 4: Create the Subscription Hook

```typescript
// src/hooks/use-subscription.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { PublicKey } from '@solana/web3.js';
import {
  getUserSubscriptions,
  createSubscription,
  cancelSubscription as cancelSub,
  buildPaymentInstruction,
  calculateNextBilling,
  PLANS,
  type Subscription,
  type SubscriptionPlan,
} from '@/lib/subscription';

export function useSubscription() {
  const { smartWalletPubkey, isConnected, signAndSendTransaction } = useWallet();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load subscriptions
  const refresh = useCallback(() => {
    if (smartWalletPubkey) {
      setSubscriptions(getUserSubscriptions(smartWalletPubkey.toBase58()));
    } else {
      setSubscriptions([]);
    }
  }, [smartWalletPubkey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to a plan
  const subscribe = async (planId: string, merchantAddress: string) => {
    if (!smartWalletPubkey || !isConnected) {
      throw new Error('Wallet not connected');
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error('Plan not found');

    setIsLoading(true);

    try {
      // Build payment instruction
      const instruction = await buildPaymentInstruction(
        smartWalletPubkey,
        new PublicKey(merchantAddress),
        plan.amount
      );

      // Execute payment (gasless via LazorKit)
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

      refresh();
      return subscription;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel subscription
  const cancel = async (subscriptionId: string) => {
    setIsLoading(true);
    try {
      cancelSub(subscriptionId);
      refresh();
    } finally {
      setIsLoading(false);
    }
  };

  // Process recurring payment
  const processPayment = async (subscriptionId: string) => {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription || !smartWalletPubkey) {
      throw new Error('Subscription not found');
    }

    setIsLoading(true);

    try {
      // Build and execute payment
      const instruction = await buildPaymentInstruction(
        smartWalletPubkey,
        new PublicKey(subscription.merchantAddress),
        subscription.amount
      );

      const signature = await signAndSendTransaction(instruction);

      // Update subscription
      const subs = getUserSubscriptions(smartWalletPubkey.toBase58());
      const index = subs.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        subs[index].lastPaymentTx = signature;
        subs[index].nextBillingDate = calculateNextBilling(subscription.billingCycle);
        // Save updated subscriptions
      }

      refresh();
      return signature;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscriptions,
    plans: PLANS,
    isLoading,
    subscribe,
    cancel,
    processPayment,
    refresh,
  };
}
```

## Step 5: Build the Plan Card Component

```typescript
// src/components/subscription/plan-card.tsx
'use client';

import { SubscriptionPlan } from '@/lib/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSubscribe: (planId: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function PlanCard({
  plan,
  isCurrentPlan,
  onSubscribe,
  isLoading,
  disabled,
}: PlanCardProps) {
  const formatCycle = (cycle: string) => {
    switch (cycle) {
      case 'weekly':
        return '/week';
      case 'monthly':
        return '/month';
      case 'yearly':
        return '/year';
      default:
        return '';
    }
  };

  return (
    <div className={`plan-card ${isCurrentPlan ? 'current' : ''}`}>
      <h3>{plan.name}</h3>
      <p className="description">{plan.description}</p>

      <div className="pricing">
        <span className="amount">${plan.amount}</span>
        <span className="cycle">{formatCycle(plan.billingCycle)}</span>
      </div>

      <ul className="features">
        {plan.features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(plan.id)}
        disabled={disabled || isLoading || isCurrentPlan}
        className="subscribe-button"
      >
        {isLoading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : 'Subscribe'}
      </button>
    </div>
  );
}
```

## Step 6: Build the Subscription Page

```typescript
// src/app/demo/subscription/page.tsx
'use client';

import { useWallet } from '@lazorkit/wallet';
import { useSubscription } from '@/hooks/use-subscription';
import { PlanCard } from '@/components/subscription/plan-card';

// Demo merchant (your wallet in production)
const MERCHANT_ADDRESS = 'YourMerchantWalletAddressHere';

export default function SubscriptionPage() {
  const { isConnected } = useWallet();
  const { subscriptions, plans, isLoading, subscribe, cancel } = useSubscription();

  // Get active subscription
  const activeSubscription = subscriptions.find((s) => s.status === 'active');
  const activePlanId = activeSubscription?.planId;

  const handleSubscribe = async (planId: string) => {
    try {
      await subscribe(planId, MERCHANT_ADDRESS);
      alert('Subscription created!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to subscribe');
    }
  };

  return (
    <div className="subscription-page">
      <h1>Choose Your Plan</h1>

      {!isConnected && (
        <div className="warning">
          Connect your wallet to subscribe
        </div>
      )}

      <div className="plans-grid">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={activePlanId === plan.id}
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
            disabled={!isConnected}
          />
        ))}
      </div>

      {activeSubscription && (
        <div className="active-subscription">
          <h2>Your Subscription</h2>
          <p>Plan: {plans.find((p) => p.id === activeSubscription.planId)?.name}</p>
          <p>
            Next billing:{' '}
            {new Date(activeSubscription.nextBillingDate).toLocaleDateString()}
          </p>
          <button onClick={() => cancel(activeSubscription.id)}>
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );
}
```

## Production Considerations

### 1. On-Chain State

For production, store subscription state on-chain:

```typescript
// Example Anchor program account
pub struct Subscription {
    pub owner: Pubkey,
    pub merchant: Pubkey,
    pub plan_id: u8,
    pub amount: u64,
    pub next_billing: i64,
    pub status: SubscriptionStatus,
}
```

### 2. Backend Validation

Verify payments on your backend:

```typescript
// Use Helius or QuickNode webhooks
app.post('/webhook/payment', async (req, res) => {
  const { signature, accountKeys, tokenTransfers } = req.body;

  // Verify the payment matches expected subscription
  // Update subscription status in database
});
```

### 3. Automatic Renewals

Set up a cron job or serverless function:

```typescript
// Check for due subscriptions daily
async function processRenewals() {
  const dueSubscriptions = await getDueSubscriptions();

  for (const sub of dueSubscriptions) {
    // Notify user to process payment
    // Or use delegated authority if authorized
  }
}
```

### 4. Grace Periods

```typescript
const GRACE_PERIOD_DAYS = 3;

function isExpired(subscription: Subscription): boolean {
  const gracePeriod = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > subscription.nextBillingDate + gracePeriod;
}
```

## Best Practices

1. **Always use USDC** for subscriptions (stable value)
2. **Send payment confirmation emails** (optional)
3. **Provide clear cancellation process**
4. **Show upcoming renewal dates**
5. **Handle failed payments gracefully**
6. **Implement refund capability**

## Summary

You now have a complete subscription billing system:

- Plan selection and display
- Payment processing via LazorKit
- Subscription state management
- Cancellation handling

For production, consider:
- On-chain subscription accounts
- Backend payment verification
- Automatic renewal reminders
- Proration for plan changes

## Resources

- [Solana SPL Token Docs](https://spl.solana.com/token)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Helius Webhooks](https://docs.helius.xyz/webhooks/)
