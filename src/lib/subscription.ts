/**
 * Subscription Billing Logic
 *
 * Provides utilities for managing recurring USDC payments.
 * Uses localStorage for demo purposes - production would use
 * on-chain program or backend database.
 */

import { PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { TOKENS } from './constants';

// Subscription storage key
const SUBSCRIPTIONS_KEY = 'lazorkit-subscriptions';

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number; // In USDC (e.g., 9.99)
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
  startDate: number; // Timestamp
  nextBillingDate: number; // Timestamp
  status: 'active' | 'cancelled' | 'expired';
  lastPaymentTx?: string;
}

// Default subscription plans for demo
export const DEMO_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for getting started',
    amount: 4.99,
    billingCycle: 'monthly',
    features: [
      '10 transactions per day',
      'Basic support',
      'API access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users',
    amount: 19.99,
    billingCycle: 'monthly',
    features: [
      'Unlimited transactions',
      'Priority support',
      'Advanced API access',
      'Custom webhooks',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    amount: 99.99,
    billingCycle: 'monthly',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'White-label options',
    ],
  },
];

// Demo merchant address (receives payments)
export const DEMO_MERCHANT = new PublicKey(
  'DemoMerchant11111111111111111111111111111111'
);

/**
 * Calculate the next billing date based on cycle
 */
export function calculateNextBillingDate(
  fromDate: Date,
  cycle: BillingCycle
): number {
  const next = new Date(fromDate);

  switch (cycle) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next.getTime();
}

/**
 * Get billing cycle duration in milliseconds
 */
export function getCycleDuration(cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000;
    case 'yearly':
      return 365 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Format billing cycle for display
 */
export function formatBillingCycle(cycle: BillingCycle): string {
  switch (cycle) {
    case 'weekly':
      return '/week';
    case 'monthly':
      return '/month';
    case 'yearly':
      return '/year';
  }
}

/**
 * Load subscriptions from localStorage
 */
export function loadSubscriptions(): Subscription[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(SUBSCRIPTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save subscriptions to localStorage
 */
export function saveSubscriptions(subscriptions: Subscription[]): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
}

/**
 * Get subscriptions for a specific wallet
 */
export function getWalletSubscriptions(walletAddress: string): Subscription[] {
  const all = loadSubscriptions();
  return all.filter((sub) => sub.walletAddress === walletAddress);
}

/**
 * Get a specific subscription by ID
 */
export function getSubscription(subscriptionId: string): Subscription | null {
  const all = loadSubscriptions();
  return all.find((sub) => sub.id === subscriptionId) || null;
}

/**
 * Create a new subscription
 */
export function createSubscription(
  planId: string,
  walletAddress: string,
  merchantAddress: string,
  amount: number,
  billingCycle: BillingCycle,
  paymentTx?: string
): Subscription {
  const now = Date.now();
  const subscription: Subscription = {
    id: `sub_${now}_${Math.random().toString(36).slice(2, 9)}`,
    planId,
    walletAddress,
    merchantAddress,
    amount,
    billingCycle,
    startDate: now,
    nextBillingDate: calculateNextBillingDate(new Date(now), billingCycle),
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
  const index = subscriptions.findIndex((sub) => sub.id === subscriptionId);

  if (index === -1) return false;

  subscriptions[index].status = 'cancelled';
  saveSubscriptions(subscriptions);

  return true;
}

/**
 * Update subscription after payment
 */
export function recordPayment(
  subscriptionId: string,
  paymentTx: string
): Subscription | null {
  const subscriptions = loadSubscriptions();
  const index = subscriptions.findIndex((sub) => sub.id === subscriptionId);

  if (index === -1) return null;

  const subscription = subscriptions[index];
  subscription.lastPaymentTx = paymentTx;
  subscription.nextBillingDate = calculateNextBillingDate(
    new Date(),
    subscription.billingCycle
  );

  saveSubscriptions(subscriptions);

  return subscription;
}

/**
 * Check if a subscription is due for payment
 */
export function isPaymentDue(subscription: Subscription): boolean {
  if (subscription.status !== 'active') return false;
  return Date.now() >= subscription.nextBillingDate;
}

/**
 * Get days until next billing
 */
export function getDaysUntilBilling(subscription: Subscription): number {
  const diff = subscription.nextBillingDate - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/**
 * Build subscription payment instruction
 */
export async function buildPaymentInstruction(params: {
  senderPubkey: PublicKey;
  merchantPubkey: PublicKey;
  amount: number; // In USDC
  connection: unknown; // Connection for checking ATA
}) {
  const { senderPubkey, merchantPubkey, amount } = params;
  const tokenMint = TOKENS.USDC_DEVNET;

  // Get Associated Token Accounts
  // CRITICAL: allowOwnerOffCurve = true for PDA wallets!
  const senderATA = await getAssociatedTokenAddress(
    tokenMint,
    senderPubkey,
    true // allowOwnerOffCurve
  );

  const merchantATA = await getAssociatedTokenAddress(
    tokenMint,
    merchantPubkey,
    false
  );

  // Create transfer instruction
  // Amount in smallest unit (USDC has 6 decimals)
  const amountInSmallest = Math.floor(amount * 1_000_000);

  const transferInstruction = createTransferInstruction(
    senderATA,
    merchantATA,
    senderPubkey,
    amountInSmallest
  );

  return {
    instruction: transferInstruction,
    senderATA,
    merchantATA,
    amountInSmallest,
  };
}

/**
 * Clear all subscriptions (for testing)
 */
export function clearAllSubscriptions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SUBSCRIPTIONS_KEY);
}
