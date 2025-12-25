'use client';

/**
 * Token Swap Demo Page
 *
 * Demonstrates gasless token swaps using Jupiter API via LazorKit.
 */

import { SwapForm } from '@/components/swap';
import { useWallet } from '@lazorkit/wallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Repeat, AlertTriangle } from 'lucide-react';

export default function SwapDemoPage() {
  const { isConnected } = useWallet();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Token Swap</h1>
        <p className="text-muted-foreground">
          Swap tokens using Jupiter aggregator with zero gas fees
        </p>
      </div>

      {/* How It Works */}
      <Alert>
        <Repeat className="h-4 w-4" />
        <AlertTitle>Powered by Jupiter</AlertTitle>
        <AlertDescription>
          Jupiter finds the best rates across all Solana DEXes. Your swap is
          executed through optimized routes with automatic slippage protection.
          The LazorKit paymaster covers all transaction fees.
        </AlertDescription>
      </Alert>

      {/* Devnet Note */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Devnet Limitations</AlertTitle>
        <AlertDescription>
          Token swaps on Devnet have limited liquidity. Some token pairs may not
          have routes available. For best results, try swapping between SOL and
          USDC.
        </AlertDescription>
      </Alert>

      {/* Not Connected Warning */}
      {!isConnected && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Wallet Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to swap tokens. Click the
            &quot;Connect with Passkey&quot; button in the header.
          </AlertDescription>
        </Alert>
      )}

      {/* Swap Interface */}
      <SwapForm />

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
          <CardDescription>
            How to integrate Jupiter swaps with LazorKit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { useWallet } from '@lazorkit/wallet';
import { getQuote, getSwapTransaction } from '@/lib/jupiter';

async function executeSwap() {
  // 1. Get quote from Jupiter
  const quote = await getQuote({
    inputMint: 'So11111111111111111111111111111111111111112', // SOL
    outputMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC
    amount: '1000000000', // 1 SOL in lamports
    slippageBps: 50, // 0.5% slippage
  });

  // 2. Build swap transaction
  const swapResult = await getSwapTransaction({
    quoteResponse: quote,
    userPublicKey: smartWalletPubkey.toBase58(),
    wrapUnwrapSOL: true,
  });

  // 3. Deserialize and sign via LazorKit
  const tx = Transaction.from(
    Buffer.from(swapResult.swapTransaction, 'base64')
  );

  // 4. Execute gaslessly
  const signature = await signAndSendTransaction(tx.instructions[0]);
  console.log('Swap TX:', signature);
}`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Advanced: Route Information */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Routes</CardTitle>
          <CardDescription>
            How Jupiter finds the best swap rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Jupiter aggregates liquidity from multiple DEXes on Solana to find
            the optimal route for your swap. This may involve:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Direct swaps through a single pool</li>
            <li>Multi-hop routes through intermediate tokens</li>
            <li>Split routes across multiple DEXes</li>
            <li>Automatic selection of the best price</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            The quote response includes the route plan showing exactly how your
            swap will be executed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
