'use client';

/**
 * Subscription Billing Demo Page
 *
 * Demonstrates recurring USDC payments using LazorKit smart wallets.
 * Uses localStorage for demo purposes - production would use on-chain
 * program or backend database for subscription management.
 */

import { useWallet } from '@lazorkit/wallet';
import { useSubscription } from '@/hooks/use-subscription';
import { PlanCard, SubscriptionManager } from '@/components/subscription';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CreditCard, AlertTriangle } from 'lucide-react';

// Demo merchant address (would be your actual merchant wallet in production)
const DEMO_MERCHANT_ADDRESS = 'DemoMerchant11111111111111111111111111111111';

export default function SubscriptionDemoPage() {
  const { isConnected } = useWallet();
  const {
    subscriptions,
    plans,
    isLoading,
    subscribe,
    cancel,
    processPayment,
    getSubscriptionStatus,
  } = useSubscription();

  // Check if user has an active subscription to any plan
  const getActivePlanId = () => {
    const activeSub = subscriptions.find((s) => s.status === 'active');
    return activeSub?.planId || null;
  };

  const activePlanId = getActivePlanId();

  const handleSubscribe = async (planId: string) => {
    await subscribe(planId, DEMO_MERCHANT_ADDRESS);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Subscription Billing</h1>
        <p className="text-muted-foreground">
          Recurring USDC payments with gasless transactions
        </p>
      </div>

      {/* How It Works */}
      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertTitle>Subscription Payments</AlertTitle>
        <AlertDescription>
          Subscribe to a plan and pay automatically each billing cycle. All payments
          are made in USDC with zero gas fees thanks to the LazorKit paymaster.
          Your subscription state is stored locally for this demo.
        </AlertDescription>
      </Alert>

      {/* Demo Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Demo Mode</AlertTitle>
        <AlertDescription>
          This is a demonstration of subscription billing. In production, you would
          use an on-chain program or backend service to manage subscriptions, verify
          payments, and handle automatic renewals. Make sure you have USDC tokens
          in your wallet to test payments.
        </AlertDescription>
      </Alert>

      {/* Not Connected Warning */}
      {!isConnected && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Wallet Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to subscribe to a plan. Click the
            &quot;Connect with Passkey&quot; button in the header.
          </AlertDescription>
        </Alert>
      )}

      {/* Subscription Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Choose a Plan</h2>
        <div className="grid gap-6 md:grid-cols-3">
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
      </div>

      {/* Active Subscriptions */}
      {isConnected && (
        <SubscriptionManager
          subscriptions={subscriptions}
          onCancel={cancel}
          onProcessPayment={processPayment}
          getStatus={getSubscriptionStatus}
          isLoading={isLoading}
        />
      )}

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
          <CardDescription>
            How to implement subscription payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { useWallet } from '@lazorkit/wallet';
import { createTransferInstruction } from '@solana/spl-token';

async function processSubscriptionPayment(amount: number) {
  // Get Associated Token Accounts
  // CRITICAL: allowOwnerOffCurve = true for PDAs!
  const senderATA = await getAssociatedTokenAddress(
    USDC_MINT,
    smartWalletPubkey,
    true // allowOwnerOffCurve
  );

  const merchantATA = await getAssociatedTokenAddress(
    USDC_MINT,
    merchantPubkey
  );

  // Create transfer instruction
  const instruction = createTransferInstruction(
    senderATA,
    merchantATA,
    smartWalletPubkey,
    amount * 1_000_000 // USDC has 6 decimals
  );

  // Execute gaslessly via LazorKit
  const signature = await signAndSendTransaction(instruction);

  // Store subscription record
  createSubscription({
    walletAddress: smartWalletPubkey.toBase58(),
    amount,
    nextBillingDate: addMonths(new Date(), 1),
    paymentTx: signature,
  });

  return signature;
}`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Architecture Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Production Architecture</CardTitle>
          <CardDescription>
            How to build a real subscription system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For a production subscription system, consider these approaches:
          </p>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm">On-Chain Program</h4>
              <p className="text-xs text-muted-foreground">
                Build a Solana program that stores subscription state on-chain.
                Use PDAs to track subscriber accounts, payment history, and
                billing cycles. The program can validate payments and emit events
                for your backend to process.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm">Backend + Webhook</h4>
              <p className="text-xs text-muted-foreground">
                Store subscription state in your backend database. Use Helius or
                QuickNode webhooks to monitor for incoming payments. When a payment
                is detected, update the subscription status and provision access.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm">Hybrid Approach</h4>
              <p className="text-xs text-muted-foreground">
                Use on-chain escrow for recurring payments with backend validation.
                The user pre-authorizes payments, and your backend triggers
                withdrawals on the billing date after verifying the subscription.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
