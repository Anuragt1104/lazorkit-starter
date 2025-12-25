'use client';

/**
 * SOL Transfer Demo Page
 *
 * Demonstrates gasless SOL transfers using LazorKit.
 */

import { SolTransferForm } from '@/components/transaction/sol-transfer-form';
import { BalanceDisplay } from '@/components/wallet/balance-display';
import { useWallet } from '@lazorkit/wallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Zap, Info } from 'lucide-react';

export default function TransferDemoPage() {
  const { isConnected } = useWallet();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">SOL Transfer</h1>
        <p className="text-muted-foreground">
          Send SOL to any address without paying network fees
        </p>
      </div>

      {/* Gasless Explanation */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertTitle>Gasless Transactions</AlertTitle>
        <AlertDescription>
          The LazorKit paymaster covers all network fees. When you sign a
          transaction, it&apos;s sent to the paymaster which adds its signature as
          fee payer and broadcasts to the network. You pay $0 in gas.
        </AlertDescription>
      </Alert>

      {/* Not Connected Warning */}
      {!isConnected && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Wallet Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to send transactions. Click the
            &quot;Connect with Passkey&quot; button in the header.
          </AlertDescription>
        </Alert>
      )}

      {/* Transfer Form and Balance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SolTransferForm />
        <BalanceDisplay />
      </div>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
          <CardDescription>
            How to send a gasless SOL transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

function TransferButton() {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();

  const handleTransfer = async () => {
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey!,
      toPubkey: new PublicKey('recipient...'),
      lamports: 0.1 * LAMPORTS_PER_SOL,
    });

    // Paymaster covers fees automatically!
    const signature = await signAndSendTransaction(instruction);
    console.log('TX:', signature);
  };

  return <button onClick={handleTransfer}>Send 0.1 SOL</button>;
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
