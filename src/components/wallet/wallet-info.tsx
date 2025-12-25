'use client';

/**
 * Wallet Info Component
 *
 * Displays detailed information about the connected smart wallet including:
 * - Smart wallet public key (PDA)
 * - Passkey public key (secp256r1)
 * - Connection status
 * - Copy to clipboard functionality
 *
 * @example
 * ```tsx
 * import { WalletInfo } from '@/components/wallet/wallet-info';
 *
 * export default function WalletPage() {
 *   return <WalletInfo />;
 * }
 * ```
 */

import { useWallet } from '@lazorkit/wallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, ExternalLink, Wallet, Key } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { env } from '@/config/env';

export function WalletInfo() {
  const { smartWalletPubkey, wallet, isConnected, isLoading } =
    useWallet();

  // Get passkey public key from wallet info
  const passkeyPubkey = wallet?.passkeyPubkey;

  const [copiedField, setCopiedField] = useState<string | null>(null);

  /**
   * Copy text to clipboard with visual feedback
   */
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  /**
   * Get Solana Explorer URL for the wallet
   */
  const getExplorerUrl = (address: string) => {
    const cluster = env.CLUSTER === 'devnet' ? '?cluster=devnet' : '';
    return `https://explorer.solana.com/address/${address}${cluster}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Not connected state
  if (!isConnected || !smartWalletPubkey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Information
          </CardTitle>
          <CardDescription>
            Connect your wallet to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No wallet connected
          </div>
        </CardContent>
      </Card>
    );
  }

  const walletAddress = smartWalletPubkey.toBase58();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Information
          </CardTitle>
          <Badge variant="default" className="bg-green-500">
            Connected
          </Badge>
        </div>
        <CardDescription>
          Your LazorKit smart wallet details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Smart Wallet Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Smart Wallet Address (PDA)
          </label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-sm font-mono break-all">
              {walletAddress}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(walletAddress, 'wallet')}
              title="Copy address"
            >
              {copiedField === 'wallet' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              title="View on Explorer"
            >
              <a
                href={getExplorerUrl(walletAddress)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Passkey Info */}
        {passkeyPubkey && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4" />
              Passkey Public Key (secp256r1)
            </label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-xs font-mono break-all text-muted-foreground">
                {Array.isArray(passkeyPubkey)
                  ? `[${passkeyPubkey.slice(0, 8).join(', ')}...]`
                  : String(passkeyPubkey).slice(0, 32) + '...'}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              This key is stored securely in your device&apos;s Secure Enclave
            </p>
          </div>
        )}

        {/* Network Info */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Badge variant="outline">{env.CLUSTER}</Badge>
          <span className="text-sm text-muted-foreground">
            Gasless transactions enabled via LazorKit Paymaster
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
