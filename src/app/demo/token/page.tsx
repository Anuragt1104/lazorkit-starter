'use client';

/**
 * Token Transfer Demo Page
 *
 * Demonstrates gasless SPL token transfers (USDC) using LazorKit.
 */

import { TokenTransferForm } from '@/components/transaction/token-transfer-form';
import { useWallet } from '@lazorkit/wallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';

export default function TokenDemoPage() {
  const { isConnected } = useWallet();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Token Transfer</h1>
        <p className="text-muted-foreground">
          Send USDC tokens to any address without paying network fees
        </p>
      </div>

      {/* PDA Note */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important: Smart Wallet PDAs</AlertTitle>
        <AlertDescription>
          LazorKit smart wallets are Program Derived Addresses (PDAs). When
          deriving Associated Token Accounts, you must set{' '}
          <code className="bg-muted px-1 rounded">allowOwnerOffCurve=true</code>.
          This is handled automatically by the SDK.
        </AlertDescription>
      </Alert>

      {/* Not Connected Warning */}
      {!isConnected && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Wallet Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to send tokens. Click the
            &quot;Connect with Passkey&quot; button in the header.
          </AlertDescription>
        </Alert>
      )}

      {/* Transfer Form */}
      <TokenTransferForm />

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
          <CardDescription>
            How to send SPL tokens with a smart wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

async function transferTokens() {
  // CRITICAL: allowOwnerOffCurve = true for PDA wallets!
  const senderATA = await getAssociatedTokenAddress(
    usdcMint,
    smartWalletPubkey,
    true  // allowOwnerOffCurve
  );

  const recipientATA = await getAssociatedTokenAddress(
    usdcMint,
    recipientPubkey
  );

  const instruction = createTransferInstruction(
    senderATA,
    recipientATA,
    smartWalletPubkey,
    amount * 1_000_000  // USDC has 6 decimals
  );

  await signAndSendTransaction(instruction);
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
