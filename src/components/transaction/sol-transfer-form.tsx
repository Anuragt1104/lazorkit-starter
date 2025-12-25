'use client';

/**
 * SOL Transfer Form Component
 *
 * A form for sending SOL to another address using LazorKit's gasless
 * transaction infrastructure. The paymaster covers network fees.
 *
 * Features:
 * - Input validation (address format, amount)
 * - Real-time balance checking
 * - Transaction status feedback
 * - Explorer link after success
 *
 * @example
 * ```tsx
 * import { SolTransferForm } from '@/components/transaction/sol-transfer-form';
 *
 * export default function TransferPage() {
 *   return <SolTransferForm />;
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { useBalance } from '@/hooks/use-balance';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  Loader2,
  CheckCircle,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { env } from '@/config/env';

interface TransferResult {
  signature: string;
  explorerUrl: string;
}

export function SolTransferForm() {
  const { smartWalletPubkey, isConnected, signAndSendTransaction, isSigning } =
    useWallet();
  const { balance, refetch: refetchBalance } = useBalance();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate Solana public key format
   */
  const isValidAddress = useCallback((address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Validation
    if (!isConnected || !smartWalletPubkey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!recipient || !isValidAddress(recipient)) {
      setError('Please enter a valid Solana address');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (balance !== null && amountNum > balance) {
      setError('Insufficient balance');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the transfer instruction
      const recipientPubkey = new PublicKey(recipient);
      const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL);

      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports,
      });

      // Sign and send via LazorKit (gasless!)
      const signature = await signAndSendTransaction(instruction);

      // Build explorer URL
      const cluster = env.CLUSTER === 'devnet' ? '?cluster=devnet' : '';
      const explorerUrl = `https://explorer.solana.com/tx/${signature}${cluster}`;

      setResult({ signature, explorerUrl });
      toast.success('Transfer successful!');

      // Refresh balance
      await refetchBalance();

      // Clear form
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Transfer failed:', err);
      const message =
        err instanceof Error ? err.message : 'Transfer failed. Please try again.';
      setError(message);
      toast.error('Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = isSubmitting || isSigning;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send SOL
        </CardTitle>
        <CardDescription>
          Transfer SOL to another wallet. Network fees are paid by the LazorKit
          paymaster - you pay nothing!
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Solana address..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={!isConnected || isProcessing}
              className="font-mono"
            />
            {recipient && !isValidAddress(recipient) && (
              <p className="text-sm text-destructive">Invalid address format</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount (SOL)</Label>
              {balance !== null && (
                <button
                  type="button"
                  onClick={() => setAmount(Math.max(0, balance - 0.001).toFixed(4))}
                  className="text-xs text-primary hover:underline"
                  disabled={!isConnected || isProcessing}
                >
                  Max: {balance.toFixed(4)} SOL
                </button>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              step="0.0001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isConnected || isProcessing}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {result && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="flex items-center gap-2">
                <span>Transaction successful!</span>
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  View on Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={!isConnected || isProcessing || !recipient || !amount}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSigning ? 'Sign with Passkey...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send SOL (Gasless)
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
