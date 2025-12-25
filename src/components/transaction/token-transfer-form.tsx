'use client';

/**
 * Token Transfer Form Component
 *
 * A form for sending SPL tokens (e.g., USDC) to another address
 * using LazorKit's gasless transaction infrastructure.
 *
 * Key considerations for Smart Wallets:
 * - Smart wallets are PDAs (off-curve), so we must use allowOwnerOffCurve=true
 * - The paymaster covers network fees
 *
 * @example
 * ```tsx
 * import { TokenTransferForm } from '@/components/transaction/token-transfer-form';
 *
 * export default function TokenPage() {
 *   return <TokenTransferForm />;
 * }
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  PublicKey,
  Connection,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
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
  ArrowRightLeft,
  Loader2,
  CheckCircle,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { env } from '@/config/env';
import { TOKENS, TOKEN_INFO } from '@/lib/constants';

interface TransferResult {
  signature: string;
  explorerUrl: string;
}

export function TokenTransferForm() {
  const { smartWalletPubkey, isConnected, signAndSendTransaction, isSigning } =
    useWallet();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use USDC as the default token
  const tokenMint = TOKENS.USDC_DEVNET;
  const tokenInfo = TOKEN_INFO[tokenMint.toBase58() as keyof typeof TOKEN_INFO];

  /**
   * Fetch token balance for the connected wallet
   */
  const fetchTokenBalance = useCallback(async () => {
    if (!smartWalletPubkey) {
      setTokenBalance(null);
      return;
    }

    setIsLoadingBalance(true);
    try {
      const connection = new Connection(env.RPC_URL, 'confirmed');

      // Get the associated token account for the smart wallet
      // CRITICAL: allowOwnerOffCurve = true because smart wallet is a PDA
      const ata = await getAssociatedTokenAddress(
        tokenMint,
        smartWalletPubkey,
        true // allowOwnerOffCurve - required for PDAs!
      );

      try {
        const account = await getAccount(connection, ata);
        const balance = Number(account.amount) / Math.pow(10, tokenInfo.decimals);
        setTokenBalance(balance);
      } catch {
        // Token account doesn't exist yet
        setTokenBalance(0);
      }
    } catch (err) {
      console.error('Failed to fetch token balance:', err);
      setTokenBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [smartWalletPubkey, tokenMint, tokenInfo.decimals]);

  // Fetch balance when wallet connects
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchTokenBalance();
    }
  }, [isConnected, smartWalletPubkey, fetchTokenBalance]);

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

    if (tokenBalance !== null && amountNum > tokenBalance) {
      setError('Insufficient token balance');
      return;
    }

    setIsSubmitting(true);

    try {
      const recipientPubkey = new PublicKey(recipient);

      // Get sender's ATA (allowOwnerOffCurve = true for PDA)
      const senderATA = await getAssociatedTokenAddress(
        tokenMint,
        smartWalletPubkey,
        true // CRITICAL: Smart wallet is a PDA
      );

      // Get recipient's ATA
      const recipientATA = await getAssociatedTokenAddress(
        tokenMint,
        recipientPubkey,
        false // Recipient might be a regular wallet
      );

      // Convert amount to token units
      const tokenAmount = Math.floor(
        amountNum * Math.pow(10, tokenInfo.decimals)
      );

      // Build the transfer instruction
      const instruction = createTransferInstruction(
        senderATA,
        recipientATA,
        smartWalletPubkey,
        tokenAmount,
        [],
        TOKEN_PROGRAM_ID
      );

      // Sign and send via LazorKit (gasless!)
      const signature = await signAndSendTransaction(instruction);

      // Build explorer URL
      const cluster = env.CLUSTER === 'devnet' ? '?cluster=devnet' : '';
      const explorerUrl = `https://explorer.solana.com/tx/${signature}${cluster}`;

      setResult({ signature, explorerUrl });
      toast.success(`${tokenInfo.symbol} transfer successful!`);

      // Refresh balance
      await fetchTokenBalance();

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
          <ArrowRightLeft className="h-5 w-5" />
          Send {tokenInfo.symbol}
        </CardTitle>
        <CardDescription>
          Transfer {tokenInfo.symbol} tokens to another wallet. Network fees are
          covered by the paymaster.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Token Balance Display */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {tokenInfo.logoUri && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tokenInfo.logoUri}
                  alt={tokenInfo.symbol}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="font-medium">{tokenInfo.symbol}</span>
            </div>
            <div className="text-right">
              {isLoadingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="font-mono">
                  {tokenBalance !== null ? tokenBalance.toFixed(2) : '0.00'}
                </span>
              )}
            </div>
          </div>

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
              <Label htmlFor="amount">Amount ({tokenInfo.symbol})</Label>
              {tokenBalance !== null && tokenBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(tokenBalance.toFixed(2))}
                  className="text-xs text-primary hover:underline"
                  disabled={!isConnected || isProcessing}
                >
                  Max: {tokenBalance.toFixed(2)}
                </button>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              step="0.01"
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

          {/* Get Devnet USDC hint */}
          {tokenBalance === 0 && (
            <p className="text-sm text-muted-foreground">
              Need Devnet {tokenInfo.symbol}? Use a faucet or airdrop to get test
              tokens.
            </p>
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
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Send {tokenInfo.symbol} (Gasless)
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
